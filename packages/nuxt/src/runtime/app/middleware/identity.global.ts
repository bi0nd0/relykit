import { decideAccess, safeReturnPath, type AccessRequirement } from '@relykit/oidc/access'
import {
  createError,
  defineNuxtRouteMiddleware,
  navigateTo,
  useRuntimeConfig,
} from 'nuxt/app'
import { useAuthSession } from '../composables/use-identity-session.js'

type PublicAuthConfig = {
  defaultPageAccess: AccessRequirement
  loginPage: string
  accessDeniedPage: string
  authenticatedHome: string
}

export default defineNuxtRouteMiddleware(async (to) => {
  const config = useRuntimeConfig().public.auth as PublicAuthConfig
  const requirement = (to.meta.auth ?? config.defaultPageAccess) as AccessRequirement
  if (requirement === 'public') return

  const result = await useAuthSession().refresh()
  if (result.kind === 'unavailable') {
    throw createError({ statusCode: 503, statusMessage: 'Authorization is temporarily unavailable.' })
  }
  if (result.kind === 'forbidden') {
    if (to.path === config.accessDeniedPage) return
    return navigateTo(config.accessDeniedPage)
  }

  const principal = result.kind === 'authenticated'
    ? result.session.principal
    : null
  const decision = decideAccess(requirement, principal)

  if (decision.kind === 'login') {
    return navigateTo({
      path: config.loginPage,
      query: { returnTo: safeReturnPath(to.fullPath) },
    })
  }
  if (decision.kind === 'forbidden') {
    return navigateTo(config.accessDeniedPage)
  }
  if (decision.kind === 'redirect-authenticated') {
    return navigateTo(config.authenticatedHome)
  }
})
