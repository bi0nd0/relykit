export type OidcErrorCode =
  | 'provider_unavailable'
  | 'invalid_discovery'
  | 'authorization_denied'
  | 'state_mismatch'
  | 'flow_expired'
  | 'missing_code'
  | 'token_exchange_failed'
  | 'token_validation_failed'
  | 'profile_validation_failed'

export class OidcFlowError extends Error {
  constructor(public readonly code: OidcErrorCode, message: string) {
    super(message)
    this.name = 'OidcFlowError'
  }
}
