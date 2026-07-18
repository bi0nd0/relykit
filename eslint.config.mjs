import createConfigForNuxt from '@nuxt/eslint-config'

export default createConfigForNuxt({
  features: {
    stylistic: false,
    tooling: true,
    typescript: true,
  },
}, {
  ignores: [
    '**/dist/**',
    '**/.nuxt/**',
    '**/.output/**',
    '**/node_modules/**',
    'release-artifacts/**',
  ],
  rules: {
    'no-console': ['warn', { allow: ['warn', 'error'] }],
  },
})
