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

## Bootstrap and trusted publishing

An npm package must already exist before a trusted publisher can be configured. Therefore, the owner first publishes reviewed `0.1.0-beta.0` bootstrap tarballs interactively under a non-default `bootstrap` tag. After both package pages exist, configure a trusted publisher for each package.

The release workflow is `.github/workflows/release.yml`, environment `npm`, and future packages are published through GitHub's OIDC identity. Configure npm trusted publishers only against the exact `bi0nd0/relykit` repository, `release.yml` workflow filename, and `npm` environment. Allow `npm publish`.

The GitHub environment should require owner approval. Do not add a long-lived npm automation token when trusted publishing is available.

Trusted publishing currently requires npm 11.5.1 or later and Node 22.14 or later. Provenance is generated automatically only when the trusted workflow publishes a public package from a public repository. If the repository remains private, trusted publishing can still remove the long-lived token, but npm will not create provenance. Public GitHub visibility is therefore a separate explicit owner gate before the provenance-backed beta.

After the bootstrap exists, the owner can configure each package through npmjs.com (`Package settings` → `Trusted Publisher` → `GitHub Actions`) with:

| Field | Value |
|---|---|
| Organization or user | `bi0nd0` |
| Repository | `relykit` |
| Workflow filename | `release.yml` |
| Environment | `npm` |
| Allowed action | `npm publish` |

The npm 11 CLI equivalent is:

```bash
npm trust github @relykit/oidc --repo bi0nd0/relykit --file release.yml --env npm --allow-publish
npm trust github @relykit/nuxt --repo bi0nd0/relykit --file release.yml --env npm --allow-publish
```

These commands require the owner's interactive npm authentication and 2FA. The trust form is not validated when saved, so verify every case-sensitive field before the first workflow publication.

## Publication commands

Exact owner-run npm website fields and terminal commands are finalized at the publication handoff after scope ownership, access, and license decisions are known. The bootstrap must not use `latest`; the trusted beta uses `next`:

```bash
npm publish --access <public-or-restricted> --tag bootstrap <reviewed-beta.0-oidc-tarball>
npm publish --access <public-or-restricted> --tag bootstrap <reviewed-beta.0-nuxt-tarball>
```

These examples are not authorization to publish and must not be run until the frozen artifacts and access choice are approved.

## Recovery

- If the second package fails, do not publish a different build under the same version. Correct the cause, choose a new prerelease version, rebuild both packages, and repeat validation.
- Do not unpublish a consumed version as routine rollback. Move dist-tags away from the bad prerelease and release a corrected version.
- Never promote a prerelease to `latest` until a registry-installed consumer and the Rent Helper production smoke pass.

## Authoritative npm references

- [Trusted publishers](https://docs.npmjs.com/trusted-publishers/)
- [`npm trust`](https://docs.npmjs.com/cli/v11/commands/npm-trust/)
- [Scoped public packages](https://docs.npmjs.com/creating-and-publishing-scoped-public-packages/)
- [Provenance requirements](https://docs.npmjs.com/generating-provenance-statements/)
