import type { OidcLogoutRequest } from '@relykit/oidc'

export function createHintlessLogoutRedirect(request: OidcLogoutRequest) {
  if (request.method !== 'GET' || request.parameters.id_token_hint) {
    throw new Error('The hintless logout redirect requires a GET request without an ID-token hint.')
  }

  const location = new URL(request.endpoint)
  for (const [name, value] of Object.entries(request.parameters)) {
    if (typeof value === 'string') location.searchParams.append(name, value)
  }

  return {
    location: location.toString(),
    headers: {
      'cache-control': 'no-store, max-age=0',
      pragma: 'no-cache',
      'referrer-policy': 'no-referrer',
      'x-content-type-options': 'nosniff',
    },
  }
}
