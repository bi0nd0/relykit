import { createHash } from 'node:crypto'
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'

const mode = process.argv[2]
if (mode !== 'write' && mode !== 'verify') {
  throw new Error('Usage: node scripts/artifact-checksums.mjs <write|verify>')
}

const artifactDirectory = 'release-artifacts'
const checksumPath = `${artifactDirectory}/SHA256SUMS`
const artifactFilenames = readdirSync(artifactDirectory)
  .filter((filename) => filename.endsWith('.tgz'))
  .sort()

const manifest = `${artifactFilenames.map((filename) => {
  const digest = createHash('sha256')
    .update(readFileSync(`${artifactDirectory}/${filename}`))
    .digest('hex')
  return `${digest}  ${filename}`
}).join('\n')}\n`

if (mode === 'write') {
  writeFileSync(checksumPath, manifest, { encoding: 'utf8', mode: 0o644 })
  process.stdout.write(manifest)
} else {
  const retainedManifest = readFileSync(checksumPath, 'utf8')
  if (retainedManifest !== manifest) {
    throw new Error('Release artifact checksums do not match the retained SHA256SUMS manifest.')
  }
  process.stdout.write('Release artifact checksums match the retained SHA256SUMS manifest.\n')
}
