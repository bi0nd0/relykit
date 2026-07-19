# ADR 0004: Structured RP-initiated logout with sealed evidence

- Status: accepted
- Date: 2026-07-19

## Context

The original adapter cleared its application cookie and navigated to a provider URL without preserving or sending the verified ID token. That could leave the provider SSO session active, and placing a token in a GET URL would expose it through history, referrers, and logs. A permissive synthetic provider hid the missing request evidence.

## Decision

The provider-neutral core returns a structured request containing the discovered endpoint, `client_id`, optional `id_token_hint`, exact post-logout callback, one-time state, and a transport method selected from token sensitivity. Requests carrying an ID-token hint are POST and never construct a token-bearing URL. Hintless requests are GET so standards-conforming Lax provider session cookies are sent on the top-level navigation.

The Nuxt callback retains the verified ID token in a separately derived sealed, HttpOnly, SameSite logout cookie, including identities denied local application access. A native same-origin logout POST clears local application and login-flow cookies first and updates one-time state. With retained evidence it emits a no-store/no-referrer form whose CSP allows script/style only by nonce and form navigation only to the discovered endpoint or same-origin callback. Without evidence it emits a no-store 303 to a token-free provider GET, allowing the provider to identify its session and ask for confirmation. The provider callback validates state in constant time, clears all logout evidence only after valid completion, and otherwise consumes an active one-time state while preserving the verified hint for a retry. An unsolicited callback with no active transaction cannot erase logout evidence.

Applications register the exact `logoutCallbackPath` URI, configure distinct application/login/logout cookie names, and own transition and recovery wording. Older sessions without retained evidence deliberately use the provider's standards-defined hintless confirmation path. Provider failure is reported as incomplete and retryable.

## Consequences

- ID tokens do not enter URLs, logs, JSON responses, application sessions, or persistent browser-readable storage; the browser sees a transient hidden form value only for a hinted front-channel POST.
- State is single-use and logout callbacks cannot create or restore an application session.
- The module remains provider-neutral and white-label while supporting real browser SSO termination.
- Release evidence must include a real provider; the synthetic fixture remains supporting coverage only.
