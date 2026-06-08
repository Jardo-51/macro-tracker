<template>
  <v-card class="mb-4">
    <v-card-title>AI Estimation</v-card-title>
    <v-card-text>
      <p class="text-body-2 text-medium-emphasis mb-0">
        <template v-if="app.aiLoggedIn">
          AI features are enabled<template v-if="app.aiUserName"> for {{ app.aiUserName }}</template>.
        </template>
        <template v-else>
          Log in to enable AI-powered macro estimation, label scanning and menu recommendations.
          You stay logged in across visits; no account is needed to use the rest of the app.
        </template>
      </p>
    </v-card-text>
    <v-card-actions>
      <v-spacer />
      <v-btn
        v-if="app.aiLoggedIn"
        variant="text"
        color="error"
        @click="app.logoutFromAi()"
      >
        Log out
      </v-btn>
      <v-btn
        v-else
        color="primary"
        variant="flat"
        @click="app.loginForAi()"
      >
        Log in
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script lang="ts" setup>
  import { useAppStore } from '@/stores/app'

  const app = useAppStore()
</script>
