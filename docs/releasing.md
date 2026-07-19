# Releasing

RelyKit uses one fixed version for `@relykit/oidc` and `@relykit/nuxt`. The Nuxt package depends on that exact OIDC version. Every release is built, inspected, and published as a coordinated pair.

## Approved release profile

- License: MIT.
- npm access: public scoped packages.
- Repository: public before provenance-backed publication.
- Maintainer and npm organization owner: `bi0nd0`.
- Security contact: GitHub private vulnerability reporting.
- Supported stable range: Node.js >=22.18 and <27, npm >=10 and <12, and Nuxt >=4.4 and <5.

The interactive `0.1.0-beta.0` bootstrap, provenance-backed `0.1.0-beta.1`, and stable `0.1.0` releases are published. Stable registry artifacts match the retained GitHub artifacts byte-for-byte, and Rent Helper passed the clean-package and real IdFabric integration gates. Every future publication remains an explicit owner action.

## Owner responsibilities

The repository owner performs npm sign-in, organization/scope creation, maintainer changes, trusted-publisher configuration, 2FA approval, and publication. Never paste an npm password, access token, recovery code, or one-time code into an issue, pull request, terminal transcript, or chat.

## Release preparation

1. Coordinate both package versions and keep `@relykit/nuxt`'s `@relykit/oidc` dependency exact.
2. Run the local gate in [testing.md](testing.md).
3. Run `npm run check:release -- <version>`.
4. Run `npm run pack:packages`; inspect `release-artifacts/` and its generated `SHA256SUMS` manifest.
5. Install both tarballs in a clean Nuxt consumer and build it without workspace resolution.
6. Run hinted, hintless, invalid, replayed, and unavailable-provider logout against a real conforming provider; inspect browser URLs, transition headers, callback state, and post-logout protected access.

## Bootstrap and trusted publishing

An npm package must already exist before a trusted publisher can be configured. The reviewed `0.1.0-beta.0` bootstrap tarballs created both package pages interactively under a non-default `bootstrap` tag. Configure a trusted publisher for each package before publishing another version.

The release workflow is `.github/workflows/release.yml`, environment `npm`, and future packages are published through GitHub's OIDC identity. Configure npm trusted publishers only against the exact `bi0nd0/relykit` repository, `release.yml` workflow filename, and `npm` environment. Allow `npm publish`.

The GitHub environment should require owner approval. Do not add a long-lived npm automation token when trusted publishing is available.

Trusted publishing currently requires npm 11.5.1 or later and Node 22.14 or later. Provenance is generated automatically because the workflow publishes public packages from this public repository.

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

Registry downloads match both frozen checksums. npm retained an initial `latest` tag in addition to `bootstrap` and rejected its removal with HTTP 400. Publishing `0.1.0-beta.1` under `next` left that registry-created `latest` tag on beta.0. Do not unpublish either prerelease to work around that behavior; stable publication deliberately replaces `latest` through the reviewed workflow.

The coordinated `0.1.0-beta.1` release was published by GitHub Actions run `29631158248` with `tag=next`, `access=public`, and `dry_run=false`. Its retained GitHub artifacts match npm byte-for-byte:

```text
@relykit/oidc  5f4e5f2cebb43a0ea806f0988b3f882c7e112f2d51147c724660ba43e9ae5fc5
@relykit/nuxt  fb5c6f3db2dee9288e2a2385f5b1de6cde57731eab6e33a9b39e58fd01a533fd
```

## Stable 0.1.0 publication record

Stable `0.1.0` was published from commit `d28ded613e90ca4a003ef1ae5be1240454837d73`. Protected dry-run workflow `29697045636` built the authoritative artifacts, and protected publication workflow `29697114980` validated that exact source run, downloaded its retained bytes, verified `SHA256SUMS`, and published without repacking.

