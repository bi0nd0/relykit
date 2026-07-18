export type AccessRequirement =
  | 'public'
  | 'guest-only'
  | 'authenticated'
  | { permission: string }

export type AccessPrincipal = {
  active: boolean
  permissions?: readonly string[]
}

export type AccessDecision =
  | { kind: 'allow' }
  | { kind: 'login' }
  | { kind: 'forbidden' }
  | { kind: 'redirect-authenticated' }

export function decideAccess(
  requirement: AccessRequirement,
  principal: AccessPrincipal | null,
): AccessDecision {
  if (requirement === 'public') {
    return { kind: 'allow' }
  }

  if (requirement === 'guest-only') {
    return principal?.active
      ? { kind: 'redirect-authenticated' }
      : { kind: 'allow' }
  }

  if (!principal) {
    return { kind: 'login' }
  }

  if (!principal.active) {
    return { kind: 'forbidden' }
  }

  if (typeof requirement === 'object'
    && !principal.permissions?.includes(requirement.permission)) {
    return { kind: 'forbidden' }
  }

  return { kind: 'allow' }
}
