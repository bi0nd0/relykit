# Changelog

All notable changes are documented here. RelyKit follows coordinated package versions.

## 0.1.0 - 2026-07-18

- Published the first stable coordinated OIDC and Nuxt package line without changing the public API proven in `0.1.0-beta.1`.
- Completed registry-package, clean-consumer, Docker, migration, and full Rent Helper browser authentication/authorization gates.
- Reconciled package, security, contribution, migration, and release documentation with the public stable support policy.

## 0.1.0-beta.1 - 2026-07-17

- Added provenance-capable GitHub Actions publishing through package-scoped npm trusted publishers.
- Revalidated coordinated package contents and the exact Nuxt-to-OIDC dependency after the npm bootstrap.
- Corrected the owner release runbook against the npm 11.12.1 CLI and live registry behavior.

## 0.1.0-beta.0 - 2026-07-17

- Extracted the relying-application OIDC and Nuxt behavior into an independent two-package workspace.
- Replaced provider-specific identity claims with a standard identity and application-supplied profile strategy.
- Added confidential basic/post and public-client token endpoint authentication.
- Made UserInfo optional and subject-bound.
- Renamed Nuxt imports, aliases, runtime configuration, state, and principal context.
- Added configurable neutral routes, cookies, and client state while retaining protected pages/APIs and authoritative principal reload.
- Added provider-neutral, white-label, package-content, production fixture, and release gates.
- Published the reviewed bootstrap artifacts under the `bootstrap` tag.
