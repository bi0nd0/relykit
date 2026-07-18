# ADR 0003: Coordinated versions and prerelease-first publication

- Status: accepted
- Date: 2026-07-17

## Context

The Nuxt adapter depends directly on the OIDC package, and the first npm release establishes security-sensitive public contracts. Publishing independently or going directly to stable would make consumer evidence ambiguous.

## Decision

Both packages use one fixed version. `@relykit/nuxt` depends on the exact coordinated `@relykit/oidc` version. The owner publishes a reviewed prerelease under `next`, installs that exact registry version in a real consumer, and approves stable publication only after the full authentication/authorization smoke passes.

Publication uses GitHub Actions trusted publishing and provenance when npm prerequisites are configured. GitHub visibility, npm access, license, and publication remain explicit owner gates.

## Consequences

A change to either package releases both. This trades extra package versions for reproducible compatibility and simpler incident analysis. Independent semver and automatic first publication were rejected.
