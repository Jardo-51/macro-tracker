<template>
  <v-card>
    <v-card-title class="d-flex align-center">
      <span>Daily Progress</span>
      <v-spacer />
      <span class="text-body-2 text-medium-emphasis">
        {{ store.dailyTotals.calories }} / {{ store.goals.calories }} kcal ({{ Math.round(store.progressPercentages.calories) }}%)
      </span>
    </v-card-title>
    <v-card-text>
      <div
        v-for="macro in macros"
        :key="macro.key"
        class="mb-3"
      >
        <div class="d-flex justify-space-between text-body-2 mb-1">
          <span>{{ macro.label }}</span>
          <span>
            {{ store.dailyTotals[macro.key] }}{{ macro.unit }} / {{ store.goals[macro.goalKey] }}{{ macro.unit }} ({{ Math.round(store.progressPercentages[macro.goalKey]) }}%)
          </span>
        </div>
        <v-progress-linear
          :model-value="store.progressPercentages[macro.goalKey]"
          :color="macro.color"
          height="12"
          rounded
        />
      </div>
    </v-card-text>
  </v-card>
</template>

<script lang="ts" setup>
  import { useDailyLogStore } from '@/stores/dailyLog'

  const store = useDailyLogStore()

  const macros = [
    { key: 'calories' as const, goalKey: 'calories' as const, label: 'Calories', unit: ' kcal', color: 'macro-calories' },
    { key: 'protein' as const, goalKey: 'protein' as const, label: 'Protein', unit: 'g', color: 'macro-protein' },
    { key: 'carbsTotal' as const, goalKey: 'carbsTotal' as const, label: 'Carbs', unit: 'g', color: 'macro-carbs' },
    { key: 'fat' as const, goalKey: 'fat' as const, label: 'Fat', unit: 'g', color: 'macro-fat' },
  ]
</script>
