import { createHash } from 'node:crypto'
import type { OidcFlowState } from '@relykit/oidc'
import {
  deleteCookie,
  getCookie,
  unsealSession,
  useSession,
  type H3Event,
  type SessionConfig,
} from 'h3'
import type { AuthRuntimeConfig } from '../config.js'
import type { AuthSessionData } from '../types.js'

type OidcFlowSessionData = {
  flow?: OidcFlowState
}

export type OidcLogoutSessionData = {
  idTokenHint?: string
  state?: string | null
  expiresAt?: number | null
}

function derivedPassword(password: string, purpose: 'application' | 'oidc-flow' | 'oidc-logout') {
  return createHash('sha256')
    .update(`oidc-client-session-v1:${purpose}:`)
    .update(password)
    .digest('hex')
}

function cookieConfig(
  config: AuthRuntimeConfig,
  name: string,
  purpose: 'application' | 'oidc-flow' | 'oidc-logout',
  maxAge: number,
): SessionConfig {
  return {
    name,
    password: derivedPassword(config.sessionPassword, purpose),
    maxAge,
    sessionHeader: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: config.secureCookies,
      path: '/',
    },
  }
}

export function useApplicationSession(event: H3Event, config: AuthRuntimeConfig) {
  return useSession<AuthSessionData>(event, cookieConfig(
    config,
    config.sessionCookieName,
    'application',
    config.sessionMaxAgeSeconds,
  ))
}

export async function readApplicationSession(event: H3Event, config: AuthRuntimeConfig) {
  const sealed = getCookie(event, config.sessionCookieName)
  if (!sealed) return null
  try {
    const session = await unsealSession(
      event,
      cookieConfig(config, config.sessionCookieName, 'application', config.sessionMaxAgeSeconds),
      sealed,
    )
    return (session.data ?? null) as AuthSessionData | null
  } catch {
    return null
  }
}

export function useOidcFlowSession(event: H3Event, config: AuthRuntimeConfig) {
  return useSession<OidcFlowSessionData>(event, cookieConfig(config, config.flowCookieName, 'oidc-flow', 10 * 60))
}

export function useOidcLogoutSession(event: H3Event, config: AuthRuntimeConfig) {
  return useSession<OidcLogoutSessionData>(event, cookieConfig(
    config,
    config.logoutCookieName,
    'oidc-logout',
    config.sessionMaxAgeSeconds,
  ))
}

export function clearAuthCookies(event: H3Event, config: AuthRuntimeConfig) {
  deleteCookie(event, config.sessionCookieName, { path: '/' })
  deleteCookie(event, config.flowCookieName, { path: '/' })
}

export function clearOidcFlowCookie(event: H3Event, config: AuthRuntimeConfig) {
  deleteCookie(event, config.flowCookieName, { path: '/' })
}

export function clearOidcLogoutCookie(event: H3Event, config: AuthRuntimeConfig) {
  deleteCookie(event, config.logoutCookieName, { path: '/' })
}
