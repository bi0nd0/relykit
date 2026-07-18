import { mkdirSync, rmSync } from 'node:fs'

rmSync('.artifacts', { force: true, recursive: true })
mkdirSync('.artifacts', { recursive: true })
