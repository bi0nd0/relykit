# ADR 0002: White-label means consumer-owned observable behavior

- Status: accepted
- Date: 2026-07-17

## Context

A reusable authentication adapter needs a developer-facing package identity, but that identity must not become branding in the consuming application's pages, cookies, responses, or redirects.

## Decision

RelyKit may identify itself in npm metadata, imports, documentation, development errors, and source maps. It renders no UI. Applications own routes, page content, branding, permission names, cookie names, state keys, and principal data. Default runtime names use neutral authentication terms.

White-label regression checks inspect public HTML, response bodies and headers, redirects, cookies, and publishable package contents.

## Consequences

Applications must build login, denial, unavailable, and home pages. The package remains smaller and accessible UX stays in the application design system. A theme/component abstraction was rejected because even unstyled package copy would establish unwanted end-user behavior.
