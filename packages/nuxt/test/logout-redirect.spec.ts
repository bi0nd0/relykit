import { describe, expect, it } from 'vitest'
import type { OidcLogoutRequest } from '@relykit/oidc'
import { createHintlessLogoutRedirect } from '../src/runtime/server/logout-redirect.js'

describe('hintless logout redirect', () => {
  it('creates a no-store GET navigation containing only non-token parameters', () => {
    const response = createHintlessLogoutRedirect({
      endpoint: 'https://identity.example/oauth2/end-session',
      method: 'GET',
      parameters: {
        client_id: 'app-client',
        post_logout_redirect_uri: 'https://app.example/api/auth/logout/callback',
        state: 'round-trip-state',
      },
      state: 'round-trip-state',
    })

    const location = new URL(response.location)
    expect(location.origin + location.pathname).toBe('https://identity.example/oauth2/end-session')
    expect(location.searchParams.get('client_id')).toBe('app-client')
    expect(location.searchParams.get('post_logout_redirect_uri')).toBe('https://app.example/api/auth/logout/callback')
    expect(location.searchParams.get('state')).toBe('round-trip-state')
    expect(location.searchParams.has('id_token_hint')).toBe(false)
    expect(response.headers['cache-control']).toContain('no-store')
    expect(response.headers['referrer-policy']).toBe('no-referrer')
  })

  it('rejects any token-bearing or non-GET request', () => {
    expect(() => createHintlessLogoutRedirect({
      endpoint: 'https://identity.example/oauth2/end-session',
      method: 'POST',
      parameters: { client_id: 'app-client' },
      state: null,
    })).toThrow('requires a GET request')

    expect(() => createHintlessLogoutRedirect({
      endpoint: 'https://identity.example/oauth2/end-session',
      method: 'GET',
      parameters: { client_id: 'app-client', id_token_hint: 'signed-token' },
      state: null,
    } as unknown as OidcLogoutRequest)).toThrow('without an ID-token hint')
  })
})
