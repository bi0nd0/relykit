import type { AuthClientSession } from '../../types.js'
import {
  navigateTo,
  useRequestFetch,
  useRuntimeConfig,
  useState,
} from 'nuxt/app'
import { computed } from 'vue'

type PublicAuthConfig = {
  accessPath: string
  logoutPath: string
  loginPage: string
  clientStateKey: string
}

export type AuthRefreshResult =
  | { kind: 'authenticated'; session: AuthClientSession }
  | { kind: 'anonymous' }
  | { kind: 'forbidden' }
  | { kind: 'unavailable' }

function errorStatus(error: unknown) {
  if (!error || typeof error !== 'object') return 0
  if ('statusCode' in error && typeof error.statusCode === 'number') return error.statusCode
  if ('response' in error && error.response && typeof error.response === 'object'
    && 'status' in error.response && typeof error.response.status === 'number') {
    return error.response.status
  }
  return 0
}

export function useAuthSession() {
  const runtimeConfig = useRuntimeConfig()
  const config = runtimeConfig.public.auth as PublicAuthConfig
  const session = useState<AuthClientSession | null>(`${config.clientStateKey}:session`, () => null)
  const ready = useState<boolean>(`${config.clientStateKey}:ready`, () => false)

  async function refresh(): Promise<AuthRefreshResult> {
    try {
      const value = await useRequestFetch()<AuthClientSession>(config.accessPath)
      session.value = value
      ready.value = true
      if (!value.authenticated) {
        return { kind: value.reason === 'forbidden' ? 'forbidden' : 'anonymous' }
      }
      return { kind: 'authenticated', session: value }
    } catch (error) {
      session.value = null
      ready.value = true
      const status = errorStatus(error)
      if (status === 401) return { kind: 'anonymous' }
      if (status === 403) return { kind: 'forbidden' }
      return { kind: 'unavailable' }
    }
  }

  async function logout() {
    const response = await useRequestFetch()<{ logoutUrl: string | null }>(config.logoutPath, { method: 'POST' })
    session.value = null
    ready.value = true
    if (response.logoutUrl) {
      return navigateTo(response.logoutUrl, { external: true })
    }
    return navigateTo(config.loginPage)
  }

  return {
    session,
    principal: computed(() => session.value?.principal ?? null),
    authenticated: computed(() => session.value?.authenticated === true),
    ready,
    refresh,
    logout,
  }
}
