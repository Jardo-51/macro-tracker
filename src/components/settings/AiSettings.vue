<template>
  <v-card class="mb-4">
    <v-card-title>AI Estimation</v-card-title>
    <v-card-text>
      <p class="text-body-2 text-medium-emphasis mb-3">
        Enter your OpenAI API key to enable AI-powered macro estimation when adding food entries.
      </p>
      <v-text-field
        v-model="keyInput"
        label="OpenAI API key"
        :type="showKey ? 'text' : 'password'"
        variant="outlined"
        density="compact"
        hide-details
        :append-inner-icon="showKey ? 'mdi-eye-off' : 'mdi-eye'"
        @click:append-inner="showKey = !showKey"
      />
    </v-card-text>
    <v-card-actions>
      <v-spacer />
      <v-btn
        v-if="app.openaiApiKey"
        variant="text"
        color="error"
        @click="clearKey"
      >
        Clear
      </v-btn>
      <v-btn
        color="primary"
        variant="flat"
        :disabled="!keyInput.trim() || keyInput.trim() === app.openaiApiKey"
        @click="saveKey"
      >
        Save
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script lang="ts" setup>
  import { ref } from 'vue'
  import { useAppStore } from '@/stores/app'

  const app = useAppStore()
  const keyInput = ref(app.openaiApiKey)
  const showKey = ref(false)

  function saveKey() {
    app.setOpenaiApiKey(keyInput.value.trim())
    app.showSnackbar('API key saved')
  }

  function clearKey() {
    app.clearOpenaiApiKey()
    keyInput.value = ''
    app.showSnackbar('API key removed')
  }
</script>
