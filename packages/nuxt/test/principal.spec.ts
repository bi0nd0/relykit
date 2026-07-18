import { describe, expect, it } from 'vitest'
import { validateLoginPrincipal, validateReloadedPrincipal } from '../src/runtime/server/principal.js'

const identity = {
  issuer: 'https://identity.example.com/api/auth',
  subject: 'pairwise-subject',
  audience: ['rent-helper-web'],
  email: 'admin@example.com',
  emailVerified: true,
  name: 'Admin',
  preferredUsername: 'admin',
  actorSubject: null,
  claims: {},
  profile: {},
}

const principal = {
  id: 'principal-1',
  issuer: identity.issuer,
  subject: identity.subject,
  active: true,
  role: 'admin',
  permissions: ['rent-helper:admin'],
  email: identity.email,
  name: identity.name,
}

describe('application principal validation', () => {
  it('accepts an exact immutable identity binding', () => {
    expect(validateLoginPrincipal(principal, identity)).toEqual(principal)
    expect(validateReloadedPrincipal(principal, {
      id: principal.id,
      issuer: principal.issuer,
      subject: principal.subject,
    })).toEqual(principal)
  })

  it('denies adapter results that change the binding', () => {
    expect(validateLoginPrincipal({ ...principal, subject: 'other' }, identity)).toBeNull()
    expect(validateReloadedPrincipal({ ...principal, id: 'other' }, {
      id: principal.id,
      issuer: principal.issuer,
      subject: principal.subject,
    })).toBeNull()
  })
})
