# RelyKit

RelyKit is a white-label, provider-neutral OpenID Connect toolkit for relying applications. It handles authentication plumbing; your application keeps ownership of users, account status, roles, permissions, pages, wording, and branding.

> **Release status:** private prerelease development. The npm packages have not been published. Their license and public visibility remain owner approval gates.

## Packages

- `@relykit/oidc` provides framework-independent server-side discovery, Authorization Code + S256 PKCE, state and nonce protection, token verification, optional UserInfo, identity-profile strategies, logout discovery, and pure access decisions.
- `@relykit/nuxt` adapts those primitives to Nuxt 4 and Nitro with configurable routes, sealed sessions, page middleware, protected APIs, and an application principal adapter.

## Nuxt quick start

After publication, install both coordinated packages at the same version:

```bash
npm install @relykit/oidc @relykit/nuxt
```

Configure the module and server-only runtime values:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: [[
    '@relykit/nuxt',
    {
      principalAdapter: './server/auth/principal-adapter.ts',
      loginPage: '/sign-in',
      accessDeniedPage: '/not-authorized',
      defaultPageAccess: 'authenticated',
      requiredApiPermission: 'app:access',
      sessionCookieName: 'my-app-session',
      flowCookieName: 'my-app-login-flow',
      clientStateKey: 'my-app-auth',
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
```

Supply `NUXT_AUTH_ISSUER`, `NUXT_AUTH_CLIENT_ID`, `NUXT_AUTH_CLIENT_SECRET`, `NUXT_AUTH_REDIRECT_URI`, and `NUXT_AUTH_SESSION_PASSWORD` through the server environment. Never expose them through `runtimeConfig.public`.

The principal adapter maps a verified external identity to the application's authoritative local principal. RelyKit reloads that principal on protected requests so suspensions and permission changes take effect without waiting for the login session to expire.

Pages are protected by default. Override a page deliberately:

```ts
definePageMeta({ auth: 'public' })
definePageMeta({ auth: 'guest-only' })
definePageMeta({ auth: { permission: 'calendar:write' } })
```

## Security boundary

- The issuer is server-owned configuration; browser input cannot select discovery endpoints.
- State, nonce, S256 PKCE, exact issuer/audience checks, allowed signing algorithms, bounded responses, and safe local return paths fail closed.
- Access and refresh tokens stay server-side. Application session cookies are sealed, HttpOnly, SameSite=Lax, and Secure outside loopback development.
- RelyKit renders no UI and grants no application permission by itself.

Read [architecture](docs/architecture.md), [configuration](docs/configuration.md), [Nuxt integration](docs/nuxt.md), [security policy](SECURITY.md), and [testing](docs/testing.md) before production use.

## Compatibility

The prerelease validation matrix is Node.js 22.14 through 26, npm 10 through 11, and Nuxt 4.4. The public support promise is not final until the first release gate is approved.

## Development

```bash
npm ci
npm run check
npm run check:packages
npm run build --workspace @relykit/example-nuxt
npm audit --omit=dev
```

See [CONTRIBUTING.md](CONTRIBUTING.md) and [docs/releasing.md](docs/releasing.md). Publication and repository visibility changes require explicit owner action.
