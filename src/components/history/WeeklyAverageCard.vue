<template>
  <v-card class="mb-4">
    <v-card-title>Weekly Averages</v-card-title>
    <v-card-text>
      <v-row dense>
        <v-col
          v-for="macro in macros"
          :key="macro.key"
          cols="6"
          sm="3"
        >
          <div class="text-center">
            <div class="text-h6" :class="`text-${macro.color}`">
              {{ store.weeklyAverages[macro.key] }}
            </div>
            <div class="text-caption text-medium-emphasis">{{ macro.label }}</div>
          </div>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script lang="ts" setup>
  import { useHistoryStore } from '@/stores/history'

  const store = useHistoryStore()

  const macros = [
    { key: 'calories' as const, label: 'Calories', color: 'macro-calories' },
    { key: 'protein' as const, label: 'Protein (g)', color: 'macro-protein' },
    { key: 'carbsTotal' as const, label: 'Carbs (g)', color: 'macro-carbs' },
    { key: 'fat' as const, label: 'Fat (g)', color: 'macro-fat' },
  ]
</script>
