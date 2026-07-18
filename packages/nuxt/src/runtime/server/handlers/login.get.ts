import { startLogin } from '@relykit/oidc'
import {
  defineEventHandler,
  getQuery,
  sendRedirect,
} from 'h3'
import { safeRequestedReturnTo } from '../redirects.js'
import { requireAuthRuntimeConfig } from '../runtime-config.js'
import { useOidcFlowSession } from '../session.js'

export default defineEventHandler(async (event) => {
  const config = requireAuthRuntimeConfig(event)
  const returnTo = safeRequestedReturnTo(getQuery(event).returnTo)
  const login = await startLogin({ config: config.oidc, returnTo })
  const flowSession = await useOidcFlowSession(event, config)
  await flowSession.clear()
  await flowSession.update({ flow: login.flow })
  return sendRedirect(event, login.authorizationUrl, 302)
})
