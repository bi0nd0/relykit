import { startLogout } from '@relykit/oidc'
import { defineEventHandler } from 'h3'
import { requireAuthRuntimeConfig } from '../runtime-config.js'
import {
  clearAuthCookies,
  useApplicationSession,
  useOidcFlowSession,
} from '../session.js'

export default defineEventHandler(async (event) => {
  const config = requireAuthRuntimeConfig(event)
  const appSession = await useApplicationSession(event, config)
  const flowSession = await useOidcFlowSession(event, config)
  await Promise.all([appSession.clear(), flowSession.clear()])
  clearAuthCookies(event, config)

  return {
    logoutUrl: await startLogout({ config: config.oidc }),
  }
})
