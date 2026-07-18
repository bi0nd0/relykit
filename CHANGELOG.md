# Changelog

All notable changes are documented here. RelyKit follows coordinated package versions.

## 0.1.0-beta.0 - Unpublished

- Extracted the relying-application OIDC and Nuxt behavior into an independent two-package workspace.
- Replaced provider-specific identity claims with a standard identity and application-supplied profile strategy.
- Added confidential basic/post and public-client token endpoint authentication.
- Made UserInfo optional and subject-bound.
- Renamed Nuxt imports, aliases, runtime configuration, state, and principal context.
- Added configurable neutral routes, cookies, and client state while retaining protected pages/APIs and authoritative principal reload.
- Added provider-neutral, white-label, package-content, production fixture, and release gates.
