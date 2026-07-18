import { describe, expect, it } from 'vitest'
import { normalizeModuleOptions } from '../src/module-options.js'
import { shouldProtectApi } from '../src/runtime/server/api-policy.js'

const options = normalizeModuleOptions({
  principalAdapter: './server/principal-adapter.ts',
  independentlyAuthenticatedApiPaths: ['/api/inngest'],
})

describe('Nuxt server API policy', () => {
  it.each([
    ['/api/reservations', true],
    ['/api/reservations/one', true],
    ['/api/auth/login', false],
    ['/api/auth/callback', false],
    ['/api/auth/logout', false],
    ['/api/auth/access', false],
    ['/api/health', false],
    ['/api/inngest', false],
    ['/apiary', false],
    ['/calendar', false],
  ])('returns %s protection as %s', (path, expected) => {
    expect(shouldProtectApi(path, options)).toBe(expected)
  })
})
