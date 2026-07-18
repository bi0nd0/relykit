import { mkdirSync, rmSync } from 'node:fs'

rmSync('release-artifacts', { force: true, recursive: true })
mkdirSync('release-artifacts', { recursive: true })
