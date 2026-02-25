<template>
  <v-fab
    icon="mdi-plus"
    color="primary"
    location="bottom end"
    absolute
    app
    @click="dialog = true"
  />

  <v-dialog v-model="dialog" max-width="500" scrollable>
    <v-card>
      <v-card-title>Add Entry</v-card-title>
      <v-tabs v-model="tab" grow>
        <v-tab value="manual">Manual</v-tab>
        <v-tab value="foods">My Foods</v-tab>
        <v-tab value="meals">My Meals</v-tab>
      </v-tabs>
      <v-card-text>
        <v-tabs-window v-model="tab">
          <v-tabs-window-item value="manual">
            <v-text-field
              v-model="name"
              label="Food name"
              variant="outlined"
              density="compact"
              class="mb-2"
              hide-details
            />
            <MacroInputFields v-model="macros" />
            <v-checkbox
              v-model="saveAsFood"
              label="Save as custom food"
              density="compact"
              hide-details
              class="mt-2"
            />
            <v-row v-if="saveAsFood" dense class="mt-1">
              <v-col cols="6">
                <v-text-field
                  v-model.number="servingSize"
                  label="Serving size"
                  type="number"
                  min="1"
                  density="compact"
                  variant="outlined"
                  hide-details
                />
              </v-col>
              <v-col cols="6">
                <v-text-field
                  v-model="servingUnit"
                  label="Unit (g, oz, cup...)"
                  density="compact"
                  variant="outlined"
                  hide-details
                />
              </v-col>
            </v-row>
          </v-tabs-window-item>

          <v-tabs-window-item value="foods">
            <v-text-field
              v-model="foodSearch"
              label="Search foods..."
              variant="outlined"
              density="compact"
              prepend-inner-icon="mdi-magnify"
              hide-details
              class="mb-2"
            />
            <v-list density="compact" v-if="filteredFoods.length > 0">
              <v-list-item
                v-for="food in filteredFoods"
                :key="food.id"
                @click="selectFood(food)"
                :active="selectedFood?.id === food.id"
              >
                <v-list-item-title>{{ food.name }}</v-list-item-title>
                <v-list-item-subtitle>
                  {{ food.macros.calories }} kcal &middot; {{ food.servingSize }}{{ food.servingUnit }}
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>
            <p v-else class="text-body-2 text-medium-emphasis text-center pa-4">
              No saved foods yet.
            </p>
            <v-text-field
              v-if="selectedFood"
              v-model.number="foodServings"
              label="Servings"
              type="number"
              min="0.25"
              step="0.25"
              density="compact"
              variant="outlined"
              hide-details
              class="mt-2"
            />
          </v-tabs-window-item>

          <v-tabs-window-item value="meals">
            <v-text-field
              v-model="mealSearch"
              label="Search meals..."
              variant="outlined"
              density="compact"
              prepend-inner-icon="mdi-magnify"
              hide-details
              class="mb-2"
            />
            <v-list density="compact" v-if="filteredMeals.length > 0">
              <v-list-item
                v-for="meal in filteredMeals"
                :key="meal.id"
                @click="selectMeal(meal)"
                :active="selectedMeal?.id === meal.id"
              >
                <v-list-item-title>{{ meal.name }}</v-list-item-title>
                <v-list-item-subtitle>
                  {{ meal.macros.calories }} kcal
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>
            <p v-else class="text-body-2 text-medium-emphasis text-center pa-4">
              No saved meals yet.
            </p>
          </v-tabs-window-item>
        </v-tabs-window>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="close">Cancel</v-btn>
        <v-btn color="primary" variant="flat" :disabled="!canSave" @click="save">
          Add
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
  import { ref, computed, watch } from 'vue'
  import MacroInputFields from './MacroInputFields.vue'
  import { useDailyLogStore } from '@/stores/dailyLog'
  import { useFoodsStore } from '@/stores/foods'
  import { emptyMacros } from '@/types'
  import type { FoodItem, MealTemplate } from '@/types'

  const dailyLog = useDailyLogStore()
  const foodsStore = useFoodsStore()

  const dialog = ref(false)
  const tab = ref('manual')
  const name = ref('')
  const macros = ref(emptyMacros())
  const saveAsFood = ref(false)
  const servingSize = ref(100)
  const servingUnit = ref('g')

  // Foods tab
  const foodSearch = ref('')
  const selectedFood = ref<FoodItem | null>(null)
  const foodServings = ref(1)

  // Meals tab
  const mealSearch = ref('')
  const selectedMeal = ref<MealTemplate | null>(null)

  const filteredFoods = computed(() => {
    const q = foodSearch.value.toLowerCase()
    if (!q) return foodsStore.foodItems
    return foodsStore.foodItems.filter(f => f.name.toLowerCase().includes(q))
  })

  const filteredMeals = computed(() => {
    const q = mealSearch.value.toLowerCase()
    if (!q) return foodsStore.mealTemplates
    return foodsStore.mealTemplates.filter(m => m.name.toLowerCase().includes(q))
  })

  const canSave = computed(() => {
    if (tab.value === 'manual') return name.value.trim() && macros.value.calories > 0
    if (tab.value === 'foods') return selectedFood.value && foodServings.value > 0
    if (tab.value === 'meals') return selectedMeal.value
    return false
  })

  watch(dialog, (open) => {
    if (open) {
      foodsStore.loadAll()
    }
  })

  function selectFood(food: FoodItem) {
    selectedFood.value = food
    foodServings.value = 1
  }

  function selectMeal(meal: MealTemplate) {
    selectedMeal.value = meal
  }

  function multiplyMacros(m: typeof macros.value, factor: number) {
    return {
      calories: Math.round(m.calories * factor),
      protein: Math.round(m.protein * factor),
      carbsTotal: Math.round(m.carbsTotal * factor),
      carbsFiber: Math.round(m.carbsFiber * factor),
      carbsSugar: Math.round(m.carbsSugar * factor),
      fat: Math.round(m.fat * factor),
    }
  }

  async function save() {
    if (tab.value === 'manual') {
      await dailyLog.addEntry({
        date: dailyLog.currentDate,
        name: name.value.trim(),
        servings: 1,
        macros: { ...macros.value },
        sourceType: 'manual',
      })
      if (saveAsFood.value) {
        await foodsStore.addFoodItem({
          name: name.value.trim(),
          servingSize: servingSize.value,
          servingUnit: servingUnit.value,
          macros: { ...macros.value },
        })
      }
    } else if (tab.value === 'foods' && selectedFood.value) {
      const food = selectedFood.value
      await dailyLog.addEntry({
        date: dailyLog.currentDate,
        name: food.name,
        servings: foodServings.value,
        macros: multiplyMacros(food.macros, foodServings.value),
        sourceType: 'food',
        sourceId: food.id,
      })
    } else if (tab.value === 'meals' && selectedMeal.value) {
      const meal = selectedMeal.value
      await dailyLog.addEntry({
        date: dailyLog.currentDate,
        name: meal.name,
        servings: 1,
        macros: { ...meal.macros },
        sourceType: 'meal',
        sourceId: meal.id,
      })
    }
    close()
  }

  function close() {
    dialog.value = false
    name.value = ''
    macros.value = emptyMacros()
    saveAsFood.value = false
    servingSize.value = 100
    servingUnit.value = 'g'
    tab.value = 'manual'
    selectedFood.value = null
    selectedMeal.value = null
    foodSearch.value = ''
    mealSearch.value = ''
    foodServings.value = 1
  }
</script>
