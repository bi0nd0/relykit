import type { NormalizedRelyKitNuxtModuleOptions } from '../../module-options.js'

function matchesPrefix(path: string, prefix: string) {
  return path === prefix || path.startsWith(`${prefix}/`)
}

export function shouldProtectApi(path: string, options: NormalizedRelyKitNuxtModuleOptions) {
  const protectedPath = options.protectedApiPrefixes.some(prefix => matchesPrefix(path, prefix))
  if (!protectedPath) return false

  const modulePaths = [
    options.loginPath,
    options.callbackPath,
    options.logoutPath,
    options.logoutCallbackPath,
    options.accessPath,
  ]
  return ![
    ...modulePaths,
    ...options.publicApiPaths,
    ...options.independentlyAuthenticatedApiPaths,
  ].includes(path)
}
