import type { AccessRequirement, VerifiedOidcIdentity } from '@relykit/oidc'
import type { H3Event } from 'h3'

export type PrincipalReference = {
  id: string
  issuer: string
  subject: string
}

export type ApplicationPrincipal = PrincipalReference & {
  active: boolean
  role: string
  permissions: string[]
  email: string | null
  name: string | null
}

export type AuthSessionData = {
  principal: PrincipalReference
  authenticatedAt: number
}

export type AuthClientSession =
  | {
      authenticated: true
      principal: ApplicationPrincipal
    }
  | {
      authenticated: false
      principal: null
      reason: 'anonymous' | 'forbidden'
    }

export type PrincipalAdapter<TProfile = unknown> = {
  resolveLogin(input: {
    event: H3Event
    identity: VerifiedOidcIdentity<TProfile>
  }): Promise<ApplicationPrincipal | null>
  reloadPrincipal(input: {
    event: H3Event
    reference: PrincipalReference
  }): Promise<ApplicationPrincipal | null>
}

export type AuthPageAccess = AccessRequirement
