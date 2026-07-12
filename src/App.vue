<template>
  <v-app>
    <v-main class="pb-16">
      <router-view />
    </v-main>
    <AppBottomNav />
    <v-snackbar
      v-model="app.snackbar"
      :color="app.snackbarColor"
      :timeout="3000"
    >
      {{ app.snackbarText }}
      <template v-if="app.snackbarAction" #actions>
        <v-btn variant="text" @click="runSnackbarAction">
          {{ app.snackbarAction.label }}
        </v-btn>
      </template>
    </v-snackbar>
  </v-app>
</template>

<script lang="ts" setup>
  import { watch } from 'vue'
  import { useTheme } from 'vuetify'
  import AppBottomNav from '@/components/layout/AppBottomNav.vue'
  import { useAppStore } from '@/stores/app'

  const app = useAppStore()
  const theme = useTheme()

  watch(() => app.darkMode, (dark) => {
    theme.global.name.value = dark ? 'dark' : 'light'
  }, { immediate: true })

  function runSnackbarAction() {
    app.snackbarAction?.handler()
    app.snackbar = false
  }
</script>
