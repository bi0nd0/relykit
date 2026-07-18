import { execFileSync } from 'node:child_process'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const packages = ['@relykit/oidc', '@relykit/nuxt']
const allowedTopLevel = new Set(['LICENSE.md', 'README.md', 'dist', 'package.json'])
const forbidden = [
  /3bees/i,
  /rent helper/i,
  /better auth/i,
  /expectedRealmId/i,
  /realmId/i,
  /tenantContext/i,
  /\/Users\//,
  /\/private\/tmp\//,
]

for (const workspace of packages) {
  const output = execFileSync('npm', [
    'pack',
    '--dry-run',
    '--json',
    '--cache',
    '.npm-cache',
    '--workspace',
    workspace,
  ], { encoding: 'utf8' })
  const [result] = JSON.parse(output)
  if (!result?.files?.length) throw new Error(`${workspace} produced no package files.`)
  for (const file of result.files) {
    const topLevel = file.path.split('/')[0]
    if (!allowedTopLevel.has(topLevel)) {
      throw new Error(`${workspace} would publish unexpected path: ${file.path}`)
    }
  }
}

function filesBelow(directory) {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name)
    return statSync(path).isDirectory() ? filesBelow(path) : [path]
  })
}

for (const directory of ['packages/oidc/dist', 'packages/nuxt/dist']) {
  for (const file of filesBelow(directory)) {
    const contents = readFileSync(file, 'utf8')
    for (const pattern of forbidden) {
      if (pattern.test(contents)) {
        throw new Error(`Forbidden package content ${pattern} found in ${relative('.', file)}.`)
      }
    }
  }
}

process.stdout.write('Package contents are limited to the approved files and pass the neutrality scan.\n')
