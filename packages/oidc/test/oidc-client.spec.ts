import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from 'jose'
import { z } from 'zod'
import { describe, expect, it, vi } from 'vitest'
import {
  finishLogin,
  safeReturnPath,
  startLogin,
  type IdentityProfileStrategy,
  type OidcClientConfig,
  type OidcFlowError,
  type TokenEndpointAuthMethod,
} from '../src/index.js'
import { createDiscoveryDocument, jsonResponse } from '../src/test-helpers.js'

const config: OidcClientConfig = {
  issuer: 'https://identity.example.com',
  clientId: 'example-web',
  clientAuthentication: {
    method: 'client_secret_basic',
    clientSecret: 'client-secret',
  },
  redirectUri: 'https://app.example.com/api/auth/callback',
  postLogoutRedirectUri: 'https://app.example.com/',
  scopes: ['openid', 'profile', 'email'],
  idTokenAlgorithms: ['RS256', 'ES256', 'EdDSA'],
  requestTimeoutMs: 1_000,
}

function discoveryFetch(document = createDiscoveryDocument(config.issuer)) {
  return vi.fn<typeof fetch>().mockResolvedValue(jsonResponse(document))
}

async function signedLogin(input: {
  oidc?: OidcClientConfig
  claims?: Record<string, unknown>
  identityProfile?: IdentityProfileStrategy<unknown>
  userInfo?: Record<string, unknown>
  discovery?: ReturnType<typeof createDiscoveryDocument>
}) {
  const oidc = input.oidc ?? config
  const discovery = input.discovery ?? createDiscoveryDocument(oidc.issuer)
  const { privateKey, publicKey } = await generateKeyPair('RS256')
  const publicJwk = await exportJWK(publicKey)
  const started = await startLogin({ config: oidc, fetcher: discoveryFetch(discovery), now: 1_000 })
  const idToken = await new SignJWT({ nonce: started.flow.nonce, ...input.claims })
    .setProtectedHeader({ alg: 'RS256', kid: 'test' })
    .setIssuer(oidc.issuer)
    .setAudience(oidc.clientId)
    .setSubject('subject-1')
    .setIssuedAt()
    .setExpirationTime('5m')
    .sign(privateKey)
  const fetcher = vi.fn<typeof fetch>()
    .mockResolvedValueOnce(jsonResponse(discovery))
    .mockResolvedValueOnce(jsonResponse({
      access_token: 'access-token',
      token_type: 'Bearer',
      id_token: idToken,
    }))
  if (input.userInfo) fetcher.mockResolvedValueOnce(jsonResponse(input.userInfo))

  const result = await finishLogin({
    config: oidc,
    callbackUrl: `${oidc.redirectUri}?code=abc&state=${started.flow.state}`,
    flow: started.flow,
    fetcher,
    key: createLocalJWKSet({ keys: [{ ...publicJwk, kid: 'test', alg: 'RS256' }] }),
    identityProfile: input.identityProfile,
    now: 2_000,
  })
  return { result, fetcher }
}

