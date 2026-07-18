import { defineEventHandler, getRequestURL } from 'h3'
import { requireActivePrincipal, requirePermission } from '../access.js'
import { shouldProtectApi } from '../api-policy.js'
import { requireAuthModuleOptions } from '../runtime-config.js'

export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname
  const options = requireAuthModuleOptions(event)
  if (!shouldProtectApi(path, options)) return
  if (options.requiredApiPermission) {
    await requirePermission(event, options.requiredApiPermission)
    return
  }
  await requireActivePrincipal(event)
})
