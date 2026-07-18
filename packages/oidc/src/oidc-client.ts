import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'
import {
  createRemoteJWKSet,
  jwtVerify,
  type JWTVerifyGetKey,
} from 'jose'
import { z } from 'zod'
import { oidcClientConfigSchema, discoveryDocumentSchema, type DiscoveryDocument, type OidcClientConfig } from './config.js'
import { OidcFlowError } from './errors.js'
import {
  standardIdentityProfile,
  type IdentityProfileStrategy,
  type OidcUserInfo,
  type StandardIdentityProfile,
  type StandardOidcIdentity,
} from './identity-profile.js'
import { safeReturnPath } from './urls.js'

const tokenResponseSchema = z.object({
  access_token: z.string().min(1).max(16_384),
  token_type: z.string().min(1).max(100),
  expires_in: z.number().optional(),
  refresh_token: z.string().max(16_384).optional(),
  id_token: z.string().min(1).max(16_384),
  scope: z.string().max(2_000).optional(),
})

const MAX_OIDC_JSON_BYTES = 256 * 1024

const userInfoSchema = z.object({
  sub: z.string().min(1),
}).passthrough()

export type OidcFlowState = {
  state: string
  nonce: string
  verifier: string
  returnTo: string
  expiresAt: number
}

export type VerifiedOidcIdentity<TProfile = StandardIdentityProfile> = StandardOidcIdentity & {
  profile: TProfile
}

export type FinishLoginResult<TProfile = StandardIdentityProfile> = {
  identity: VerifiedOidcIdentity<TProfile>
  accessToken: string
  refreshToken: string | null
  idToken: string
  returnTo: string
}

function base64url(value: Buffer) {
  return value.toString('base64url')
}

function randomValue(bytes = 32) {
  return base64url(randomBytes(bytes))
}

function equals(left: string, right: string) {
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer)
}

async function fetchWithTimeout(fetcher: typeof fetch, url: string, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  timeout.unref?.()
  try { return await fetcher(url, { ...init, signal: controller.signal }) }
  finally { clearTimeout(timeout) }
}

async function boundedJson(response: Response, maximum = MAX_OIDC_JSON_BYTES): Promise<unknown> {
  const declared = Number(response.headers.get('content-length') ?? '0')
  if (declared > maximum) throw new Error('OIDC response exceeded the size limit.')
  if (!response.body) throw new Error('OIDC response body is missing.')
  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let bytes = 0
  try {
    while (true) {
      const result = await reader.read()
      if (result.done) break
      bytes += result.value.byteLength
      if (bytes > maximum) throw new Error('OIDC response exceeded the size limit.')
      chunks.push(result.value)
    }
  } finally { reader.releaseLock() }
  return JSON.parse(Buffer.concat(chunks.map(value => Buffer.from(value))).toString('utf8'))
}

export async function discover(
  rawConfig: OidcClientConfig,
  fetcher: typeof fetch = fetch,
): Promise<DiscoveryDocument> {
  const config = oidcClientConfigSchema.parse(rawConfig)
  try {
    const response = await fetchWithTimeout(fetcher, `${config.issuer}/.well-known/openid-configuration`, {
      headers: { accept: 'application/json' },
      redirect: 'error',
    }, config.requestTimeoutMs)
    if (!response.ok) {
      throw new OidcFlowError('provider_unavailable', 'The identity provider is unavailable.')
    }
    const document = discoveryDocumentSchema.parse(await boundedJson(response, 64 * 1024))
    if (document.issuer.replace(/\/$/, '') !== config.issuer) {
      throw new OidcFlowError('invalid_discovery', 'Discovery issuer does not match configuration.')
    }
    if (!document.code_challenge_methods_supported.includes('S256')) {
      throw new OidcFlowError('invalid_discovery', 'The provider does not advertise S256 PKCE.')
    }
    const method = config.clientAuthentication.method
    const advertisedMethods = document.token_endpoint_auth_methods_supported
    if (advertisedMethods && !advertisedMethods.includes(method)) {
      throw new OidcFlowError('invalid_discovery', 'The configured token endpoint authentication method is not supported.')
    }
    if (!advertisedMethods && method !== 'client_secret_basic') {
      throw new OidcFlowError('invalid_discovery', 'The provider must advertise the configured token endpoint authentication method.')
    }
    return document
  } catch (error) {
    if (error instanceof OidcFlowError) {
      throw error
    }
    throw new OidcFlowError('provider_unavailable', 'The identity provider is unavailable.')
  }
}

