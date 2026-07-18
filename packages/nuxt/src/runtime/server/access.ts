import principalAdapter from '#relykit/principal-adapter'
import { createError, type H3Event } from 'h3'
import type { ApplicationPrincipal } from '../types.js'
import { validateReloadedPrincipal } from './principal.js'
import { requireAuthRuntimeConfig } from './runtime-config.js'
import { readApplicationSession } from './session.js'

export async function requireActivePrincipal(event: H3Event): Promise<ApplicationPrincipal> {
  const config = requireAuthRuntimeConfig(event)
  const session = await readApplicationSession(event, config)
  const reference = session?.principal

  if (!reference) {
    throw createError({ statusCode: 401, statusMessage: 'Authentication required.' })
  }

  let principal: ApplicationPrincipal | null
  try {
    principal = validateReloadedPrincipal(
      await principalAdapter.reloadPrincipal({ event, reference }),
      reference,
    )
  } catch {
    throw createError({ statusCode: 503, statusMessage: 'Authorization is temporarily unavailable.' })
  }

  if (!principal?.active) {
    throw createError({ statusCode: 403, statusMessage: 'Access is not granted.' })
  }

  event.context.authPrincipal = principal
  return principal
}

export async function requirePermission(event: H3Event, permission: string) {
  const principal = event.context.authPrincipal ?? await requireActivePrincipal(event)
  if (!principal.permissions.includes(permission)) {
    throw createError({ statusCode: 403, statusMessage: 'Permission denied.' })
  }
  return principal
}
