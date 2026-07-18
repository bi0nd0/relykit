import { readFileSync } from 'node:fs'

const expected = process.argv[2]
if (!expected || !/^\d+\.\d+\.\d+(?:-[0-9a-z.-]+)?$/i.test(expected)) {
  throw new Error('Usage: npm run check:release -- <semver>')
}

const manifests = [
  JSON.parse(readFileSync('packages/oidc/package.json', 'utf8')),
  JSON.parse(readFileSync('packages/nuxt/package.json', 'utf8')),
]
for (const manifest of manifests) {
  if (manifest.version !== expected) {
    throw new Error(`${manifest.name} is ${manifest.version}; expected ${expected}.`)
  }
  if (!['UNLICENSED', 'SEE LICENSE IN LICENSE.md'].includes(manifest.license)) {
    throw new Error(`${manifest.name} must declare the approved proprietary license metadata.`)
  }
}
if (manifests[1].dependencies['@relykit/oidc'] !== expected) {
  throw new Error(`@relykit/nuxt must depend on the exact coordinated @relykit/oidc version ${expected}.`)
}

process.stdout.write(`Coordinated release ${expected} is publication-ready.\n`)
