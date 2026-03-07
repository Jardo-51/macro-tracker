<template>
  <v-card>
    <v-card-title>Today's Entries</v-card-title>
    <v-list v-if="store.entries.length > 0">
      <v-list-item
        v-for="entry in store.entries"
        :key="entry.id"
      >
        <template #prepend>
          <v-icon :color="sourceColor(entry.sourceType)">
            {{ sourceIcon(entry.sourceType) }}
          </v-icon>
        </template>
        <v-list-item-title>{{ entry.name }}</v-list-item-title>
        <v-list-item-subtitle>
          {{ entry.macros.calories }} kcal
          &middot; P {{ entry.macros.protein }}g
          &middot; C {{ entry.macros.carbsTotal }}g
          &middot; F {{ entry.macros.fat }}g
          <span v-if="entry.servings !== 1"> &middot; {{ entry.servings }}x</span>
        </v-list-item-subtitle>
        <template #append>
          <v-btn
            icon="mdi-delete-outline"
            variant="text"
            size="small"
            @click="removeEntry(entry.id)"
          />
        </template>
      </v-list-item>
    </v-list>
    <v-card-text v-else class="text-center text-medium-emphasis">
      No entries yet. Tap + to add food.
    </v-card-text>
  </v-card>
</template>

<script lang="ts" setup>
  import { useDailyLogStore } from '@/stores/dailyLog'

  const store = useDailyLogStore()

  function sourceIcon(type: string) {
    switch (type) {
      case 'food': return 'mdi-food-apple'
      case 'meal': return 'mdi-silverware-variant'
      default: return 'mdi-pencil'
    }
  }

  function sourceColor(type: string) {
    switch (type) {
      case 'food': return 'macro-carbs'
      case 'meal': return 'macro-protein'
      default: return 'macro-calories'
    }
  }

  async function removeEntry(id: string) {
    await store.removeEntry(id)
  }
</script>
