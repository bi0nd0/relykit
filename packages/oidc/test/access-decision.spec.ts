import { describe, expect, it } from 'vitest'
import { decideAccess, type AccessRequirement } from '../src/index.js'

describe('access decisions', () => {
  it.each<{
    requirement: AccessRequirement
    principal: Parameters<typeof decideAccess>[1]
    expected: ReturnType<typeof decideAccess>['kind']
  }>([
    { requirement: 'public', principal: null, expected: 'allow' },
    { requirement: 'guest-only', principal: null, expected: 'allow' },
    { requirement: 'guest-only', principal: { active: true }, expected: 'redirect-authenticated' },
    { requirement: 'authenticated', principal: null, expected: 'login' },
    { requirement: 'authenticated', principal: { active: false }, expected: 'forbidden' },
    { requirement: 'authenticated', principal: { active: true }, expected: 'allow' },
    { requirement: { permission: 'reservations:write' }, principal: { active: true }, expected: 'forbidden' },
    {
      requirement: { permission: 'reservations:write' },
      principal: { active: true, permissions: ['reservations:write'] },
      expected: 'allow',
    },
  ])('returns $expected for $requirement', ({ requirement, principal, expected }) => {
    expect(decideAccess(requirement, principal)).toEqual({ kind: expected })
  })
})
