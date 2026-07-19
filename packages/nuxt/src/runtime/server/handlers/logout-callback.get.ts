import {
  defineEventHandler,
  getRequestURL,
  sendRedirect,
} from 'h3'
import { pathWithQuery } from '../redirects.js'
import { resolveLogoutCallback } from '../logout-state.js'
import {
  requireAuthModuleOptions,
  requireAuthRuntimeConfig,
} from '../runtime-config.js'
import {
  clearOidcLogoutCookie,
  useOidcLogoutSession,
} from '../session.js'

export default defineEventHandler(async (event) => {
  const config = requireAuthRuntimeConfig(event)
  const options = requireAuthModuleOptions(event)
  const callback = getRequestURL(event)
  const logoutSession = await useOidcLogoutSession(event, config)
  const idTokenHint = logoutSession.data.idTokenHint
  const expectedState = logoutSession.data.state
  const expiresAt = logoutSession.data.expiresAt
  const decision = resolveLogoutCallback({
    returnedState: callback.searchParams.get('state') ?? '',
    expectedState,
    expiresAt,
    providerError: callback.searchParams.has('error'),
  })
  if (decision.clearEvidence) {
    await logoutSession.clear()
    clearOidcLogoutCookie(event, config)
  } else if (decision.consumeState) {
    await logoutSession.update({
      ...(idTokenHint ? { idTokenHint } : {}),
      state: null,
      expiresAt: null,
    })
  }

  return sendRedirect(event, pathWithQuery(options.loginPage, { logout: decision.outcome }), 302)
})
