import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'
import {
  LoginInitiationError,
  resolveLoginInitiation,
} from '../src/runtime/server/login-initiation.js'

const issuer = 'https://identity.example.com/realms/example'

describe('OIDC third-party initiated login', () => {
  it('accepts the exact server-configured issuer for GET and POST', () => {
    expect(resolveLoginInitiation({
      method: 'GET',
      input: { iss: issuer },
      configuredIssuer: issuer,
    })).toEqual({ kind: 'third-party' })
    expect(resolveLoginInitiation({
      method: 'POST',
      input: { iss: issuer },
      configuredIssuer: issuer,
    })).toEqual({ kind: 'third-party' })
  })

  it('retains the existing local GET login contract', () => {
    expect(resolveLoginInitiation({
      method: 'GET',
      input: { returnTo: '/settings' },
      configuredIssuer: issuer,
    })).toEqual({ kind: 'local', returnTo: '/settings' })
  })

  it('rejects POST without issuer and every mismatched or ambiguous issuer', () => {
    for (const candidate of [
      undefined,
      'https://attacker.example',
      `${issuer}/`,
      [issuer, 'https://attacker.example'],
    ]) {
      expect(() => resolveLoginInitiation({
        method: candidate === undefined ? 'POST' : 'GET',
        input: candidate === undefined ? {} : { iss: candidate },
        configuredIssuer: issuer,
      })).toThrow(LoginInitiationError)
    }
  })

  it('rejects caller-selected target links and ignores bounded hints', () => {
    expect(() => resolveLoginInitiation({
      method: 'GET',
      input: { iss: issuer, target_link_uri: 'https://attacker.example' },
      configuredIssuer: issuer,
    })).toThrow(/target_link_uri/)
    expect(resolveLoginInitiation({
      method: 'GET',
      input: { iss: issuer, login_hint: 'user@example.test', returnTo: '/ignored' },
      configuredIssuer: issuer,
    })).toEqual({ kind: 'third-party' })
  })

  it('registers both GET and POST on the same trusted handler', async () => {
    const source = await readFile(new URL('../src/module.ts', import.meta.url), 'utf8')
    expect(source.match(/route: options\.loginPath/g)).toHaveLength(2)
    expect(source).toContain("method: 'get'")
    expect(source).toContain("method: 'post'")
    expect(source.match(/runtime\/server\/handlers\/login'/g)).toHaveLength(2)
  })
})
