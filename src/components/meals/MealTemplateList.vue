<template>
  <v-text-field
    v-model="store.searchQuery"
    label="Search meals..."
    variant="outlined"
    density="compact"
    prepend-inner-icon="mdi-magnify"
    hide-details
    clearable
    class="mb-3"
  />

  <v-list v-if="store.filteredMealTemplates.length > 0">
    <v-list-item
      v-for="meal in store.filteredMealTemplates"
      :key="meal.id"
    >
      <v-list-item-title>{{ meal.name }}</v-list-item-title>
      <v-list-item-subtitle>
        {{ meal.macros.calories }} kcal
        &middot; P {{ meal.macros.protein }}g
        &middot; C {{ meal.macros.carbsTotal }}g
        &middot; F {{ meal.macros.fat }}g
      </v-list-item-subtitle>
      <template #append>
        <v-btn icon="mdi-pencil-outline" variant="text" size="small" @click="emit('edit', meal)" />
        <v-btn icon="mdi-delete-outline" variant="text" size="small" @click="deleteMeal(meal.id)" />
      </template>
    </v-list-item>
  </v-list>
  <p v-else class="text-body-2 text-medium-emphasis text-center pa-4">
    No saved meals yet.
  </p>
</template>

<script lang="ts" setup>
  import { useFoodsStore } from '@/stores/foods'
  import type { MealTemplate } from '@/types'

  const store = useFoodsStore()
  const emit = defineEmits<{ edit: [item: MealTemplate] }>()

  async function deleteMeal(id: string) {
    await store.deleteMealTemplate(id)
  }
</script>
