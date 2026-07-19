import { finishLogin, OidcFlowError } from '@relykit/oidc'
import identityProfile from '#relykit/identity-profile'
import principalAdapter from '#relykit/principal-adapter'
import {
  createError,
  defineEventHandler,
  getRequestURL,
  sendRedirect,
} from 'h3'
import { validateLoginPrincipal } from '../principal.js'
import { pathWithQuery } from '../redirects.js'
import {
  requireAuthModuleOptions,
  requireAuthRuntimeConfig,
} from '../runtime-config.js'
import {
  clearOidcFlowCookie,
  useApplicationSession,
  useOidcFlowSession,
  useOidcLogoutSession,
} from '../session.js'

export default defineEventHandler(async (event) => {
  const config = requireAuthRuntimeConfig(event)
  const options = requireAuthModuleOptions(event)
  const flowSession = await useOidcFlowSession(event, config)
  const flow = flowSession.data.flow
  await flowSession.clear()
  clearOidcFlowCookie(event, config)

  if (!flow) {
    return sendRedirect(event, pathWithQuery(options.loginPage, { error: 'flow_missing' }), 302)
  }

  try {
    const result = await finishLogin({
      config: config.oidc,
      callbackUrl: getRequestURL(event).toString(),
      flow,
      identityProfile,
    })
    const logoutSession = await useOidcLogoutSession(event, config)
    await logoutSession.clear()
    await logoutSession.update({
      idTokenHint: result.idToken,
      state: null,
      expiresAt: null,
    })
    const resolved = await principalAdapter.resolveLogin({ event, identity: result.identity })
    const principal = validateLoginPrincipal(resolved, result.identity)

    if (!principal?.active) {
      return sendRedirect(event, pathWithQuery(options.accessDeniedPage, {
        reason: 'access_not_granted',
      }), 302)
    }

    const session = await useApplicationSession(event, config)
    await session.clear()
    await session.update({
      principal: {
        id: principal.id,
        issuer: principal.issuer,
        subject: principal.subject,
      },
      authenticatedAt: Date.now(),
    })
    return sendRedirect(event, result.returnTo, 302)
  } catch (error) {
    if (error instanceof OidcFlowError) {
      return sendRedirect(event, pathWithQuery(options.loginPage, { error: error.code }), 302)
    }
    throw createError({
      statusCode: 503,
      statusMessage: 'Authentication is temporarily unavailable.',
    })
  }
})
