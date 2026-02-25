<template>
  <v-card>
    <v-card-title>Daily History</v-card-title>
    <v-list v-if="store.rangeData.length > 0">
      <v-expansion-panels variant="accordion">
        <v-expansion-panel
          v-for="day in reversedDays"
          :key="day.date"
        >
          <v-expansion-panel-title>
            <div class="d-flex align-center w-100">
              <span class="font-weight-medium">{{ formatDate(day.date) }}</span>
              <v-spacer />
              <span class="text-body-2 text-medium-emphasis mr-2">
                {{ day.totals.calories }} kcal
              </span>
            </div>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <div v-if="day.entries.length > 0">
              <div class="text-body-2 mb-2">
                P {{ day.totals.protein }}g
                &middot; C {{ day.totals.carbsTotal }}g
                &middot; F {{ day.totals.fat }}g
              </div>
              <v-divider class="mb-2" />
              <div
                v-for="entry in day.entries"
                :key="entry.id"
                class="text-body-2 py-1"
              >
                <strong>{{ entry.name }}</strong>
                <span class="text-medium-emphasis">
                  — {{ entry.macros.calories }} kcal
                </span>
              </div>
            </div>
            <p v-else class="text-body-2 text-medium-emphasis">
              No entries logged.
            </p>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </v-list>
  </v-card>
</template>

<script lang="ts" setup>
  import { computed } from 'vue'
  import { useHistoryStore } from '@/stores/history'

  const store = useHistoryStore()

  const reversedDays = computed(() => [...store.rangeData].reverse())

  function formatDate(dateStr: string) {
    const date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
  }
</script>
