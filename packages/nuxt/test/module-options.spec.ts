import { describe, expect, it } from 'vitest'
import { normalizeModuleOptions } from '../src/module-options.js'

describe('Nuxt module options', () => {
  it('defaults private applications to protected pages and APIs', () => {
    expect(normalizeModuleOptions({ principalAdapter: './server/principal-adapter.ts' })).toMatchObject({
      defaultPageAccess: 'authenticated',
      requiredApiPermission: '',
      loginPage: '/login',
      accessDeniedPage: '/access-denied',
      authenticatedHome: '/',
      protectedApiPrefixes: ['/api'],
      publicApiPaths: ['/api/health'],
      sessionCookieName: 'auth-session',
      flowCookieName: 'auth-flow',
      logoutCookieName: 'auth-logout',
      logoutCallbackPath: '/api/auth/logout/callback',
      logoutTransitionTitle: 'Finishing sign-out…',
    })
  })

  it('accepts application-owned default page and API permissions', () => {
    expect(normalizeModuleOptions({
      principalAdapter: './server/principal-adapter.ts',
      defaultPageAccess: { permission: 'rent-helper:admin' },
      requiredApiPermission: ' rent-helper:admin ',
    })).toMatchObject({
      defaultPageAccess: { permission: 'rent-helper:admin' },
      requiredApiPermission: 'rent-helper:admin',
    })
  })

  it('rejects a missing principal adapter and unsafe paths', () => {
    expect(() => normalizeModuleOptions({ principalAdapter: '' })).toThrow(/principalAdapter/)
    expect(() => normalizeModuleOptions({
      principalAdapter: './server/principal-adapter.ts',
      loginPage: '//evil.example/login',
    })).toThrow(/absolute application path/)
    expect(() => normalizeModuleOptions({
      principalAdapter: './server/principal-adapter.ts',
      accessPath: '/api/auth/access?bypass=true',
    })).toThrow(/query/)
    expect(() => normalizeModuleOptions({
      principalAdapter: './server/principal-adapter.ts',
      defaultPageAccess: { permission: ' ' },
    })).toThrow(/permission/)
    expect(() => normalizeModuleOptions({
      principalAdapter: './server/principal-adapter.ts',
      sessionCookieName: 'invalid cookie',
    })).toThrow(/cookie name/)
    expect(() => normalizeModuleOptions({
      principalAdapter: './server/principal-adapter.ts',
      sessionCookieName: 'same',
      flowCookieName: 'same',
    })).toThrow(/different/)
    expect(() => normalizeModuleOptions({
      principalAdapter: './server/principal-adapter.ts',
      flowCookieName: 'same',
      logoutCookieName: 'same',
    })).toThrow(/different/)
    expect(() => normalizeModuleOptions({
      principalAdapter: './server/principal-adapter.ts',
      loginPath: '/api/auth/callback',
    })).toThrow(/unique/)
  })
})
