import { afterEach, describe, expect, it } from 'vitest'
import { parseAuthRuntimeConfig } from '../src/runtime/config.js'

const valid = {
  issuer: 'https://identity.example.com',
  clientId: 'example-web',
  clientSecret: 'client-secret',
  clientAuthenticationMethod: 'client_secret_basic',
  redirectUri: 'https://app.example.com/api/auth/callback',
  postLogoutRedirectUri: 'https://app.example.com/api/auth/logout/callback',
  scopes: 'openid profile email',
  idTokenAlgorithms: 'RS256 ES256 EdDSA',
  requestTimeoutMs: '5000',
  sessionPassword: '0123456789abcdef0123456789abcdef',
  sessionMaxAgeSeconds: '28800',
  sessionCookieName: 'example-session',
  flowCookieName: 'example-flow',
  logoutCookieName: 'example-logout',
  secureCookies: 'auto',
}

const originalNodeEnv = process.env.NODE_ENV

afterEach(() => {
  process.env.NODE_ENV = originalNodeEnv
})

describe('Nuxt authentication runtime configuration', () => {
  it('normalizes server-only OIDC and session configuration', () => {
    expect(parseAuthRuntimeConfig(valid)).toMatchObject({
      oidc: {
        issuer: valid.issuer,
        scopes: ['openid', 'profile', 'email'],
        clientAuthentication: {
          method: 'client_secret_basic',
          clientSecret: 'client-secret',
        },
      },
      sessionMaxAgeSeconds: 28_800,
      sessionCookieName: 'example-session',
      flowCookieName: 'example-flow',
      logoutCookieName: 'example-logout',
      secureCookies: true,
    })
  })

  it('supports public clients without a secret', () => {
    expect(parseAuthRuntimeConfig({
      ...valid,
      clientAuthenticationMethod: 'none',
      clientSecret: '',
    }).oidc.clientAuthentication).toEqual({ method: 'none' })
  })

  it('allows loopback HTTP while deriving non-secure development cookies', () => {
    process.env.NODE_ENV = 'development'
    expect(parseAuthRuntimeConfig({
      ...valid,
      issuer: 'http://127.0.0.1:3000',
      redirectUri: 'http://127.0.0.1:3001/api/auth/callback',
      postLogoutRedirectUri: '',
    })).toMatchObject({ secureCookies: false })
  })

  it('fails closed for missing credentials, weak sessions, and insecure production cookies', () => {
    expect(() => parseAuthRuntimeConfig({ ...valid, clientSecret: '' })).toThrow()
    expect(() => parseAuthRuntimeConfig({ ...valid, sessionPassword: 'too-short' })).toThrow()
    expect(() => parseAuthRuntimeConfig({
      ...valid,
      postLogoutRedirectUri: 'https://other.example.com/api/auth/logout/callback',
    })).toThrow(/same application origin/)
    process.env.NODE_ENV = 'production'
    expect(() => parseAuthRuntimeConfig({
      ...valid,
      redirectUri: 'http://app.example.com/api/auth/callback',
      postLogoutRedirectUri: 'http://app.example.com/api/auth/logout/callback',
      secureCookies: false,
    })).toThrow(/Secure cookies/)
  })
})