export async function startLogin(input: {
  config: OidcClientConfig
  returnTo?: string
  fetcher?: typeof fetch
  now?: number
}) {
  const config = oidcClientConfigSchema.parse(input.config)
  const discovery = await discover(config, input.fetcher)
  const verifier = randomValue(48)
  const state = randomValue()
  const nonce = randomValue()
  const flow: OidcFlowState = {
    state,
    nonce,
    verifier,
    returnTo: safeReturnPath(input.returnTo),
    expiresAt: (input.now ?? Date.now()) + 10 * 60_000,
  }
  const url = new URL(discovery.authorization_endpoint)
  url.search = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: config.scopes.join(' '),
    state,
    nonce,
    code_challenge: base64url(createHash('sha256').update(verifier).digest()),
    code_challenge_method: 'S256',
  }).toString()

  return { authorizationUrl: url.toString(), flow }
}

export async function finishLogin<TProfile = StandardIdentityProfile>(input: {
  config: OidcClientConfig
  callbackUrl: string
  flow: OidcFlowState
  identityProfile?: IdentityProfileStrategy<TProfile>
  fetcher?: typeof fetch
  key?: JWTVerifyGetKey
  now?: number
}): Promise<FinishLoginResult<TProfile>> {
  const config = oidcClientConfigSchema.parse(input.config)
  const callback = new URL(input.callbackUrl)
  const callbackState = callback.searchParams.get('state') ?? ''
  if (!equals(callbackState, input.flow.state)) {
    throw new OidcFlowError('state_mismatch', 'Authorization state does not match.')
  }
  if (input.flow.expiresAt <= (input.now ?? Date.now())) {
    throw new OidcFlowError('flow_expired', 'The authorization flow has expired.')
  }
  if (callback.searchParams.has('error')) {
    throw new OidcFlowError('authorization_denied', 'Authorization was denied.')
  }
  const code = callback.searchParams.get('code')
  if (!code) {
    throw new OidcFlowError('missing_code', 'Authorization code is missing.')
  }

  const discovery = await discover(config, input.fetcher)
  const fetcher = input.fetcher ?? fetch
  let tokens: z.infer<typeof tokenResponseSchema>
  try {
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: config.redirectUri,
      code_verifier: input.flow.verifier,
    })
    const headers: Record<string, string> = {
      'content-type': 'application/x-www-form-urlencoded',
      accept: 'application/json',
    }
    if (config.clientAuthentication.method === 'client_secret_basic') {
      headers.authorization = `Basic ${Buffer.from(`${config.clientId}:${config.clientAuthentication.clientSecret}`).toString('base64')}`
    } else {
      body.set('client_id', config.clientId)
      if (config.clientAuthentication.method === 'client_secret_post') {
        body.set('client_secret', config.clientAuthentication.clientSecret)
      }
    }
    const response = await fetchWithTimeout(fetcher, discovery.token_endpoint, {
      method: 'POST',
      headers,
      body,
      redirect: 'error',
    }, config.requestTimeoutMs)
    if (!response.ok) {
      throw new OidcFlowError('token_exchange_failed', 'Authorization code exchange failed.')
    }
    tokens = tokenResponseSchema.parse(await boundedJson(response))
  } catch (error) {
    if (error instanceof OidcFlowError) throw error
    throw new OidcFlowError('token_exchange_failed', 'Authorization code exchange failed.')
  }

  try {
    const key = input.key ?? createRemoteJWKSet(new URL(discovery.jwks_uri), { timeoutDuration: config.requestTimeoutMs })
    const verified = await jwtVerify(tokens.id_token, key, {
      issuer: config.issuer,
      audience: config.clientId,
      algorithms: config.idTokenAlgorithms,
    })
    if (!equals(String(verified.payload.nonce ?? ''), input.flow.nonce)) {
      throw new OidcFlowError('token_validation_failed', 'ID token nonce does not match.')
    }

    if (!verified.payload.sub) {
      throw new OidcFlowError('token_validation_failed', 'ID token subject is missing.')
    }

    const actor = verified.payload.act
    const actorSubject = actor
      && typeof actor === 'object'
      && !Array.isArray(actor)
      && 'sub' in actor
      && typeof actor.sub === 'string'
      ? actor.sub
      : null
    const audience = Array.isArray(verified.payload.aud)
      ? verified.payload.aud
      : verified.payload.aud ? [verified.payload.aud] : []
    const standardIdentity: StandardOidcIdentity = {
      issuer: verified.payload.iss!,
      subject: verified.payload.sub,
      audience,
      email: typeof verified.payload.email === 'string' ? verified.payload.email : null,
      emailVerified: verified.payload.email_verified === true,
      name: typeof verified.payload.name === 'string' ? verified.payload.name : null,
      preferredUsername: typeof verified.payload.preferred_username === 'string' ? verified.payload.preferred_username : null,
      actorSubject,
      claims: verified.payload,
    }

    const strategy: IdentityProfileStrategy<TProfile> = input.identityProfile
      ?? (standardIdentityProfile as IdentityProfileStrategy<TProfile>)
    const userInfoMode = strategy.userInfo ?? 'none'
    let userInfo: OidcUserInfo | null = null
    if (userInfoMode !== 'none') {
      if (!discovery.userinfo_endpoint) {
        if (userInfoMode === 'required') {
          throw new OidcFlowError('profile_validation_failed', 'The identity profile requires UserInfo support.')
        }
      } else {
        const userInfoResponse = await fetchWithTimeout(fetcher, discovery.userinfo_endpoint, {
          headers: {
            accept: 'application/json',
            authorization: `Bearer ${tokens.access_token}`,
          },
          redirect: 'error',
        }, config.requestTimeoutMs)
        if (!userInfoResponse.ok) {
          throw new OidcFlowError('profile_validation_failed', 'OIDC UserInfo validation failed.')
        }
        userInfo = userInfoSchema.parse(await boundedJson(userInfoResponse, 64 * 1024))
        if (userInfo.sub !== verified.payload.sub) {
          throw new OidcFlowError('token_validation_failed', 'UserInfo subject does not match the ID token.')
        }
      }
    }

    let profile: TProfile
    try {
      profile = await strategy.map({
        identity: standardIdentity,
        idTokenClaims: verified.payload,
        userInfo,
      })
    } catch {
      throw new OidcFlowError('profile_validation_failed', 'The identity profile could not be validated.')
    }

    return {
      identity: {
        ...standardIdentity,
        profile,
      },
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token ?? null,
      idToken: tokens.id_token,
      returnTo: safeReturnPath(input.flow.returnTo),
    }
  } catch (error) {
    if (error instanceof OidcFlowError) {
      throw error
    }
    throw new OidcFlowError('token_validation_failed', 'ID token validation failed.')
  }
}

export async function verifyAccessToken(input: {
  config: OidcClientConfig
  token: string
  audience: string
  key?: JWTVerifyGetKey
  fetcher?: typeof fetch
}) {
  const config = oidcClientConfigSchema.parse(input.config)
  const discovery = await discover(config, input.fetcher)
  const key = input.key ?? createRemoteJWKSet(new URL(discovery.jwks_uri), { timeoutDuration: config.requestTimeoutMs })
  return jwtVerify(input.token, key, {
    issuer: config.issuer,
    audience: input.audience,
    algorithms: config.idTokenAlgorithms,
  })
}

export async function startLogout(input: {
  config: OidcClientConfig
  idTokenHint?: string
  fetcher?: typeof fetch
}) {
  const config = oidcClientConfigSchema.parse(input.config)
  const discovery = await discover(config, input.fetcher)
  if (!discovery.end_session_endpoint) {
    return null
  }
  const url = new URL(discovery.end_session_endpoint)
  if (input.idTokenHint) {
    url.searchParams.set('id_token_hint', input.idTokenHint)
  }
  if (config.postLogoutRedirectUri) {
    url.searchParams.set('post_logout_redirect_uri', config.postLogoutRedirectUri)
  }
  return url.toString()
}
