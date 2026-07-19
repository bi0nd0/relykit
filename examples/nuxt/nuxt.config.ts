export default defineNuxtConfig({
  modules: [[
    '@relykit/nuxt',
    {
      principalAdapter: './server/principal-adapter.ts',
      loginPage: '/sign-in',
      accessDeniedPage: '/not-authorized',
      sessionCookieName: 'example-session',
      flowCookieName: 'example-flow',
      logoutCookieName: 'example-logout-flow',
      clientStateKey: 'example-auth',
    },
  ]],
  runtimeConfig: {
    auth: {
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
      sessionMaxAgeSeconds: 28_800,
      secureCookies: 'auto',
    },
  },
})
