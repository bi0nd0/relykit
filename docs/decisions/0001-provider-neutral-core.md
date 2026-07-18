# ADR 0001: Standard identity with a profile strategy

- Status: accepted
- Date: 2026-07-17

## Context

OIDC providers share standard issuer, subject, audience, and profile claims but expose different namespaced claims and UserInfo requirements. Making one provider's realm or tenant schema part of the core would prevent genuine reuse.

## Decision

The core returns a standard identity and accepts one optional `IdentityProfileStrategy`. The strategy declares whether UserInfo is needed and maps verified claims into typed application/provider extension data. UserInfo is subject-bound before the strategy runs.

## Consequences

The core contains no provider enum, vendor branch, or realm/tenant contract. Consumers that need custom claims own a small server module and its schema tests. Strategy failures use a stable error without leaking claim values.

Provider inheritance and a universal provider configuration object were rejected because they would turn protocol metadata differences into a permanent class hierarchy.
