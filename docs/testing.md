# Testing

## Local gate

Use the repository runtime declared in `package.json`, then run:

```bash
npm ci
npm run check
npm run check:packages
npm run build --workspace @relykit/example-nuxt
npm audit --omit=dev
```

`npm run check` covers runtime compatibility, lint, strict package typechecks, unit tests, and package builds. `check:packages` performs npm dry-run inventories and scans publishable output for provider/application semantics and local paths.

## Test ownership

- Pure access and URL policy is unit-tested in `packages/oidc/test`.
- OIDC service tests use synthetic discovery, token, signing-key, and UserInfo responses; they cover state, nonce, S256 PKCE, issuer, audience, signature, bounded responses, timeout, client authentication, and profile mapping.
- Nuxt tests cover option normalization, API policy, redirects, principal binding/reload, and runtime configuration.
- `packages/nuxt/test/fixtures/basic` is the production-build and runtime fixture.
- `examples/nuxt` proves the documented public imports and setup compile independently.

No test or build requires a real identity provider, production secret, database, or network service.

## Runtime smoke

The fixture smoke must prove:

1. anonymous protected pages redirect to the consumer login page;
2. anonymous protected APIs return 401;
3. login/callback creates the configured application cookie;
4. an active principal can access the protected page and API;
5. an unbound/inactive principal is denied;
6. logout clears application and flow cookies;
7. the post-logout protected API returns 401;
8. public HTML, headers, redirects, cookies, and normal-flow output contain no package/provider/application branding not supplied by the fixture.

Registry releases add a clean consumer install from the exact tarballs and, after prerelease publication, the exact npm versions.
