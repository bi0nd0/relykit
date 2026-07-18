import type { VerifiedOidcIdentity } from '@relykit/oidc'
import { z } from 'zod'
import type { ApplicationPrincipal } from '../types.js'

const applicationPrincipalSchema = z.object({
  id: z.string().min(1),
  issuer: z.url(),
  subject: z.string().min(1),
  active: z.boolean(),
  role: z.string().min(1),
  permissions: z.array(z.string().min(1)),
  email: z.string().email().nullable(),
  name: z.string().min(1).nullable(),
})

export function validateLoginPrincipal(
  value: unknown,
  identity: VerifiedOidcIdentity<unknown>,
): ApplicationPrincipal | null {
  if (value === null) return null
  const principal = applicationPrincipalSchema.parse(value)
  if (principal.issuer !== identity.issuer || principal.subject !== identity.subject) {
    return null
  }
  return principal
}

export function validateReloadedPrincipal(value: unknown, reference: {
  id: string
  issuer: string
  subject: string
}): ApplicationPrincipal | null {
  if (value === null) return null
  const principal = applicationPrincipalSchema.parse(value)
  if (principal.id !== reference.id
    || principal.issuer !== reference.issuer
    || principal.subject !== reference.subject) {
    return null
  }
  return principal
}
