<template>
  <v-container>
    <h1 class="text-h5 mb-4">Today</h1>
    <DailySummaryCard />
    <DailyEntryList class="mt-4" />
    <AddEntryDialog />
  </v-container>
</template>

<script lang="ts" setup>
  import DailySummaryCard from '@/components/today/DailySummaryCard.vue'
  import DailyEntryList from '@/components/today/DailyEntryList.vue'
  import AddEntryDialog from '@/components/today/AddEntryDialog.vue'
  import { useDailyLogStore } from '@/stores/dailyLog'
  import { onMounted } from 'vue'

  const store = useDailyLogStore()

  onMounted(async () => {
    await store.loadGoals()
    await store.loadDate()
  })
</script>
