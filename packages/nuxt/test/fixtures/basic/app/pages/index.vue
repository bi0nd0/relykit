<script setup lang="ts">
defineOptions({ name: 'AuthFixtureHomePage' })

const { principal } = useAuthSession()
</script>

<template>
  <main>
    <h1>Protected fixture</h1>
    <p data-testid="principal">{{ principal?.name }}</p>
  </main>
</template>
