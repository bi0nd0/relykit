import { randomBytes } from 'node:crypto'
import type { OidcLogoutRequest } from '@relykit/oidc'

function escapeAttribute(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

export function createLogoutForm(
  request: OidcLogoutRequest,
  copy = {
    title: 'Finishing sign-out…',
    message: 'Continue if this page does not move automatically.',
    action: 'Continue signing out',
  },
) {
  const nonce = randomBytes(24).toString('base64url')
  const fields = Object.entries(request.parameters)
    .filter((entry): entry is [string, string] => typeof entry[1] === 'string')
    .map(([name, value]) => `<input type="hidden" name="${escapeAttribute(name)}" value="${escapeAttribute(value)}">`)
    .join('')
  const endpoint = escapeAttribute(request.endpoint)
  const title = escapeAttribute(copy.title)
  const message = escapeAttribute(copy.message)
  const action = escapeAttribute(copy.action)
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><style nonce="${nonce}">body{font-family:system-ui,sans-serif;margin:0;min-height:100vh;display:grid;place-items:center;background:#fff;color:#18181b}main{max-width:32rem;padding:2rem;text-align:center}button{font:inherit;padding:.75rem 1rem;border:1px solid #d4d4d8;border-radius:.5rem;background:#fff;color:#18181b}</style></head><body><main><h1>${title}</h1><p>${message}</p><form method="post" action="${endpoint}">${fields}<button type="submit">${action}</button></form></main><script nonce="${nonce}">document.forms[0].submit()</script></body></html>`
  return {
    html,
    headers: {
      'cache-control': 'no-store, max-age=0',
      pragma: 'no-cache',
      'content-type': 'text/html; charset=utf-8',
      'content-security-policy': `default-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self' ${request.endpoint}; script-src 'nonce-${nonce}'; style-src 'nonce-${nonce}'`,
      'referrer-policy': 'no-referrer',
      'x-content-type-options': 'nosniff',
      'x-frame-options': 'DENY',
    },
  }
}
