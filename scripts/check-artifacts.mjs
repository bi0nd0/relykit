import { existsSync, readFileSync, readdirSync } from 'node:fs'

const manifests = [
  JSON.parse(readFileSync('packages/oidc/package.json', 'utf8')),
  JSON.parse(readFileSync('packages/nuxt/package.json', 'utf8')),
]

const expectedFilenames = manifests.map((manifest) => (
  `${manifest.name.slice(1).replace('/', '-')}-${manifest.version}.tgz`
))

for (const filename of expectedFilenames) {
  const path = `.artifacts/${filename}`
  if (!existsSync(path)) {
    throw new Error(`Expected release artifact was not written to ${path}.`)
  }
}

const actualFilenames = readdirSync('.artifacts').filter((filename) => filename.endsWith('.tgz')).sort()
if (actualFilenames.join('\n') !== expectedFilenames.sort().join('\n')) {
  throw new Error(`Unexpected release artifacts: ${actualFilenames.join(', ') || 'none'}.`)
}

process.stdout.write('Release artifacts are present in the repository .artifacts directory.\n')
