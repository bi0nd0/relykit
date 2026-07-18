# RelyKit Guidelines

- Keep `@relykit/oidc` framework-neutral. It must not import Nuxt, H3, Nitro, provider SDKs, or application roles.
- Keep `@relykit/nuxt` as an adapter over `@relykit/oidc`; it must not import an identity provider's internals or application roles.
- Treat OpenID Connect as the public integration contract. Provider-specific claims belong behind a consumer-supplied identity-profile strategy.
- Applications own local principal status, permissions, and resource authorization.
- Runtime behavior must be white-label: routes, cookies, redirects, and user-facing pages are consumer-configurable and contain no provider branding.
- Never trust an issuer supplied by a browser request. Use the configured issuer or an explicit server-owned allowlist.
- Do not start listeners, timers, workers, or external connections at module import time.
- Use Node.js >=22.14 and <27, npm >=10 and <12, Nuxt 4, TypeScript, Vitest, and ESLint.
- Pin security-sensitive dependencies exactly.
- Do not publish packages or change repository visibility without explicit owner action.
