declare module '#relykit/principal-adapter' {
  const principalAdapter: import('./types.js').PrincipalAdapter
  export default principalAdapter
}

declare module '#relykit/identity-profile' {
  const identityProfile: import('@relykit/oidc').IdentityProfileStrategy<unknown>
  export default identityProfile
}
