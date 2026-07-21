import { access } from 'node:fs/promises'
import {
  addImports,
  addRouteMiddleware,
  addServerHandler,
  addTypeTemplate,
  createResolver,
  defineNuxtModule,
  resolvePath,
} from '@nuxt/kit'
import type { NitroConfig } from 'nitropack'
import {
  normalizeModuleOptions,
  type RelyKitNuxtModuleOptions,
} from './module-options.js'

export type { RelyKitNuxtModuleOptions } from './module-options.js'
export type {
  AuthClientSession,
  AuthPageAccess,
  AuthSessionData,
  ApplicationPrincipal,
  PrincipalAdapter,
  PrincipalReference,
} from './runtime/types.js'

export default defineNuxtModule<RelyKitNuxtModuleOptions>({
  meta: {
    name: '@relykit/nuxt',
    configKey: 'relykit',
    compatibility: { nuxt: '>=4.4.0 <5' },
  },
  defaults: {
    principalAdapter: '',
  },
  async setup(rawOptions, nuxt) {
    const options = normalizeModuleOptions(rawOptions)
    const resolver = createResolver(import.meta.url)
    const runtimeDirectory = resolver.resolve('./runtime')
    nuxt.options.build.transpile.push(runtimeDirectory)
    const nuxtOptions = nuxt.options as typeof nuxt.options & { nitro?: NitroConfig }
    nuxtOptions.nitro ??= {}
    nuxtOptions.nitro.externals ??= {}
    nuxtOptions.nitro.externals.inline ??= []
    nuxtOptions.nitro.externals.inline.push(runtimeDirectory)
    const principalAdapter = await resolvePath(options.principalAdapter, {
      cwd: nuxt.options.rootDir,
      alias: nuxt.options.alias,
    })
    await access(principalAdapter).catch(() => {
      throw new Error(`@relykit/nuxt could not resolve principalAdapter: ${options.principalAdapter}`)
    })
    nuxt.options.alias['#relykit/principal-adapter'] = principalAdapter
    const identityProfile = options.identityProfile
      ? await resolvePath(options.identityProfile, {
          cwd: nuxt.options.rootDir,
          alias: nuxt.options.alias,
        })
      : await resolvePath(resolver.resolve('./runtime/server/standard-identity-profile'), {
          extensions: ['.ts', '.js', '.mjs'],
        })
    await access(identityProfile).catch(() => {
      throw new Error(`@relykit/nuxt could not resolve identityProfile: ${options.identityProfile}`)
    })
    nuxt.options.alias['#relykit/identity-profile'] = identityProfile

    const runtimeConfig = nuxt.options.runtimeConfig as Record<string, unknown>
    const existingAuth = (runtimeConfig.auth ?? {}) as Record<string, unknown>
    runtimeConfig.auth = {
      issuer: '',
      clientId: '',
      clientSecret: '',
      clientAuthenticationMethod: 'client_secret_basic',
      redirectUri: '',
      postLogoutRedirectUri: '',
      scopes: 'openid profile email',
      idTokenAlgorithms: 'RS256 ES256 EdDSA',
      requestTimeoutMs: 5_000,
      sessionPassword: '',
      sessionMaxAgeSeconds: 60 * 60 * 8,
      sessionCookieName: options.sessionCookieName,
      flowCookieName: options.flowCookieName,
      logoutCookieName: options.logoutCookieName,
      secureCookies: 'auto',
      ...existingAuth,
    }

    const publicConfig = runtimeConfig.public as Record<string, unknown>
    const existingPublicAuth = (publicConfig.auth ?? {}) as Record<string, unknown>
    publicConfig.auth = {
      defaultPageAccess: options.defaultPageAccess,
      loginPage: options.loginPage,
      accessDeniedPage: options.accessDeniedPage,
      authenticatedHome: options.authenticatedHome,
      loginPath: options.loginPath,
      logoutPath: options.logoutPath,
      accessPath: options.accessPath,
      clientStateKey: options.clientStateKey,
      ...existingPublicAuth,
    }

    runtimeConfig.authModule = options

    addServerHandler({
      route: options.loginPath,
      method: 'get',
      handler: resolver.resolve('./runtime/server/handlers/login'),
    })
    addServerHandler({
      route: options.loginPath,
      method: 'post',
      handler: resolver.resolve('./runtime/server/handlers/login'),
    })
    addServerHandler({
      route: options.callbackPath,
      method: 'get',
      handler: resolver.resolve('./runtime/server/handlers/callback.get'),
    })
    addServerHandler({
      route: options.logoutPath,
      method: 'post',
      handler: resolver.resolve('./runtime/server/handlers/logout.post'),
    })
    addServerHandler({
      route: options.logoutCallbackPath,
      method: 'get',
      handler: resolver.resolve('./runtime/server/handlers/logout-callback.get'),
    })
    addServerHandler({
      route: options.accessPath,
      method: 'get',
      handler: resolver.resolve('./runtime/server/handlers/access.get'),
    })
    addServerHandler({
      middleware: true,
      handler: resolver.resolve('./runtime/server/middleware/identity-guard'),
    })
    addRouteMiddleware({
      name: 'authentication',
      global: true,
      path: resolver.resolve('./runtime/app/middleware/identity.global'),
    })
    addImports({
      name: 'useAuthSession',
      from: resolver.resolve('./runtime/app/composables/use-identity-session'),
    })

    addTypeTemplate({
      filename: 'types/relykit-nuxt.d.ts',
      getContents: () => `
declare module '#app' {
  interface PageMeta {
    auth?: import('@relykit/oidc').AccessRequirement
  }
}
declare module 'vue-router' {
  interface RouteMeta {
    auth?: import('@relykit/oidc').AccessRequirement
  }
}
declare module 'h3' {
  interface H3EventContext {
    authPrincipal?: import('@relykit/nuxt').ApplicationPrincipal
  }
}
export {}
`,
    }, { nuxt: true, nitro: true })
  },
})
