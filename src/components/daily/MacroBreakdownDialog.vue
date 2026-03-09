<template>
  <v-dialog
    :model-value="modelValue"
    max-width="500"
    scrollable
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <v-card>
      <v-card-title>{{ macroLabel }} Breakdown</v-card-title>
      <v-card-text>
        <div v-if="breakdown.length > 0">
          <div
            v-for="item in breakdown"
            :key="item.name"
            class="mb-3"
          >
            <div class="d-flex justify-space-between text-body-2 mb-1">
              <span>{{ item.name }}</span>
              <span>{{ item.value }}{{ macroUnit }} ({{ Math.round(item.percentage) }}%)</span>
            </div>
            <v-progress-linear
              :model-value="item.percentage"
              :color="macroColor"
              height="8"
              rounded
            />
          </div>
        </div>
        <div v-else class="text-center text-medium-emphasis">
          No entries logged yet.
        </div>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn @click="$emit('update:modelValue', false)">Close</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
  import { computed } from 'vue'
  import { useDailyLogStore } from '@/stores/dailyLog'
  import type { Macros } from '@/types'

  const props = defineProps<{
    modelValue: boolean
    macroKey: keyof Macros
    macroLabel: string
    macroColor: string
    macroUnit: string
  }>()

  defineEmits<{
    'update:modelValue': [value: boolean]
  }>()

  const store = useDailyLogStore()

  const breakdown = computed(() => {
    const total = store.dailyTotals[props.macroKey]
    if (total === 0) return []
    return store.entries
      .map(entry => ({
        name: entry.name,
        value: entry.macros[props.macroKey],
        percentage: (entry.macros[props.macroKey] / total) * 100,
      }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.percentage - a.percentage)
  })
</script>
