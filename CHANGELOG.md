# Changelog

All notable changes are documented here. RelyKit follows coordinated package versions.

## Unreleased

## 0.1.2 - 2026-07-20

- Accept standards-aligned GET and form POST third-party login initiation on the configured Nuxt login path.
- Require the request issuer to match server-owned configuration exactly, reject caller-selected target links, and start a fresh state, nonce, and S256-PKCE transaction.

## 0.1.1 - 2026-07-19

- Use a state-bound top-level GET for hintless RP-initiated logout so standards-conforming Lax provider session cookies reach the required confirmation flow.
- Keep every logout carrying an ID-token hint on the no-store, no-referrer, CSP-constrained form POST path so ID tokens never enter URLs.
- Enforce the transport split in the core request contract, Nuxt adapter, synthetic provider, tests, and public documentation.

## 0.1.0 - 2026-07-19

- Added a structured, provider-neutral RP-Initiated Logout request to `@relykit/oidc` so ID tokens are transported in a form POST instead of a browser URL.
- Added the complete Nuxt logout lifecycle: separately sealed ID-token evidence, one-time state, same-origin initiation, constrained transition forms, verified callbacks, replay rejection, and explicit provider-failure recovery.
- Preserved logout evidence after failed or unsolicited callbacks so a relying application can safely retry ending the provider session without silently claiming success.
- Completed package, clean-consumer, Docker, migration, and real-provider browser authentication, authorization, and logout gates.
- Reconciled package, architecture, security, migration, and release documentation with the stable support contract.

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
