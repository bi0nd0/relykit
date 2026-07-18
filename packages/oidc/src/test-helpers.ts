import type { DiscoveryDocument } from './config.js'

export function createDiscoveryDocument(issuer: string): DiscoveryDocument {
  const normalized = issuer.replace(/\/$/, '')
  return {
    issuer: normalized,
    authorization_endpoint: `${normalized}/oauth2/authorize`,
    token_endpoint: `${normalized}/oauth2/token`,
    userinfo_endpoint: `${normalized}/oauth2/userinfo`,
    jwks_uri: `${normalized}/jwks`,
    end_session_endpoint: `${normalized}/oauth2/end-session`,
    code_challenge_methods_supported: ['S256'],
    token_endpoint_auth_methods_supported: ['client_secret_basic', 'client_secret_post', 'none'],
  }
}

export function jsonResponse(value: unknown, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}
