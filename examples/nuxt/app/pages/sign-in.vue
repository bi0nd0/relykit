<script setup lang="ts">
import { safeReturnPath } from '@relykit/oidc/access'

definePageMeta({ auth: 'guest-only' })

const route = useRoute()
const loginHref = computed(() => {
  const returnTo = safeReturnPath(route.query.returnTo)
  return `/api/auth/login?${new URLSearchParams({ returnTo }).toString()}`
})
</script>

<template>
  <main>
    <h1>Sign in</h1>
    <a :href="loginHref">Continue</a>
  </main>
</template>
