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

`npm run check` covers runtime compatibility, lint, strict package typechecks, unit tests, and package builds. `check:packages` requires the MIT license in each tarball, performs npm dry-run inventories, and scans publishable output for provider/application semantics and local paths.

## Test ownership

- Pure access and URL policy is unit-tested in `packages/oidc/test`.
- OIDC service tests use synthetic discovery, token, signing-key, and UserInfo responses; they cover state, nonce, S256 PKCE, issuer, audience, signature, bounded responses, timeout, client authentication, profile mapping, and structured logout POST requests.
- Nuxt tests cover option normalization, API policy, redirects, principal binding/reload, runtime configuration, logout callback state, and CSP-constrained logout form construction.
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
6. logout clears application and flow cookies while retaining only sealed logout evidence;
7. the transition response is no-store/no-referrer, its CSP permits only the exact provider form target, and its URL contains no token;
8. the provider receives POST with client, hint when available, exact callback, and one-time state;
9. the callback consumes state once, and the post-logout protected API returns 401;
10. provider unavailability produces a truthful retryable outcome rather than a false completion;
11. public HTML, headers, redirects, cookies, and normal-flow output contain no package/provider/application branding not supplied by the fixture.

Registry releases add a clean consumer install from the exact tarballs and exact npm versions. Stable candidates also require a real relying application against a real provider to repeat callback, principal reload, suspension/denial, hinted and hintless logout, exact redirect, state replay, cross-session confirmation, and provider-unavailable recovery before `latest` moves. The synthetic fixture cannot substitute for that evidence.
