export class LoginInitiationError extends Error {}

type LoginInitiationInput = {
  method: string
  input: Record<string, unknown> | null | undefined
  configuredIssuer: string
}

function optionalSingleString(value: unknown, field: string) {
  if (value === undefined || value === null || value === '') return undefined
  if (typeof value !== 'string' || value.length > 2_048) {
    throw new LoginInitiationError(`${field} must be one bounded string.`)
  }
  return value
}

export function resolveLoginInitiation(input: LoginInitiationInput):
  | { kind: 'local', returnTo?: string }
  | { kind: 'third-party' } {
  const values = input.input ?? {}
  const issuer = optionalSingleString(values.iss, 'iss')
  const targetLinkUri = optionalSingleString(values.target_link_uri, 'target_link_uri')
  optionalSingleString(values.login_hint, 'login_hint')
  const returnTo = optionalSingleString(values.returnTo, 'returnTo')

  if (targetLinkUri) {
    throw new LoginInitiationError('target_link_uri is not supported.')
  }
  if (input.method.toUpperCase() === 'POST' && !issuer) {
    throw new LoginInitiationError('POST initiation requires iss.')
  }
  if (!issuer) return returnTo === undefined
    ? { kind: 'local' }
    : { kind: 'local', returnTo }
  if (issuer !== input.configuredIssuer) {
    throw new LoginInitiationError('iss does not match the configured issuer.')
  }
  return { kind: 'third-party' }
}
