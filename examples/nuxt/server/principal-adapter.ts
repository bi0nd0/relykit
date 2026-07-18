import type { PrincipalAdapter } from '@relykit/nuxt'

export default {
  async resolveLogin({ identity }) {
    return {
      id: `${identity.issuer}|${identity.subject}`,
      issuer: identity.issuer,
      subject: identity.subject,
      active: true,
      role: 'user',
      permissions: [],
      email: identity.email,
      name: identity.name,
    }
  },
  async reloadPrincipal({ reference }) {
    return {
      ...reference,
      active: true,
      role: 'user',
      permissions: [],
      email: null,
      name: null,
    }
  },
} satisfies PrincipalAdapter
