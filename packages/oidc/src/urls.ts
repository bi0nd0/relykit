export function safeReturnPath(value: unknown, fallback = '/') {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) {
    return fallback
  }
  try {
    const url = new URL(value, 'https://local.invalid')
    return url.origin === 'https://local.invalid'
      ? `${url.pathname}${url.search}${url.hash}`
      : fallback
  } catch {
    return fallback
  }
}
