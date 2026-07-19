import authNuxt from '../../../src/module.js'

export default defineNuxtConfig({
  modules: [[authNuxt, {
    principalAdapter: './server/principal-adapter.ts',
  }]],
  runtimeConfig: {
    auth: {
      issuer: 'http://127.0.0.1:4010/issuer',
      clientId: 'fixture-web',
      clientSecret: 'fixture-client-secret',
      clientAuthenticationMethod: 'client_secret_basic',
      redirectUri: 'http://127.0.0.1:4010/api/auth/callback',
      postLogoutRedirectUri: 'http://127.0.0.1:4010/api/auth/logout/callback',
      scopes: 'openid profile email',
      idTokenAlgorithms: 'RS256 ES256 EdDSA',
      requestTimeoutMs: 1_000,
      sessionPassword: 'fixture-session-password-32-bytes!',
      sessionMaxAgeSeconds: 3_600,
      secureCookies: false,
    },
  },
})
