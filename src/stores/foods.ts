import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { db } from '@/db'
import type { FoodItem, MealTemplate } from '@/types'
import { uuidv7 } from 'uuidv7'

export const useFoodsStore = defineStore('foods', () => {
  const foodItems = ref<FoodItem[]>([])
  const mealTemplates = ref<MealTemplate[]>([])
  const searchQuery = ref('')

  const filteredFoodItems = computed(() => {
    if (!searchQuery.value) return foodItems.value
    const q = searchQuery.value.toLowerCase()
    return foodItems.value.filter(f => f.name.toLowerCase().includes(q))
  })

  const filteredMealTemplates = computed(() => {
    if (!searchQuery.value) return mealTemplates.value
    const q = searchQuery.value.toLowerCase()
    return mealTemplates.value.filter(m => m.name.toLowerCase().includes(q))
  })

  async function loadFoodItems() {
    foodItems.value = await db.foodItems.orderBy('createdAt').reverse().toArray()
  }

  async function loadMealTemplates() {
    mealTemplates.value = await db.mealTemplates.orderBy('createdAt').reverse().toArray()
  }

  async function loadAll() {
    await Promise.all([loadFoodItems(), loadMealTemplates()])
  }

  async function addFoodItem(item: Omit<FoodItem, 'id' | 'createdAt'>) {
    const newItem: FoodItem = {
      ...item,
      id: uuidv7(),
      createdAt: new Date().toISOString(),
    }
    await db.foodItems.add(newItem)
    foodItems.value.unshift(newItem)
  }

  async function updateFoodItem(item: FoodItem) {
    await db.foodItems.put(item)
    const idx = foodItems.value.findIndex(f => f.id === item.id)
    if (idx !== -1) foodItems.value[idx] = item
  }

  async function deleteFoodItem(id: string) {
    await db.foodItems.delete(id)
    foodItems.value = foodItems.value.filter(f => f.id !== id)
  }

  async function addMealTemplate(template: Omit<MealTemplate, 'id' | 'createdAt'>) {
    const newTemplate: MealTemplate = {
      ...template,
      id: uuidv7(),
      createdAt: new Date().toISOString(),
    }
    await db.mealTemplates.add(newTemplate)
    mealTemplates.value.unshift(newTemplate)
  }

  async function updateMealTemplate(template: MealTemplate) {
    await db.mealTemplates.put(template)
    const idx = mealTemplates.value.findIndex(m => m.id === template.id)
    if (idx !== -1) mealTemplates.value[idx] = template
  }

  async function deleteMealTemplate(id: string) {
    await db.mealTemplates.delete(id)
    mealTemplates.value = mealTemplates.value.filter(m => m.id !== id)
  }

  return {
    foodItems,
    mealTemplates,
    searchQuery,
    filteredFoodItems,
    filteredMealTemplates,
    loadFoodItems,
    loadMealTemplates,
    loadAll,
    addFoodItem,
    updateFoodItem,
    deleteFoodItem,
    addMealTemplate,
    updateMealTemplate,
    deleteMealTemplate,
  }
})
