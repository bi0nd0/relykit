import { describe, expect, it } from 'vitest'
import { createLogoutForm } from '../src/runtime/server/logout-form.js'

describe('logout form transition', () => {
  it('submits complete logout parameters with strict transient-response controls', () => {
    const response = createLogoutForm({
      endpoint: 'https://identity.example/oauth2/end-session',
      method: 'POST',
      parameters: {
        client_id: 'app-client',
        id_token_hint: 'signed-token',
        post_logout_redirect_uri: 'https://app.example/api/auth/logout/callback',
        state: 'round-trip-state',
      },
      state: 'round-trip-state',
    })

    expect(response.html).toContain('method="post"')
    expect(response.html).toContain('action="https://identity.example/oauth2/end-session"')
    expect(response.html).toContain('name="id_token_hint" value="signed-token"')
    expect(response.html).toContain('name="state" value="round-trip-state"')
    expect(response.headers['cache-control']).toContain('no-store')
    expect(response.headers['referrer-policy']).toBe('no-referrer')
    expect(response.headers['content-security-policy']).toContain("form-action 'self' https://identity.example/oauth2/end-session")
    expect(response.headers['content-security-policy']).not.toContain("'unsafe-inline'")
  })

  it('uses consumer-owned transition copy', () => {
    const response = createLogoutForm({
      endpoint: 'https://identity.example/end-session',
      method: 'POST',
      parameters: { client_id: 'client' },
      state: null,
    }, {
      title: 'Ending your secure session',
      message: 'Please wait.',
      action: 'Continue',
    })
    expect(response.html).toContain('Ending your secure session')
    expect(response.html).toContain('Please wait.')
    expect(response.html).toContain('>Continue</button>')
  })

  it('escapes all provider-controlled attribute content', () => {
    const response = createLogoutForm({
      endpoint: 'https://identity.example/end-session',
      method: 'POST',
      parameters: {
        client_id: 'client"><script>alert(1)</script>',
      },
      state: null,
    })
    expect(response.html).not.toContain('<script>alert(1)</script>')
    expect(response.html).toContain('&quot;&gt;&lt;script&gt;')
  })
})
