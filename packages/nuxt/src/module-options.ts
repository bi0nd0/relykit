import type { AccessRequirement } from '@relykit/oidc/access'

export type RelyKitNuxtModuleOptions = {
  principalAdapter?: string
  identityProfile?: string
  defaultPageAccess?: AccessRequirement
  requiredApiPermission?: string
  loginPage?: string
  accessDeniedPage?: string
  authenticatedHome?: string
  loginPath?: string
  callbackPath?: string
  logoutPath?: string
  logoutCallbackPath?: string
  accessPath?: string
  protectedApiPrefixes?: string[]
  publicApiPaths?: string[]
  independentlyAuthenticatedApiPaths?: string[]
  sessionCookieName?: string
  flowCookieName?: string
  logoutCookieName?: string
  logoutTransitionTitle?: string
  logoutTransitionMessage?: string
  logoutTransitionAction?: string
  clientStateKey?: string
}

export type NormalizedRelyKitNuxtModuleOptions = Required<RelyKitNuxtModuleOptions>

const DEFAULTS: Omit<NormalizedRelyKitNuxtModuleOptions, 'principalAdapter'> = {
  identityProfile: '',
  defaultPageAccess: 'authenticated',
  requiredApiPermission: '',
  loginPage: '/login',
  accessDeniedPage: '/access-denied',
  authenticatedHome: '/',
  loginPath: '/api/auth/login',
  callbackPath: '/api/auth/callback',
  logoutPath: '/api/auth/logout',
  logoutCallbackPath: '/api/auth/logout/callback',
  accessPath: '/api/auth/access',
  protectedApiPrefixes: ['/api'],
  publicApiPaths: ['/api/health'],
  independentlyAuthenticatedApiPaths: [],
  sessionCookieName: 'auth-session',
  flowCookieName: 'auth-flow',
  logoutCookieName: 'auth-logout',
  logoutTransitionTitle: 'Finishing sign-out…',
  logoutTransitionMessage: 'Continue if this page does not move automatically.',
  logoutTransitionAction: 'Continue signing out',
  clientStateKey: 'auth-session-state',
}

function exactApplicationPath(value: string, label: string) {
  if (!value.startsWith('/') || value.startsWith('//')) {
    throw new Error(`${label} must be an absolute application path.`)
  }
  const parsed = new URL(value, 'https://app.invalid')
  if (parsed.origin !== 'https://app.invalid' || parsed.search || parsed.hash) {
    throw new Error(`${label} must not include an origin, query, or fragment.`)
  }
  return parsed.pathname.length > 1 ? parsed.pathname.replace(/\/$/, '') : '/'
}

function normalizedPaths(values: string[], label: string) {
  return [...new Set(values.map(value => exactApplicationPath(value, label)))]
}

function normalizedPageAccess(value: AccessRequirement): AccessRequirement {
  if (value === 'public' || value === 'guest-only' || value === 'authenticated') return value
  const permission = value.permission?.trim()
  if (!permission) throw new Error('defaultPageAccess permission must not be empty.')
  return { permission }
}

function cookieName(value: string, label: string) {
  const normalized = value.trim()
  if (!/^[!#$%&'*+.^`|~\w-]{1,128}$/.test(normalized)) {
    throw new Error(`${label} must be a valid cookie name.`)
  }
  return normalized
}

function stateKey(value: string) {
  const normalized = value.trim()
  if (!normalized || normalized.length > 128) {
    throw new Error('clientStateKey must contain between 1 and 128 characters.')
  }
  return normalized
}

function transitionCopy(value: string, label: string) {
  const normalized = value.trim()
  if (!normalized || normalized.length > 200) {
    throw new Error(`${label} must contain between 1 and 200 characters.`)
  }
  return normalized
}

export function normalizeModuleOptions(options: RelyKitNuxtModuleOptions): NormalizedRelyKitNuxtModuleOptions {
  if (!options.principalAdapter?.trim()) {
    throw new Error('@relykit/nuxt requires a principalAdapter module path.')
  }

  const normalized: NormalizedRelyKitNuxtModuleOptions = {
    principalAdapter: options.principalAdapter,
    identityProfile: options.identityProfile?.trim() ?? DEFAULTS.identityProfile,
    defaultPageAccess: normalizedPageAccess(options.defaultPageAccess ?? DEFAULTS.defaultPageAccess),
    requiredApiPermission: options.requiredApiPermission?.trim() ?? DEFAULTS.requiredApiPermission,
    loginPage: exactApplicationPath(options.loginPage ?? DEFAULTS.loginPage, 'loginPage'),
    accessDeniedPage: exactApplicationPath(options.accessDeniedPage ?? DEFAULTS.accessDeniedPage, 'accessDeniedPage'),
    authenticatedHome: exactApplicationPath(options.authenticatedHome ?? DEFAULTS.authenticatedHome, 'authenticatedHome'),
    loginPath: exactApplicationPath(options.loginPath ?? DEFAULTS.loginPath, 'loginPath'),
    callbackPath: exactApplicationPath(options.callbackPath ?? DEFAULTS.callbackPath, 'callbackPath'),
    logoutPath: exactApplicationPath(options.logoutPath ?? DEFAULTS.logoutPath, 'logoutPath'),
    logoutCallbackPath: exactApplicationPath(options.logoutCallbackPath ?? DEFAULTS.logoutCallbackPath, 'logoutCallbackPath'),
    accessPath: exactApplicationPath(options.accessPath ?? DEFAULTS.accessPath, 'accessPath'),
    protectedApiPrefixes: normalizedPaths(options.protectedApiPrefixes ?? DEFAULTS.protectedApiPrefixes, 'protectedApiPrefixes'),
    publicApiPaths: normalizedPaths(options.publicApiPaths ?? DEFAULTS.publicApiPaths, 'publicApiPaths'),
    independentlyAuthenticatedApiPaths: normalizedPaths(
      options.independentlyAuthenticatedApiPaths ?? DEFAULTS.independentlyAuthenticatedApiPaths,
      'independentlyAuthenticatedApiPaths',
    ),
    sessionCookieName: cookieName(options.sessionCookieName ?? DEFAULTS.sessionCookieName, 'sessionCookieName'),
    flowCookieName: cookieName(options.flowCookieName ?? DEFAULTS.flowCookieName, 'flowCookieName'),
    logoutCookieName: cookieName(options.logoutCookieName ?? DEFAULTS.logoutCookieName, 'logoutCookieName'),
    logoutTransitionTitle: transitionCopy(options.logoutTransitionTitle ?? DEFAULTS.logoutTransitionTitle, 'logoutTransitionTitle'),
    logoutTransitionMessage: transitionCopy(options.logoutTransitionMessage ?? DEFAULTS.logoutTransitionMessage, 'logoutTransitionMessage'),
    logoutTransitionAction: transitionCopy(options.logoutTransitionAction ?? DEFAULTS.logoutTransitionAction, 'logoutTransitionAction'),
    clientStateKey: stateKey(options.clientStateKey ?? DEFAULTS.clientStateKey),
  }

  const authRoutes = [
    normalized.loginPath,
    normalized.callbackPath,
    normalized.logoutPath,
    normalized.logoutCallbackPath,
    normalized.accessPath,
  ]
  if (new Set(authRoutes).size !== authRoutes.length) {
    throw new Error('Authentication route paths must be unique.')
  }
  const cookieNames = [normalized.sessionCookieName, normalized.flowCookieName, normalized.logoutCookieName]
  if (new Set(cookieNames).size !== cookieNames.length) {
    throw new Error('Authentication cookie names must be different.')
  }
  return normalized
}
