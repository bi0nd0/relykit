# `@relykit/oidc`

Provider-neutral, framework-independent OpenID Connect primitives for server-side relying applications.

The package implements discovery, Authorization Code flow with S256 PKCE, state and nonce validation, token verification, optional UserInfo, configurable token-endpoint client authentication, safe return paths, and pure access decisions.

Provider-specific claims are handled by an application-supplied `IdentityProfileStrategy`. Application users, roles, permissions, and persistence remain outside this package.

See the repository README and `docs/configuration.md` for setup and security requirements.
