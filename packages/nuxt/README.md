# `@relykit/nuxt`

A headless Nuxt 4 and Nitro adapter over `@relykit/oidc`.

The module installs configurable login, callback, logout POST/callback, access, page-middleware, and protected-API behavior. It retains verified logout evidence in a dedicated sealed HttpOnly cookie, clears the local session first, and uses a CSP-constrained provider form POST. Applications supply their own pages, transition wording, branding, principal adapter, permissions, and optional identity-profile strategy.

See the [repository README](https://github.com/bi0nd0/relykit#readme) and [Nuxt guide](https://github.com/bi0nd0/relykit/blob/main/docs/nuxt.md) for setup and runtime configuration.
