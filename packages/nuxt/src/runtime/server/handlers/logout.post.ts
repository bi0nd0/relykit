import { startLogout } from '@relykit/oidc'
import {
  createError,
  defineEventHandler,
  getHeader,
  getRequestURL,
  send,
  sendRedirect,
  setResponseHeaders,
} from 'h3'
import { pathWithQuery } from '../redirects.js'
import { createLogoutForm } from '../logout-form.js'
import {
  requireAuthModuleOptions,
  requireAuthRuntimeConfig,
} from '../runtime-config.js'
import {
  clearAuthCookies,
  useApplicationSession,
  useOidcFlowSession,
  useOidcLogoutSession,
} from '../session.js'

function requireSameOrigin(event: Parameters<typeof getRequestURL>[0]) {
  const requestOrigin = getHeader(event, 'origin')
  const expectedOrigin = getRequestURL(event).origin
  if (requestOrigin !== expectedOrigin || getHeader(event, 'sec-fetch-site') === 'cross-site') {
    throw createError({ statusCode: 403, statusMessage: 'Sign-out request origin is not allowed.' })
  }
}

export default defineEventHandler(async (event) => {
  requireSameOrigin(event)
  const config = requireAuthRuntimeConfig(event)
  const options = requireAuthModuleOptions(event)
  const configuredCallback = config.oidc.postLogoutRedirectUri
  if (!configuredCallback || new URL(configuredCallback).pathname !== options.logoutCallbackPath) {
    throw createError({ statusCode: 503, statusMessage: 'Authentication logout is not configured.' })
  }

  const appSession = await useApplicationSession(event, config)
  const flowSession = await useOidcFlowSession(event, config)
  const logoutSession = await useOidcLogoutSession(event, config)
  const idTokenHint = logoutSession.data.idTokenHint
  await Promise.all([appSession.clear(), flowSession.clear()])
  clearAuthCookies(event, config)

  let request
  try {
    request = await startLogout({
      config: config.oidc,
      ...(idTokenHint ? { idTokenHint } : {}),
    })
  } catch {
    return sendRedirect(event, pathWithQuery(options.loginPage, { logout: 'provider_unavailable' }), 303)
  }
  if (!request || !request.state) {
    return sendRedirect(event, pathWithQuery(options.loginPage, { logout: 'provider_unavailable' }), 303)
  }
  await logoutSession.update({
    state: request.state,
    expiresAt: Date.now() + 10 * 60_000,
  })

  const response = createLogoutForm(request, {
    title: options.logoutTransitionTitle,
    message: options.logoutTransitionMessage,
    action: options.logoutTransitionAction,
  })
  setResponseHeaders(event, response.headers)
  return send(event, response.html, 'text/html; charset=utf-8')
})
