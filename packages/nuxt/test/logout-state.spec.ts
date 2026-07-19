import { describe, expect, it } from 'vitest'
import { isValidLogoutCallback, resolveLogoutCallback } from '../src/runtime/server/logout-state.js'

describe('logout callback state', () => {
  it('accepts only the expected unexpired state', () => {
    expect(isValidLogoutCallback({
      returnedState: 'expected-state',
      expectedState: 'expected-state',
      expiresAt: 2_000,
      providerError: false,
      now: 1_000,
    })).toBe(true)
  })

  it.each([
    { returnedState: 'wrong', expectedState: 'expected', expiresAt: 2_000, providerError: false },
    { returnedState: 'expected', expectedState: undefined, expiresAt: 2_000, providerError: false },
    { returnedState: 'expected', expectedState: 'expected', expiresAt: 1_000, providerError: false },
    { returnedState: 'expected', expectedState: 'expected', expiresAt: 2_000, providerError: true },
  ])('rejects invalid callback input %#', (input) => {
    expect(isValidLogoutCallback({ ...input, now: 1_000 })).toBe(false)
  })

  it('clears retained logout evidence only after a valid callback', () => {
    expect(resolveLogoutCallback({
      returnedState: 'expected-state',
      expectedState: 'expected-state',
      expiresAt: 2_000,
      providerError: false,
      now: 1_000,
    })).toEqual({ outcome: 'complete', clearEvidence: true, consumeState: true })
  })

  it('consumes active invalid state while retaining evidence for retry', () => {
    expect(resolveLogoutCallback({
      returnedState: 'wrong-state',
      expectedState: 'expected-state',
      expiresAt: 2_000,
      providerError: false,
      now: 1_000,
    })).toEqual({ outcome: 'state_invalid', clearEvidence: false, consumeState: true })
  })

  it('does not alter retained evidence for an unsolicited callback', () => {
    expect(resolveLogoutCallback({
      returnedState: 'untrusted-state',
      expectedState: null,
      expiresAt: null,
      providerError: false,
      now: 1_000,
    })).toEqual({ outcome: 'state_invalid', clearEvidence: false, consumeState: false })
  })
})
