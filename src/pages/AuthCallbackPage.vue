<template>
  <v-container class="d-flex flex-column align-center justify-center" style="min-height: 60vh">
    <v-progress-circular indeterminate color="primary" size="48" />
    <p class="text-body-2 text-medium-emphasis mt-4">{{ message }}</p>
  </v-container>
</template>

<script lang="ts" setup>
  import { onMounted, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { handleCallback } from '@/services/auth'

  const router = useRouter()
  const message = ref('Finishing sign-in…')

  onMounted(async () => {
    try {
      const returnTo = await handleCallback()
      router.replace(returnTo ?? '/settings')
    } catch {
      message.value = 'Sign-in failed.'
      router.replace('/settings')
    }
  })
</script>
