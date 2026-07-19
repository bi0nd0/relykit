import { oidcClientConfigSchema, tokenEndpointAuthMethodSchema, type OidcClientConfig } from '@relykit/oidc'
import { z } from 'zod'

function optionalUrl(value: unknown) {
  return value === '' || value === null || value === undefined ? undefined : value
}

function list(value: unknown) {
  if (Array.isArray(value)) return value
  if (typeof value === 'string') return value.split(/\s+/).filter(Boolean)
  return value
}

function optionalSecret(value: unknown) {
  return value === '' || value === null || value === undefined ? undefined : value
}

function secureCookieSetting(value: unknown) {
  if (value === '' || value === null || value === undefined || value === 'auto') return 'auto'
  if (value === true || value === 'true') return true
  if (value === false || value === 'false') return false
  return value
}

const cookieNameSchema = z.string().regex(/^[!#$%&'*+.^`|~\w-]{1,128}$/)

const authRuntimeConfigSchema = z.object({
  issuer: z.url(),
  clientId: z.string().min(1),
  clientSecret: z.preprocess(optionalSecret, z.string().min(1).optional()),
  clientAuthenticationMethod: tokenEndpointAuthMethodSchema.default('client_secret_basic'),
  redirectUri: z.url(),
  postLogoutRedirectUri: z.preprocess(optionalUrl, z.url().optional()),
  scopes: z.preprocess(list, z.array(z.string().min(1)).min(1)),
  idTokenAlgorithms: z.preprocess(list, z.array(z.enum(['RS256', 'ES256', 'EdDSA'])).min(1)),
  requestTimeoutMs: z.coerce.number().int().positive().max(30_000),
  sessionPassword: z.string().min(32),
  sessionMaxAgeSeconds: z.coerce.number().int().positive().max(60 * 60 * 24 * 30),
  sessionCookieName: cookieNameSchema,
  flowCookieName: cookieNameSchema,
  logoutCookieName: cookieNameSchema,
  secureCookies: z.preprocess(secureCookieSetting, z.union([z.literal('auto'), z.boolean()])),
}).superRefine((value, context) => {
  if (value.clientAuthenticationMethod !== 'none' && !value.clientSecret) {
    context.addIssue({ code: 'custom', path: ['clientSecret'], message: 'A client secret is required for confidential clients.' })
  }
  const cookieNames = [value.sessionCookieName, value.flowCookieName, value.logoutCookieName]
  if (new Set(cookieNames).size !== cookieNames.length) {
    context.addIssue({ code: 'custom', path: ['logoutCookieName'], message: 'Authentication cookies must use distinct names.' })
  }
  if (value.postLogoutRedirectUri
    && new URL(value.postLogoutRedirectUri).origin !== new URL(value.redirectUri).origin) {
    context.addIssue({
      code: 'custom',
      path: ['postLogoutRedirectUri'],
      message: 'The logout callback must use the same application origin as the login callback.',
    })
  }
})

export type AuthRuntimeConfig = {
  oidc: OidcClientConfig
  sessionPassword: string
  sessionMaxAgeSeconds: number
  sessionCookieName: string
  flowCookieName: string
  logoutCookieName: string
  secureCookies: boolean
}

function isLoopbackHostname(hostname: string) {
  return hostname === 'localhost' || hostname === '::1' || hostname.startsWith('127.')
}

export function parseAuthRuntimeConfig(value: unknown): AuthRuntimeConfig {
  const parsed = authRuntimeConfigSchema.parse(value)
  const clientAuthentication = parsed.clientAuthenticationMethod === 'none'
    ? { method: 'none' as const }
    : {
        method: parsed.clientAuthenticationMethod,
        clientSecret: parsed.clientSecret!,
      }
  const oidc = oidcClientConfigSchema.parse({
    issuer: parsed.issuer,
    clientId: parsed.clientId,
    clientAuthentication,
    redirectUri: parsed.redirectUri,
    ...(parsed.postLogoutRedirectUri ? { postLogoutRedirectUri: parsed.postLogoutRedirectUri } : {}),
    scopes: parsed.scopes,
    idTokenAlgorithms: parsed.idTokenAlgorithms,
    requestTimeoutMs: parsed.requestTimeoutMs,
  })
  const secureCookies = parsed.secureCookies === 'auto'
    ? new URL(parsed.redirectUri).protocol === 'https:'
    : parsed.secureCookies

  if (process.env.NODE_ENV === 'production'
    && !secureCookies
    && !isLoopbackHostname(new URL(parsed.redirectUri).hostname)) {
    throw new Error('Secure cookies may only be disabled for local development.')
  }

  return {
    oidc,
    sessionPassword: parsed.sessionPassword,
    sessionMaxAgeSeconds: parsed.sessionMaxAgeSeconds,
    sessionCookieName: parsed.sessionCookieName,
    flowCookieName: parsed.flowCookieName,
    logoutCookieName: parsed.logoutCookieName,
    secureCookies,
  }
}
