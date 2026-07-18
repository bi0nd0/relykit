import { describe, expect, it } from 'vitest'
import { pathWithQuery, safeRequestedReturnTo } from '../src/runtime/server/redirects.js'

describe('Nuxt auth redirects', () => {
  it('preserves only local return targets', () => {
    expect(safeRequestedReturnTo('/reservations?status=held')).toBe('/reservations?status=held')
    expect(safeRequestedReturnTo('//evil.example/path')).toBe('/')
    expect(safeRequestedReturnTo('https://evil.example/path')).toBe('/')
  })

  it('encodes stable error query values', () => {
    expect(pathWithQuery('/login', { error: 'state mismatch' })).toBe('/login?error=state+mismatch')
  })
})
