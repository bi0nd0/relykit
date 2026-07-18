<script setup lang="ts">
import { computed } from 'vue'
import { safeReturnPath } from '@relykit/oidc/access'

defineOptions({ name: 'AuthFixtureLoginPage' })
definePageMeta({ auth: 'guest-only' })

const route = useRoute()
const loginHref = computed(() => {
  const returnTo = safeReturnPath(route.query.returnTo)
  return `/api/auth/login?${new URLSearchParams({ returnTo }).toString()}`
})
</script>

<template>
  <main>
    <h1>Fixture login</h1>
    <a :href="loginHref">Continue to identity</a>
  </main>
</template>
