import { safeReturnPath } from '@relykit/oidc'

export function pathWithQuery(path: string, query: Record<string, string | undefined>) {
  const url = new URL(path, 'https://app.invalid')
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) url.searchParams.set(key, value)
  }
  return `${url.pathname}${url.search}`
}

export function safeRequestedReturnTo(value: unknown) {
  return safeReturnPath(typeof value === 'string' ? value : '/')
}
