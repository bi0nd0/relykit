# Nuxt integration

## Module options

`@relykit/nuxt` accepts:

- `principalAdapter` (required): server module that resolves and reloads local principals;
- `identityProfile`: optional server module exporting an `IdentityProfileStrategy`;
- `defaultPageAccess`: `public`, `guest-only`, `authenticated`, or `{ permission }`;
- `requiredApiPermission`: optional permission required by protected APIs;
- `loginPage`, `accessDeniedPage`, and `authenticatedHome`: application-owned page destinations;
- `loginPath`, `callbackPath`, `logoutPath`, and `accessPath`: unique internal handler paths;
- `protectedApiPrefixes`, `publicApiPaths`, and `independentlyAuthenticatedApiPaths`: exact server policy boundaries;
- `sessionCookieName`, `flowCookieName`, and `clientStateKey`: collision-free application names.

Routes must be absolute application paths without origins, queries, or fragments. API exceptions are exact paths. Protected prefixes match a path boundary, so `/api` does not accidentally match `/apiary`.

## Principal adapter

```ts
import type { PrincipalAdapter } from '@relykit/nuxt'

export default {
  async resolveLogin({ event, identity }) {
    // Bind (identity.issuer, identity.subject) to a durable local principal.
    return principalRepository.resolveLogin(event, identity)
  },
  async reloadPrincipal({ event, reference }) {
    // Reload active status and permissions on each protected request.
    return principalRepository.reload(event, reference)
  },
} satisfies PrincipalAdapter
```

The adapter result must preserve the verified issuer/subject binding. Reloaded results must also preserve the stored principal ID. A missing, mismatched, or inactive principal is denied.

## Page behavior

The global middleware evaluates `to.meta.auth` or `defaultPageAccess`:

- anonymous protected page: redirect to `loginPage` with a safe local `returnTo`;
- authenticated guest-only page: redirect to `authenticatedHome`;
- inactive/unbound/missing-permission principal: redirect to `accessDeniedPage`;
- authorization dependency failure: neutral 503 for the application error boundary.

The package renders none of these pages.

## API behavior

Protected APIs reload the principal and return:

- 401 for no valid local application session;
- 403 for inactive, missing, mismatched, or unauthorized principal;
- 503 when authoritative authorization cannot be checked.

Public paths and independently authenticated paths bypass only this application-cookie middleware. An independently authenticated endpoint must still verify its own signature, token, or shared protocol.

Server handlers can import `requireActivePrincipal` and `requirePermission` from `@relykit/nuxt/server`. Successful checks set `event.context.authPrincipal`.

## Client composable

`useAuthSession()` exposes `session`, `principal`, `authenticated`, `ready`, `refresh`, and `logout`. The access probe does not create an anonymous session cookie. State keys are consumer-configurable so multiple applications on one origin do not collide.
