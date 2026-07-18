# Migration from the embedded 3Bees auth packages

This document is historical migration guidance; legacy names appear only to help existing consumers move safely.

## Package and module names

| Before | RelyKit |
|---|---|
| `@3bees/auth-core` | `@relykit/oidc` |
| `@3bees/auth-core/access` | `@relykit/oidc/access` |
| `@3bees/auth-nuxt` | `@relykit/nuxt` |
| `identityAuth` module identity | `relykit` module identity |
| `runtimeConfig.identity` | `runtimeConfig.auth` |
| `useIdentitySession()` | `useAuthSession()` |
| `event.context.identityPrincipal` | `event.context.authPrincipal` |

Do not migrate by changing imports only. The provider-specific base identity contract was intentionally removed.

## Provider claims

`expectedRealmId`, `realmId`, `tenantContext`, and provider claim namespaces no longer exist in the core contract. Move their validation into a server-owned `IdentityProfileStrategy`, configure its module path with `identityProfile`, and type the consuming principal adapter for that profile.

The trusted issuer remains server configuration. The strategy must validate any realm/account/tenant claim it requires and must never select a new issuer from those claims.

## Runtime configuration

Replace flat `clientSecret` semantics in direct core use with `clientAuthentication`. Nuxt consumers configure `clientAuthenticationMethod` plus a secret for confidential methods. Add `idTokenAlgorithms`, explicit neutral cookie names, and a consumer-specific `clientStateKey`.

Cookie names and key derivation changed. Existing sessions and in-progress login flows will be invalidated at deployment; plan a normal sign-in restart. Do not attempt to make old sealed cookies readable by the new package.

## Authorization

Application principal storage, one-time binding rules, active status, roles, and permissions remain in the consuming application. Preserve the existing principal adapter tests before replacing vendored tarballs. Then re-run anonymous redirect, callback, active access, unbound denial, suspension, logout, 401/403/503, and safe-return-path smoke cases against the exact npm prerelease.