The locally packed candidate passed the complete repository gate, clean disposable Rent Helper build, and real IdFabric hinted, hintless, replay, unavailable-provider recovery, and browser reauthentication smoke on 2026-07-19. Its package payloads were later confirmed file-for-file identical to the protected workflow artifacts. The outer npm tarball bytes are not used as a cross-environment reproducibility promise because gzip compression can differ while the extracted payload remains identical.

The npm records are public, `latest` resolves to `0.1.0`, Nuxt depends on exact OIDC `0.1.0`, and both packages expose SLSA provenance. Registry downloads and [GitHub release v0.1.0](https://github.com/bi0nd0/relykit/releases/tag/v0.1.0) match these retained SHA-256 values:

```text
@relykit/oidc  1666dc26a84e1fd36010f5b87e4a968b06e6b36a359308d4ea84a20cd7152541
@relykit/nuxt  05c494cc76640b0f14ecd0dc133621edae1a29ae256f5bf4c09b98184191776d
```

## Future coordinated releases

The protected dry run is the publication artifact authority. It builds both tarballs once, records their exact SHA-256 values in `SHA256SUMS`, and retains all three files in GitHub Actions. The publication run accepts that successful dry-run run ID, verifies the run used the same commit and release workflow, downloads those exact retained files, verifies the manifest, and publishes them without invoking `npm pack` again.

1. Run the release workflow with the exact coordinated version, intended `next` or `latest` tag, `access=public`, and `dry_run=true`.
2. Approve the protected `npm` environment when GitHub requests owner review.
3. Download the retained `relykit-<version>` artifact, verify `SHA256SUMS`, inspect both tarballs, and install them in a clean consumer.
4. Re-run the workflow with `dry_run=false` and `artifact_run_id=<successful-dry-run-id>`, then approve the same protected environment. Publication fails closed if the source run did not succeed on the exact publication commit and workflow.
5. Verify both npm records show the coordinated version, intended tag, public access, expected repository directory, SLSA provenance, and byte-for-byte agreement with the reviewed workflow artifacts.
6. Create the matching GitHub release from the published commit and attach the exact retained tarballs plus `SHA256SUMS`.

Dispatch the two workflow runs from an authenticated GitHub CLI session:

```bash
gh workflow run release.yml --repo bi0nd0/relykit --ref main \
  -f version=<version> -f tag=<next-or-latest> -f access=public -f dry_run=true

# After the retained dry-run artifact is reviewed:
gh workflow run release.yml --repo bi0nd0/relykit --ref main \
  -f version=<version> -f tag=<next-or-latest> -f access=public -f dry_run=false \
  -f artifact_run_id=<successful-dry-run-id>
```

Each dispatch pauses at the protected `npm` environment until `bi0nd0` approves it in GitHub Actions. Approval authorizes that single run only. The dry run never executes either `npm publish` step.

Record the retained dry-run checksums only after the complete logout implementation, clean package verification, and real-provider gate are green. Earlier local `0.1.0` tarball checksums are superseded and must not be used as the publication identity.

Do not publish from a local token or move `latest` by hand before both packages exist. The workflow publishes OIDC first; if Nuxt then fails, preserve the evidence, do not overwrite `0.1.0`, and recover with a coordinated `0.1.1` release.

## Recovery

- If the second package fails, do not publish a different build under the same version. Correct the cause, choose a new coordinated patch or prerelease version, rebuild both packages, and repeat validation.
- Do not unpublish a consumed version as routine rollback. Move dist-tags away from the bad prerelease and release a corrected version.
- Do not move `latest` to a prerelease. Stable publication through the reviewed workflow is the only supported `latest` transition.

## Authoritative npm references

- [Trusted publishers](https://docs.npmjs.com/trusted-publishers/)
- [`npm trust`](https://docs.npmjs.com/cli/v11/commands/npm-trust/)
- [Scoped public packages](https://docs.npmjs.com/creating-and-publishing-scoped-public-packages/)
- [Provenance requirements](https://docs.npmjs.com/generating-provenance-statements/)
