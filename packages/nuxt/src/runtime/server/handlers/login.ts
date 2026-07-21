import { startLogin } from '@relykit/oidc'
import {
  createError,
  defineEventHandler,
  getQuery,
  readBody,
  sendRedirect,
} from 'h3'
import {
  LoginInitiationError,
  resolveLoginInitiation,
} from '../login-initiation.js'
import { safeRequestedReturnTo } from '../redirects.js'
import { requireAuthRuntimeConfig } from '../runtime-config.js'
import { useOidcFlowSession } from '../session.js'

export default defineEventHandler(async (event) => {
  const config = requireAuthRuntimeConfig(event)
  const requestInput = event.method === 'POST'
    ? await readBody<Record<string, unknown>>(event)
    : getQuery(event)
  let initiation
  try {
    initiation = resolveLoginInitiation({
      method: event.method,
      input: requestInput,
      configuredIssuer: config.oidc.issuer,
    })
  }
  catch (error) {
    if (!(error instanceof LoginInitiationError)) throw error
    throw createError({
      statusCode: 400,
      statusMessage: 'The sign-in request is invalid. Start again from the application.',
    })
  }

  const returnTo = initiation.kind === 'local'
    ? safeRequestedReturnTo(initiation.returnTo)
    : '/'
  const login = await startLogin({ config: config.oidc, returnTo })
  const flowSession = await useOidcFlowSession(event, config)
  await flowSession.clear()
  await flowSession.update({ flow: login.flow })
  return sendRedirect(event, login.authorizationUrl, 302)
})
