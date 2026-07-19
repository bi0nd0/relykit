import { timingSafeEqual } from 'node:crypto'

function equalState(left: string, right: string) {
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer)
}

export function isValidLogoutCallback(input: {
  returnedState: string
  expectedState: string | null | undefined
  expiresAt: number | null | undefined
  providerError: boolean
  now?: number
}) {
  return !input.providerError
    && typeof input.expectedState === 'string'
    && typeof input.expiresAt === 'number'
    && input.expiresAt > (input.now ?? Date.now())
    && equalState(input.returnedState, input.expectedState)
}

export function resolveLogoutCallback(input: Parameters<typeof isValidLogoutCallback>[0]) {
  const valid = isValidLogoutCallback(input)
  return {
    outcome: valid ? 'complete' as const : 'state_invalid' as const,
    clearEvidence: valid,
    consumeState: valid
      || typeof input.expectedState === 'string'
      || typeof input.expiresAt === 'number',
  }
}
