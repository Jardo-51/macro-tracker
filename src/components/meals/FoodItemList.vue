<template>
  <v-text-field
    v-model="store.searchQuery"
    label="Search foods..."
    variant="outlined"
    density="compact"
    prepend-inner-icon="mdi-magnify"
    hide-details
    clearable
    class="mb-3"
  />

  <v-list v-if="store.filteredFoodItems.length > 0">
    <v-list-item
      v-for="food in store.filteredFoodItems"
      :key="food.id"
    >
      <v-list-item-title>{{ food.name }}</v-list-item-title>
      <v-list-item-subtitle>
        {{ food.servingSize }}{{ food.servingUnit }}
        &middot; {{ food.macros.calories }} kcal
        &middot; P {{ food.macros.protein }}g
        &middot; C {{ food.macros.carbsTotal }}g
        &middot; F {{ food.macros.fat }}g
      </v-list-item-subtitle>
      <template #append>
        <v-btn icon="mdi-pencil-outline" variant="text" size="small" @click="emit('edit', food)" />
        <v-btn icon="mdi-delete-outline" variant="text" size="small" @click="deleteFood(food)" />
      </template>
    </v-list-item>
  </v-list>
  <p v-else class="text-body-2 text-medium-emphasis text-center pa-4">
    No saved foods yet.
  </p>
</template>

<script lang="ts" setup>
  import { useFoodsStore } from '@/stores/foods'
  import { useAppStore } from '@/stores/app'
  import type { FoodItem } from '@/types'

  const store = useFoodsStore()
  const app = useAppStore()
  const emit = defineEmits<{ edit: [item: FoodItem] }>()

  async function deleteFood(food: FoodItem) {
    await store.deleteFoodItem(food.id)
    app.showSnackbar(`Deleted "${food.name}"`, 'success', {
      label: 'Undo',
      handler: () => store.restoreFoodItem(food),
    })
  }
</script>
