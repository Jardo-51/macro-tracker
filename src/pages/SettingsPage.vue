<template>
  <v-container>
    <h1 class="text-h5 mb-4">Settings</h1>
    <ThemeToggle />
    <GoalsForm />
    <AiSettings />
    <DataManagement />
    <AboutSection />
  </v-container>
</template>

<script lang="ts" setup>
  import ThemeToggle from '@/components/settings/ThemeToggle.vue'
  import AiSettings from '@/components/settings/AiSettings.vue'
  import GoalsForm from '@/components/settings/GoalsForm.vue'
  import DataManagement from '@/components/settings/DataManagement.vue'
  import AboutSection from '@/components/settings/AboutSection.vue'
  import { useDailyLogStore } from '@/stores/dailyLog'
  import { onMounted } from 'vue'

  const store = useDailyLogStore()

  onMounted(() => {
    store.loadGoals()
  })
</script>
