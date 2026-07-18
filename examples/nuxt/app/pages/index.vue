<script setup lang="ts">
defineOptions({ name: 'RelyKitExampleHome' })

const { principal, logout } = useAuthSession()
</script>

<template>
  <main>
    <h1>Account</h1>
    <p v-if="principal">Signed in as {{ principal.name ?? principal.email ?? principal.id }}</p>
    <button type="button" @click="logout">Sign out</button>
  </main>
</template>
