<template>
  <v-container>
    <h1 class="text-h5 mb-4">My Foods & Meals</h1>

    <v-tabs v-model="tab" grow class="mb-4">
      <v-tab value="foods">Foods</v-tab>
      <v-tab value="meals">Meals</v-tab>
    </v-tabs>

    <v-tabs-window v-model="tab">
      <v-tabs-window-item value="foods">
        <FoodItemList @edit="editFood" />
        <v-btn
          color="primary"
          prepend-icon="mdi-plus"
          block
          class="mt-3"
          @click="foodDialogOpen = true; editingFood = null"
        >
          Add Food
        </v-btn>
      </v-tabs-window-item>

      <v-tabs-window-item value="meals">
        <MealTemplateList @edit="editMeal" />
        <v-btn
          color="primary"
          prepend-icon="mdi-plus"
          block
          class="mt-3"
          @click="mealDialogOpen = true; editingMeal = null"
        >
          Add Meal
        </v-btn>
      </v-tabs-window-item>
    </v-tabs-window>

    <FoodItemDialog v-model="foodDialogOpen" :edit-item="editingFood" />
    <MealTemplateDialog v-model="mealDialogOpen" :edit-item="editingMeal" />
  </v-container>
</template>

<script lang="ts" setup>
  import { ref, onMounted } from 'vue'
  import FoodItemList from '@/components/meals/FoodItemList.vue'
  import MealTemplateList from '@/components/meals/MealTemplateList.vue'
  import FoodItemDialog from '@/components/meals/FoodItemDialog.vue'
  import MealTemplateDialog from '@/components/meals/MealTemplateDialog.vue'
  import { useFoodsStore } from '@/stores/foods'
  import type { FoodItem, MealTemplate } from '@/types'

  const store = useFoodsStore()

  const tab = ref('foods')
  const foodDialogOpen = ref(false)
  const mealDialogOpen = ref(false)
  const editingFood = ref<FoodItem | null>(null)
  const editingMeal = ref<MealTemplate | null>(null)

  function editFood(food: FoodItem) {
    editingFood.value = food
    foodDialogOpen.value = true
  }

  function editMeal(meal: MealTemplate) {
    editingMeal.value = meal
    mealDialogOpen.value = true
  }

  onMounted(() => {
    store.loadAll()
  })
</script>
