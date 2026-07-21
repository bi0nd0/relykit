# Configuration

## OIDC core

`OidcClientConfig` requires:

- `issuer`: exact trusted issuer URL, normalized without a trailing slash;
- `clientId`: registered OAuth client identifier;
- `clientAuthentication`: one of `{ method: 'client_secret_basic', clientSecret }`, `{ method: 'client_secret_post', clientSecret }`, or `{ method: 'none' }`;
- `redirectUri`: exact registered callback URL;
- `scopes`: must include `openid`;
- `idTokenAlgorithms`: a non-empty subset of `RS256`, `ES256`, and `EdDSA`;
- `requestTimeoutMs`: positive provider request timeout.

`postLogoutRedirectUri` is optional in the framework-neutral core. When present, `startLogout` creates one-time state and includes the exact URI plus `client_id` and optional `id_token_hint` in a structured request. A request carrying an ID-token hint is POST so the token never enters a URL. A hintless request is GET so a top-level navigation sends a standards-conforming Lax provider session cookie and the provider can require confirmation. Non-default token-endpoint authentication methods must be advertised by discovery metadata. If metadata advertises methods, the configured method must be included.

Do not derive `issuer` from a query parameter, request body, untrusted tenant name, or ID-token claim. Multi-issuer applications must select from a server-owned allowlist before calling RelyKit.

The Nuxt `loginPath` accepts OIDC third-party initiation only when the request `iss` is character-for-character equal to this configured issuer. It does not normalize browser input, discover a different issuer, or accept `target_link_uri`. This lets an identity provider direct a browser to the registered application while the application remains the authority that creates state, nonce, PKCE, callback, and local session context.

## Identity profiles

The default profile needs no UserInfo and returns an empty extension object. A custom strategy declares `userInfo` as `none`, `optional`, or `required` and maps only already verified ID-token claims plus subject-bound UserInfo.

```ts
import { z } from 'zod'
import type { IdentityProfileStrategy } from '@relykit/oidc'

const schema = z.object({ accountId: z.string().uuid() })

export default {
  userInfo: 'required',
  map: ({ userInfo }) => schema.parse({
    accountId: userInfo?.['https://id.example/claims/account_id'],
  }),
} satisfies IdentityProfileStrategy<{ accountId: string }>
```

Mapping failures become `profile_validation_failed` without including claims or token contents in the public error.

## Nuxt server runtime

The Nuxt adapter reads private `runtimeConfig.auth` values. Production deployments normally set these environment variables:

| Environment variable | Purpose |
|---|---|
| `NUXT_AUTH_ISSUER` | Trusted issuer |
| `NUXT_AUTH_CLIENT_ID` | Registered client ID |
| `NUXT_AUTH_CLIENT_SECRET` | Secret for confidential clients |
| `NUXT_AUTH_CLIENT_AUTHENTICATION_METHOD` | Token-endpoint authentication method |
| `NUXT_AUTH_REDIRECT_URI` | Exact callback URL |
| `NUXT_AUTH_POST_LOGOUT_REDIRECT_URI` | Required exact Nuxt logout callback URL for provider logout |
| `NUXT_AUTH_SCOPES` | Space-separated scopes |
| `NUXT_AUTH_ID_TOKEN_ALGORITHMS` | Space-separated allowlist |
| `NUXT_AUTH_REQUEST_TIMEOUT_MS` | Provider timeout |
| `NUXT_AUTH_SESSION_PASSWORD` | At least 32 characters of high-entropy secret material |
| `NUXT_AUTH_SESSION_MAX_AGE_SECONDS` | Local session lifetime |
| `NUXT_AUTH_SECURE_COOKIES` | `auto`, `true`, or local-development-only `false` |

Cookie names are module options by default and may also be overridden through private runtime config. Application, login-flow, and logout-flow cookies must be three distinct valid names. The post-logout callback must use the same application origin as the login callback and its path must equal `logoutCallbackPath`. Secure cookies cannot be disabled for a non-loopback production callback.

Missing or invalid production configuration produces a neutral 503 response and does not attempt a provider request.
