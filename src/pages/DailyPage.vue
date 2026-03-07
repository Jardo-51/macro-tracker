<template>
  <v-container>
    <div class="d-flex align-center justify-space-between mb-4">
      <v-btn icon variant="text" @click="goToPreviousDay">
        <v-icon>mdi-chevron-left</v-icon>
      </v-btn>
      <h1 class="text-h5">{{ displayDate }}</h1>
      <v-btn icon variant="text" :disabled="isToday" @click="goToNextDay">
        <v-icon>mdi-chevron-right</v-icon>
      </v-btn>
    </div>
    <DailySummaryCard />
    <DailyEntryList class="mt-4" />
    <AddEntryDialog />
  </v-container>
</template>

<script lang="ts" setup>
  import { computed, onMounted } from 'vue'
  import DailySummaryCard from '@/components/daily/DailySummaryCard.vue'
  import DailyEntryList from '@/components/daily/DailyEntryList.vue'
  import AddEntryDialog from '@/components/daily/AddEntryDialog.vue'
  import { useDailyLogStore } from '@/stores/dailyLog'
  import { today, addDays, formatDisplayDate } from '@/utils/date'

  const store = useDailyLogStore()

  const isToday = computed(() => store.currentDate === today())
  const displayDate = computed(() => formatDisplayDate(store.currentDate))

  function goToPreviousDay() {
    store.loadDate(addDays(store.currentDate, -1))
  }

  function goToNextDay() {
    store.loadDate(addDays(store.currentDate, 1))
  }

  onMounted(async () => {
    await store.loadGoals()
    await store.loadDate()
  })
</script>
