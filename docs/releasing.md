# Releasing

RelyKit uses one fixed version for `@relykit/oidc` and `@relykit/nuxt`. The Nuxt package depends on that exact OIDC version. Release a prerelease before the first stable version.

## Approved release profile

- License: MIT.
- npm access: public scoped packages.
- Repository: public before provenance-backed publication.
- Maintainer and npm organization owner: `bi0nd0`.
- Security contact: GitHub private vulnerability reporting.
- Supported prerelease range: Node.js >=22.18 and <27, npm >=10 and <12, and Nuxt >=4.4 and <5.

The remaining publication gate is the owner's interactive bootstrap publish. No stable package may be released before the registry-installed prerelease and Rent Helper smoke pass.

## Owner responsibilities

The repository owner performs npm sign-in, organization/scope creation, maintainer changes, trusted-publisher configuration, 2FA approval, and publication. Never paste an npm password, access token, recovery code, or one-time code into an issue, pull request, terminal transcript, or chat.

## Prerelease preparation

1. Coordinate both package versions and keep `@relykit/nuxt`'s `@relykit/oidc` dependency exact.
2. Run the local gate in [testing.md](testing.md).
3. Run `npm run check:release -- <version>`.
4. Run `npm run pack:packages`; inspect `.artifacts/` and record SHA-256 checksums.
5. Install both tarballs in a clean Nuxt consumer and build it without workspace resolution.

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

## Bootstrap publication commands

The bootstrap must not use `latest`. From a clean checkout of the reviewed release commit, first verify the npm identity and frozen artifacts, then publish the exact tarballs:

```bash
npm whoami
shasum -a 256 .artifacts/relykit-oidc-0.1.0-beta.0.tgz .artifacts/relykit-nuxt-0.1.0-beta.0.tgz
npm publish --access public --tag bootstrap .artifacts/relykit-oidc-0.1.0-beta.0.tgz
npm publish --access public --tag bootstrap .artifacts/relykit-nuxt-0.1.0-beta.0.tgz
```

The expected identity is `bi0nd0`. npm may request the account's 2FA code during each publish; enter it only in npm's terminal prompt. Stop if the displayed package name, version, access, or file list differs from the reviewed artifact. These commands create only the `bootstrap` tag and do not create or move `latest`.

After both package pages exist, configure the trusted publishers exactly as shown above. The coordinated `0.1.0-beta.1` release is then dispatched through GitHub Actions with `tag=next`, `access=public`, and `dry_run=false`; the owner approves the protected `npm` environment when prompted.

## Recovery

- If the second package fails, do not publish a different build under the same version. Correct the cause, choose a new prerelease version, rebuild both packages, and repeat validation.
- Do not unpublish a consumed version as routine rollback. Move dist-tags away from the bad prerelease and release a corrected version.
- Never promote a prerelease to `latest` until a registry-installed consumer and the Rent Helper production smoke pass.

## Authoritative npm references

- [Trusted publishers](https://docs.npmjs.com/trusted-publishers/)
- [`npm trust`](https://docs.npmjs.com/cli/v11/commands/npm-trust/)
- [Scoped public packages](https://docs.npmjs.com/creating-and-publishing-scoped-public-packages/)
- [Provenance requirements](https://docs.npmjs.com/generating-provenance-statements/)
