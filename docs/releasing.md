# Releasing

RelyKit uses one fixed version for `@relykit/oidc` and `@relykit/nuxt`. The Nuxt package depends on that exact OIDC version. Release a prerelease before the first stable version.

## Approved release profile

- License: MIT.
- npm access: public scoped packages.
- Repository: public before provenance-backed publication.
- Maintainer and npm organization owner: `bi0nd0`.
- Security contact: GitHub private vulnerability reporting.
- Supported prerelease range: Node.js >=22.18 and <27, npm >=10 and <12, and Nuxt >=4.4 and <5.

The interactive `0.1.0-beta.0` bootstrap is published and both npm packages trust the exact GitHub workflow described below. The remaining prerelease gates are the provenance-backed `0.1.0-beta.1` release and the registry-installed Rent Helper smoke pass. No stable package may be released before those gates pass.

## Owner responsibilities

The repository owner performs npm sign-in, organization/scope creation, maintainer changes, trusted-publisher configuration, 2FA approval, and publication. Never paste an npm password, access token, recovery code, or one-time code into an issue, pull request, terminal transcript, or chat.

## Prerelease preparation

1. Coordinate both package versions and keep `@relykit/nuxt`'s `@relykit/oidc` dependency exact.
2. Run the local gate in [testing.md](testing.md).
3. Run `npm run check:release -- <version>`.
4. Run `npm run pack:packages`; inspect `.artifacts/` and record SHA-256 checksums.
5. Install both tarballs in a clean Nuxt consumer and build it without workspace resolution.

## Bootstrap and trusted publishing

An npm package must already exist before a trusted publisher can be configured. The reviewed `0.1.0-beta.0` bootstrap tarballs created both package pages interactively under a non-default `bootstrap` tag. Configure a trusted publisher for each package before publishing another version.

The release workflow is `.github/workflows/release.yml`, environment `npm`, and future packages are published through GitHub's OIDC identity. Configure npm trusted publishers only against the exact `bi0nd0/relykit` repository, `release.yml` workflow filename, and `npm` environment. Allow `npm publish`.

The GitHub environment should require owner approval. Do not add a long-lived npm automation token when trusted publishing is available.

Trusted publishing currently requires npm 11.5.1 or later and Node 22.14 or later. Provenance is generated automatically only when the trusted workflow publishes a public package from a public repository. If the repository remains private, trusted publishing can still remove the long-lived token, but npm will not create provenance. Public GitHub visibility is therefore a separate explicit owner gate before the provenance-backed beta.

Each package is configured through npmjs.com (`Package settings` → `Trusted Publisher` → `GitHub Actions`) with:

| Field | Value |
|---|---|
| Organization or user | `bi0nd0` |
| Repository | `relykit` |
| Workflow filename | `release.yml` |
| Environment | `npm` |
| Allowed action | `npm publish` |

npm 11.12.1 does not support the newer `--allow-publish` CLI flag, and its supported trust command returned HTTP 400 after authentication during this bootstrap. The npm website is the verified authority for this release. Both package settings pages show `bi0nd0/relykit`, `release.yml`, environment `npm`, and permission `npm publish`.

## Bootstrap publication record

The bootstrap was published from commit `2f96174` after verifying npm identity `bi0nd0` and these frozen SHA-256 checksums:

```text
@relykit/oidc  00b676488a44c9f6cd0d8866403df9dafcaa5bd2b6e639df8df920cf2f9a14e4
@relykit/nuxt  12aebab7bb56601e7655edaab3cd2acaea943402c769ad03c8961df251d025e6
```

Registry downloads match both frozen checksums. npm retained an initial `latest` tag in addition to `bootstrap` and rejected its removal with HTTP 400 while `0.1.0-beta.0` is the only published version. Do not unpublish the version to work around that registry behavior. Consumers must install the exact prerelease version; no future prerelease workflow may select or move `latest`.

The coordinated `0.1.0-beta.1` release is dispatched through GitHub Actions with `tag=next`, `access=public`, and `dry_run=false`; the owner approves the protected `npm` environment when prompted.

## Recovery

- If the second package fails, do not publish a different build under the same version. Correct the cause, choose a new prerelease version, rebuild both packages, and repeat validation.
- Do not unpublish a consumed version as routine rollback. Move dist-tags away from the bad prerelease and release a corrected version.
- Do not move the initial `latest` tag to another prerelease. The first deliberate `latest` promotion is the stable release after the registry-installed consumer and Rent Helper production smoke pass.

## Authoritative npm references

- [Trusted publishers](https://docs.npmjs.com/trusted-publishers/)
- [`npm trust`](https://docs.npmjs.com/cli/v11/commands/npm-trust/)
- [Scoped public packages](https://docs.npmjs.com/creating-and-publishing-scoped-public-packages/)
- [Provenance requirements](https://docs.npmjs.com/generating-provenance-statements/)
