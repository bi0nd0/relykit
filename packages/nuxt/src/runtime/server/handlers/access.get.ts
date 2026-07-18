import { defineEventHandler, isError } from 'h3'
import { requireActivePrincipal } from '../access.js'

export default defineEventHandler(async (event) => {
  try {
    return {
      authenticated: true as const,
      principal: await requireActivePrincipal(event),
    }
  } catch (error) {
    if (isError(error) && (error.statusCode === 401 || error.statusCode === 403)) {
      return {
        authenticated: false as const,
        principal: null,
        reason: error.statusCode === 403 ? 'forbidden' as const : 'anonymous' as const,
      }
    }
    throw error
  }
})
