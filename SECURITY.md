# Security policy

RelyKit `0.1.x` is the supported stable release line.

## Reporting a vulnerability

Do not open a public issue for a suspected vulnerability and do not include credentials, tokens, claims, cookies, personal data, or exploit details in logs or screenshots.

Report suspected vulnerabilities through [GitHub private vulnerability reporting](https://github.com/bi0nd0/relykit/security/advisories/new). This creates a private advisory visible to the repository maintainer. Do not use a public issue for security reports.

Include the affected version or commit, impact, minimal reproduction, and any known mitigation. Use synthetic credentials and identities.

## Security boundary

RelyKit validates OIDC authentication and exposes application authorization hooks. It does not secure an application whose principal adapter grants access incorrectly, whose independently authenticated endpoints skip their own verification, or whose deployment exposes server runtime secrets.

Security-sensitive changes require tests for failure behavior, package-content review, dependency audit, a clean packaged consumer, and an affected-application smoke before publication.

## Supported versions

| Version | Supported |
|---|---|
| `0.1.x` | Yes |
| `0.1.0-beta.x` | No; upgrade to stable |

Security fixes target the newest supported patch release. A correction to either package releases both packages at the same coordinated version.
