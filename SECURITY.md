# Security policy

RelyKit is prerelease software and has no published supported version yet.

## Reporting a vulnerability

Do not open a public issue for a suspected vulnerability and do not include credentials, tokens, claims, cookies, personal data, or exploit details in logs or screenshots.

While the repository is private, contact the repository owner through the existing private collaboration channel. Before public release, the owner must enable GitHub private vulnerability reporting and identify a security contact here.

Include the affected version or commit, impact, minimal reproduction, and any known mitigation. Use synthetic credentials and identities.

## Security boundary

RelyKit validates OIDC authentication and exposes application authorization hooks. It does not secure an application whose principal adapter grants access incorrectly, whose independently authenticated endpoints skip their own verification, or whose deployment exposes server runtime secrets.

Security-sensitive changes require tests for failure behavior, package-content review, dependency audit, and a prerelease consumer smoke before stable publication.
