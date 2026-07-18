import type { JWTPayload } from 'jose'

export type OidcUserInfo = {
  sub: string
  [claim: string]: unknown
}

export type StandardOidcIdentity = {
  issuer: string
  subject: string
  audience: string[]
  email: string | null
  emailVerified: boolean
  name: string | null
  preferredUsername: string | null
  actorSubject: string | null
  claims: JWTPayload
}

export type IdentityProfileContext = {
  identity: StandardOidcIdentity
  idTokenClaims: JWTPayload
  userInfo: OidcUserInfo | null
}

export type UserInfoMode = 'none' | 'optional' | 'required'

export type IdentityProfileStrategy<TProfile> = {
  userInfo?: UserInfoMode
  map(context: IdentityProfileContext): TProfile | Promise<TProfile>
}

export type StandardIdentityProfile = Record<string, never>

export const standardIdentityProfile: IdentityProfileStrategy<StandardIdentityProfile> = {
  userInfo: 'none',
  map: () => ({}),
}
