import { createError, type H3Event } from 'h3'
import { useRuntimeConfig } from 'nitropack/runtime/internal/config'
import type { NormalizedRelyKitNuxtModuleOptions } from '../../module-options.js'
import { parseAuthRuntimeConfig } from '../config.js'

type ModuleRuntimeConfig = {
  auth?: unknown
  authModule?: NormalizedRelyKitNuxtModuleOptions
}

export function requireAuthRuntimeConfig(event: H3Event) {
  const runtimeConfig = useRuntimeConfig(event) as ModuleRuntimeConfig
  try {
    return parseAuthRuntimeConfig(runtimeConfig.auth)
  } catch {
    throw createError({
      statusCode: 503,
      statusMessage: 'Authentication is not configured.',
    })
  }
}

export function requireAuthModuleOptions(event: H3Event) {
  const runtimeConfig = useRuntimeConfig(event) as ModuleRuntimeConfig
  if (!runtimeConfig.authModule) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Authentication is not configured.',
    })
  }
  return runtimeConfig.authModule
}