describe('provider-neutral OIDC client', () => {
  it('creates S256 authorization state and rejects unsafe return paths', async () => {
    const result = await startLogin({ config, returnTo: '//evil.example/path', fetcher: discoveryFetch() })
    const url = new URL(result.authorizationUrl)
    expect(url.searchParams.get('code_challenge_method')).toBe('S256')
    expect(url.searchParams.get('state')).toBe(result.flow.state)
    expect(result.flow.returnTo).toBe('/')
    expect(safeReturnPath('/calendar?month=1')).toBe('/calendar?month=1')
  })

  it('rejects a callback with mismatched state before token exchange', async () => {
    const login = await startLogin({ config, fetcher: discoveryFetch(), now: 1_000 })
    await expect(finishLogin({
      config,
      callbackUrl: `${config.redirectUri}?code=abc&state=wrong`,
      flow: login.flow,
      fetcher: discoveryFetch(),
      now: 2_000,
    })).rejects.toMatchObject<Partial<OidcFlowError>>({ code: 'state_mismatch' })
  })

  it('bounds discovery responses and times out unavailable providers', async () => {
    const oversized = vi.fn<typeof fetch>().mockResolvedValue(new Response(new Uint8Array(65 * 1024), { status: 200 }))
    await expect(startLogin({ config, fetcher: oversized })).rejects.toMatchObject<Partial<OidcFlowError>>({
      code: 'provider_unavailable',
    })

    const timeoutFetcher = vi.fn<typeof fetch>((_url, init) => new Promise((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true })
    }))
    await expect(startLogin({
      config: { ...config, requestTimeoutMs: 5 },
      fetcher: timeoutFetcher,
    })).rejects.toMatchObject<Partial<OidcFlowError>>({ code: 'provider_unavailable' })
  })

  it('returns only standard identity fields when no custom profile is configured', async () => {
    const { result } = await signedLogin({
      claims: {
        email: 'admin@example.com',
        email_verified: true,
        name: 'Admin',
        preferred_username: 'admin',
      },
    })

    expect(result.identity).toMatchObject({
      issuer: config.issuer,
      subject: 'subject-1',
      email: 'admin@example.com',
      preferredUsername: 'admin',
      profile: {},
    })
    expect(result.identity).not.toHaveProperty('realmId')
    expect(result.identity).not.toHaveProperty('tenantContext')
  })

  it('maps consumer claims through a typed identity-profile strategy', async () => {
    const profileSchema = z.object({ account: z.string().min(1) })
    const strategy: IdentityProfileStrategy<{ account: string }> = {
      userInfo: 'required',
      map: ({ userInfo }) => profileSchema.parse({
        account: userInfo?.['https://identity.example.com/claims/account'],
      }),
    }
    const { result } = await signedLogin({
      identityProfile: strategy,
      userInfo: {
        sub: 'subject-1',
        'https://identity.example.com/claims/account': 'account-42',
      },
    })

    expect(result.identity.profile).toEqual({ account: 'account-42' })
  })

  it('maps custom-profile failures to a stable error without claim contents', async () => {
    const strategy: IdentityProfileStrategy<{ account: string }> = {
      map: () => {
        throw new Error('secret raw token value')
      },
    }
    await expect(signedLogin({ identityProfile: strategy })).rejects.toMatchObject<Partial<OidcFlowError>>({
      code: 'profile_validation_failed',
      message: 'The identity profile could not be validated.',
    })
  })

  it('allows optional UserInfo when the provider does not expose an endpoint', async () => {
    const discovery = createDiscoveryDocument(config.issuer)
    delete discovery.userinfo_endpoint
    const strategy: IdentityProfileStrategy<{ source: string }> = {
      userInfo: 'optional',
      map: ({ userInfo }) => ({ source: userInfo ? 'userinfo' : 'id-token' }),
    }
    const { result } = await signedLogin({ identityProfile: strategy, discovery })
    expect(result.identity.profile).toEqual({ source: 'id-token' })
  })

  it('rejects UserInfo from a mismatched subject', async () => {
    const strategy: IdentityProfileStrategy<Record<string, never>> = {
      userInfo: 'required',
      map: () => ({}),
    }
    await expect(signedLogin({
      identityProfile: strategy,
      userInfo: { sub: 'other-subject' },
    })).rejects.toMatchObject<Partial<OidcFlowError>>({ code: 'token_validation_failed' })
  })

  it.each([
    'client_secret_basic',
    'client_secret_post',
    'none',
  ] satisfies TokenEndpointAuthMethod[])('uses %s without leaking credentials into URLs', async (method) => {
    const oidc: OidcClientConfig = {
      ...config,
      clientAuthentication: method === 'none'
        ? { method }
        : { method, clientSecret: 'method-secret' },
    }
    const { fetcher } = await signedLogin({ oidc })
    const [tokenUrl, tokenInit] = fetcher.mock.calls[1]!
    const headers = new Headers(tokenInit?.headers)
    const body = new URLSearchParams(String(tokenInit?.body))

    expect(String(tokenUrl)).not.toContain('method-secret')
    expect(body.get('client_secret')).toBe(method === 'client_secret_post' ? 'method-secret' : null)
    expect(headers.get('authorization')?.startsWith('Basic ') ?? false).toBe(method === 'client_secret_basic')
    if (method === 'none') expect(body.get('client_id')).toBe(config.clientId)
  })

  it('fails closed when discovery does not advertise a non-default auth method', async () => {
    const discovery = createDiscoveryDocument(config.issuer)
    delete discovery.token_endpoint_auth_methods_supported
    await expect(startLogin({
      config: {
        ...config,
        clientAuthentication: { method: 'none' },
      },
      fetcher: discoveryFetch(discovery),
    })).rejects.toMatchObject<Partial<OidcFlowError>>({ code: 'invalid_discovery' })
  })
})
