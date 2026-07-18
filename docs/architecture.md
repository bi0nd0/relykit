# Architecture

RelyKit separates protocol authentication, framework lifecycle integration, and application authorization.

## Boundaries

1. `@relykit/oidc` verifies the configured issuer and returns a standard identity keyed by `issuer` plus `subject`.
2. An optional `IdentityProfileStrategy` validates and maps provider-specific claims into typed profile data.
3. `@relykit/nuxt` maps protocol outcomes into Nuxt navigation, Nitro handlers, sealed sessions, and server middleware.
4. The application's `PrincipalAdapter` resolves and reloads its own durable principal.
5. Pure access decisions and authoritative API middleware apply application-owned requirements and permissions.

The external identity is not the application's user record. The immutable binding is `(issuer, subject)`. A local principal may be disabled, renamed, assigned permissions, or removed independently of the identity provider.

## Core facade

The core exposes focused functions for `discover`, `startLogin`, `finishLogin`, `startLogout`, and `verifyAccessToken`. It has no Nuxt, H3, persistence, provider SDK, application-role, or UI dependency.

`@relykit/oidc/access` is the browser-safe subpath. It contains pure decisions and safe-return-path handling without Node cryptography or server protocol orchestration.

## Extension points

- Use an identity-profile Strategy only when a provider-specific claim must be validated or mapped.
- Use the Nuxt Adapter for framework lifecycle behavior.
- Use the principal Adapter for local account resolution and authoritative authorization state.

Do not add a provider class hierarchy, provider-name switch, shared user repository, application permission catalog, or theme abstraction to RelyKit.

## Trust and data flow

The configured issuer is the only discovery origin. Discovery metadata must report the exact normalized issuer and S256 support. Token validation checks the signature, issuer, audience, expiry, allowed algorithm, and nonce. When UserInfo is requested, its subject must match the ID token before profile mapping runs.

The Nuxt callback discards the short-lived flow session on every attempt. A successful identity still does not create access: the application principal adapter must return a matching, active principal. Protected requests reload that principal before permission checks.

## White-label contract

Developer-facing imports and configuration use the RelyKit name. End-user behavior is consumer-owned: routes, cookie names, state keys, pages, copy, branding, and permission names are configured or supplied by the application. The packages inject no page, text, logo, registration flow, or telemetry.
