<template>
  <v-container>
    <h1 class="text-h5 mb-4">History</h1>
    <WeeklyAverageCard />
    <TrendChart />
    <DailyHistoryList />
  </v-container>
</template>

<script lang="ts" setup>
  import WeeklyAverageCard from '@/components/history/WeeklyAverageCard.vue'
  import TrendChart from '@/components/history/TrendChart.vue'
  import DailyHistoryList from '@/components/history/DailyHistoryList.vue'
  import { useHistoryStore } from '@/stores/history'
  import { onMounted } from 'vue'

  const store = useHistoryStore()

  onMounted(async () => {
    await store.loadWeeklyData()
  })
</script>
