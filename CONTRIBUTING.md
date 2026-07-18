# Contributing

RelyKit is private during prerelease development. Discuss public contributions after repository visibility and licensing are approved.

## Development contract

- Use a supported Node/npm combination from `package.json`.
- Keep the OIDC package framework- and provider-neutral.
- Keep the Nuxt adapter headless and application-authorized.
- Add provider claim handling only through an identity-profile strategy outside the core.
- Add or update tests for every security or public-contract change.
- Do not commit secrets, tokens, real identities, package tarballs, generated output, or local paths.

Run `npm ci`, `npm run check`, `npm run check:packages`, the example build, and `npm audit --omit=dev` before requesting review.

Public API changes need a migration note and changelog entry. Durable boundary decisions need an ADR in `docs/decisions/`.
