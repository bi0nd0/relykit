# Releasing

RelyKit uses one fixed version for `@relykit/oidc` and `@relykit/nuxt`. The Nuxt package depends on that exact OIDC version. Release a prerelease before the first stable version.

## Current publication blockers

- The repository is private.
- Both package manifests are `UNLICENSED` and no `LICENSE` file exists.
- The owner has not yet confirmed public versus restricted npm access.
- Ownership of the `@relykit` npm scope has not been verified.
- The security contact, maintainer list, and final Node/Nuxt support promise need owner confirmation.

`npm run check:release -- <version>` intentionally fails until the license is selected and package metadata is updated.

## Owner responsibilities

The repository owner performs npm sign-in, organization/scope creation, maintainer changes, trusted-publisher configuration, 2FA approval, and publication. Never paste an npm password, access token, recovery code, or one-time code into an issue, pull request, terminal transcript, or chat.

## Prerelease preparation

1. Select the license and add its canonical `LICENSE` text. Replace `UNLICENSED` in both package manifests.
2. Confirm whether npm access is `public` or `restricted`; for ordinary open installation, use public scoped packages.
3. Confirm the supported Node/Nuxt matrix, security contact, and maintainers.
4. Set both package versions to `0.1.0-beta.1` and set `@relykit/nuxt`'s `@relykit/oidc` dependency to exactly `0.1.0-beta.1`.
5. Run the local gate in [testing.md](testing.md).
6. Run `npm run check:release -- 0.1.0-beta.1`.
7. Run `npm run pack:packages`; inspect `.artifacts/` and record SHA-256 checksums.
8. Install both tarballs in a clean Nuxt consumer and build it without workspace resolution.

## Trusted publishing

The release workflow is `.github/workflows/release.yml`, environment `npm`, and packages are published with provenance using GitHub's OIDC identity. Configure npm trusted publishers only against the exact `bi0nd0/relykit` repository, workflow filename, and optional `npm` environment documented in the workflow.

The GitHub environment should require owner approval. Do not add a long-lived npm automation token when trusted publishing is available.

## Publication commands

Exact owner-run npm website fields and terminal commands are finalized at the publication handoff after scope ownership, access, and license decisions are known. The prerelease must use the `next` dist-tag so it cannot replace `latest`:

```bash
npm publish --provenance --access public --tag next <reviewed-oidc-tarball>
npm publish --provenance --access public --tag next <reviewed-nuxt-tarball>
```

These examples are not authorization to publish and must not be run until the frozen artifacts and access choice are approved.

## Recovery

- If the second package fails, do not publish a different build under the same version. Correct the cause, choose a new prerelease version, rebuild both packages, and repeat validation.
- Do not unpublish a consumed version as routine rollback. Move dist-tags away from the bad prerelease and release a corrected version.
- Never promote a prerelease to `latest` until a registry-installed consumer and the Rent Helper production smoke pass.
