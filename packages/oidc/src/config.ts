import { z } from 'zod'

export const tokenEndpointAuthMethodSchema = z.enum([
  'client_secret_basic',
  'client_secret_post',
  'none',
])

export type TokenEndpointAuthMethod = z.infer<typeof tokenEndpointAuthMethodSchema>

export const clientAuthenticationSchema = z.discriminatedUnion('method', [
  z.object({
    method: z.literal('client_secret_basic'),
    clientSecret: z.string().min(1),
  }),
  z.object({
    method: z.literal('client_secret_post'),
    clientSecret: z.string().min(1),
  }),
  z.object({
    method: z.literal('none'),
  }),
])

export type ClientAuthentication = z.infer<typeof clientAuthenticationSchema>

export const oidcClientConfigSchema = z.object({
  issuer: z.url().transform(value => value.replace(/\/$/, '')),
  clientId: z.string().min(1),
  clientAuthentication: clientAuthenticationSchema,
  redirectUri: z.url(),
  postLogoutRedirectUri: z.url().optional(),
  scopes: z.array(z.string().min(1)).min(1).default(['openid', 'profile', 'email']),
  idTokenAlgorithms: z.array(z.enum(['RS256', 'ES256', 'EdDSA'])).min(1).default(['RS256', 'ES256', 'EdDSA']),
  requestTimeoutMs: z.number().int().positive().default(5_000),
}).superRefine((value, context) => {
  if (!value.scopes.includes('openid')) {
    context.addIssue({ code: 'custom', path: ['scopes'], message: 'OIDC scopes must include openid.' })
  }
})

export type OidcClientConfig = z.infer<typeof oidcClientConfigSchema>

export const discoveryDocumentSchema = z.object({
  issuer: z.url(),
  authorization_endpoint: z.url(),
  token_endpoint: z.url(),
  userinfo_endpoint: z.url().optional(),
  jwks_uri: z.url(),
  end_session_endpoint: z.url().optional(),
  code_challenge_methods_supported: z.array(z.string()).default([]),
  token_endpoint_auth_methods_supported: z.array(tokenEndpointAuthMethodSchema).optional(),
})

export type DiscoveryDocument = z.infer<typeof discoveryDocumentSchema>
