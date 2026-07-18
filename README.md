# RelyKit

RelyKit is a white-label, provider-neutral OpenID Connect toolkit for relying applications. It handles authentication plumbing; your application keeps ownership of users, account status, roles, permissions, pages, wording, and branding.

> **Release status:** private prerelease development. The npm packages have not been published. Their license and public visibility remain owner approval gates.

## Packages

- `@relykit/oidc` provides framework-independent server-side discovery, Authorization Code + S256 PKCE, state and nonce protection, token verification, optional UserInfo, identity-profile strategies, logout discovery, and pure access decisions.
- `@relykit/nuxt` adapts those primitives to Nuxt 4 and Nitro with configurable routes, sealed sessions, page middleware, protected APIs, and an application principal adapter.

## Connect RelyKit to IdFabric

IdFabric is the identity provider: it owns authentication, accounts, MFA, recovery, realms, organizations, teams, invitations, bans, and OAuth clients. RelyKit is installed in each website or SaaS and owns only that application's OIDC flow and local application session. The application remains responsible for its own active-account decision, roles, permissions, and resource authorization.

### 1. Register the application in IdFabric

1. Choose the IdFabric **realm** for this application and note its exact issuer, such as `https://identity.example.com/api/auth`.
2. In that realm, sign in as an administrator and open `/admin/oauth-clients`.
3. Create a **confidential web** client with a stable client ID, the exact callback `https://app.example.com/api/auth/callback`, the exact post-logout URL `https://app.example.com/`, and `openid profile email` scopes. Add `offline_access` or `tenant` only when needed.
4. Save the generated client secret immediately. IdFabric shows it only once.
5. Confirm `<issuer>/.well-known/openid-configuration` is reachable from the application server.

Callback and logout URLs are exact-match values. Register separate clients for local development and production instead of weakening redirect validation.

### 2. Install and configure RelyKit

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

Use server-only environment variables. Never expose these values through `runtimeConfig.public`:

```dotenv
NUXT_AUTH_ISSUER=https://identity.example.com/api/auth
NUXT_AUTH_CLIENT_ID=my-saas
NUXT_AUTH_CLIENT_SECRET=<the-secret-shown-once-by-idfabric>
NUXT_AUTH_CLIENT_AUTHENTICATION_METHOD=client_secret_basic
NUXT_AUTH_REDIRECT_URI=https://app.example.com/api/auth/callback
NUXT_AUTH_POST_LOGOUT_REDIRECT_URI=https://app.example.com/
NUXT_AUTH_SCOPES=openid profile email
NUXT_AUTH_SESSION_PASSWORD=<at-least-32-characters-of-independent-random-data>
```

The RelyKit session password is not the IdFabric client secret. Generate and rotate it independently, keep both values in the application's secret manager, and use HTTPS outside loopback development.

### 3. Map the identity to a local application principal

The principal adapter maps a verified external identity to the application's authoritative local principal. Bind it by immutable `identity.issuer` plus `identity.subject`, then reload active state and product permissions on protected requests. Email and name are display snapshots, not authorization keys. See the working [principal-adapter example](examples/nuxt/server/principal-adapter.ts).

### 4. Add sign-in, access policy, and a connection test

The application owns its sign-in page. Link it to RelyKit's login handler and keep `returnTo` local:

```vue
<script setup lang="ts">
import { safeReturnPath } from '@relykit/oidc/access'

definePageMeta({ auth: 'guest-only' })
const route = useRoute()
const loginHref = computed(() => `/api/auth/login?${new URLSearchParams({
  returnTo: safeReturnPath(route.query.returnTo),
}).toString()}`)
</script>

<template>
  <a :href="loginHref">Continue with identity provider</a>
</template>
```

Pages are protected by default. Override a page deliberately:

```ts
definePageMeta({ auth: 'public' })
definePageMeta({ auth: 'guest-only' })
definePageMeta({ auth: { permission: 'calendar:write' } })
```

Start the application and verify this sequence:

1. A protected page redirects to the application sign-in page.
2. Continue redirects to the expected IdFabric realm.
3. IdFabric returns to `/api/auth/callback`, and RelyKit creates the application session.
4. A protected API succeeds only for an active local principal with the required application permission.
5. Logout clears the local session and uses IdFabric's advertised end-session endpoint.
6. An authenticated IdFabric identity with no active local principal reaches the application's access-denied page.

If the callback fails, compare the configured issuer, client ID, callback URL, authentication method, and scopes character-for-character with the IdFabric client. See the private [IdFabric README](https://github.com/bi0nd0/idfabric#connect-a-nuxt-application-with-relykit) for the provider side of the same handoff.

## Security boundary

- The issuer is server-owned configuration; browser input cannot select discovery endpoints.
- State, nonce, S256 PKCE, exact issuer/audience checks, allowed signing algorithms, bounded responses, and safe local return paths fail closed.
- Access and refresh tokens stay server-side. Application session cookies are sealed, HttpOnly, SameSite=Lax, and Secure outside loopback development.
- RelyKit renders no UI and grants no application permission by itself.

Read [architecture](docs/architecture.md), [configuration](docs/configuration.md), [Nuxt integration](docs/nuxt.md), [security policy](SECURITY.md), and [testing](docs/testing.md) before production use.

## Compatibility

The prerelease validation matrix is Node.js 22.18 through 26, npm 10 through 11, and Nuxt 4.4. The public support promise is not final until the first release gate is approved.

## Development

```bash
npm ci
npm run check
npm run check:packages
npm run build --workspace @relykit/example-nuxt
npm audit --omit=dev
```

See [CONTRIBUTING.md](CONTRIBUTING.md) and [docs/releasing.md](docs/releasing.md). Publication and repository visibility changes require explicit owner action.
