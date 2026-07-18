import type { PrincipalAdapter } from '@relykit/nuxt'

export default {
  async resolveLogin({ identity }) {
    if (identity.subject === 'denied-subject') return null
    return {
      id: 'fixture-principal',
      issuer: identity.issuer,
      subject: identity.subject,
      active: true,
      role: 'admin',
      permissions: ['fixture:admin'],
      email: identity.email,
      name: identity.name,
    }
  },
  async reloadPrincipal({ reference }) {
    return {
      ...reference,
      active: true,
      role: 'admin',
      permissions: ['fixture:admin'],
      email: 'admin@example.com',
      name: 'Fixture Admin',
    }
  },
} satisfies PrincipalAdapter
