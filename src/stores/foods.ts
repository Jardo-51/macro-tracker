import { defineStore } from 'pinia'
import { ref, computed, toRaw } from 'vue'
import { db } from '@/db'
import type { FoodItem, MealTemplate } from '@/types'
import { uuidv7 } from 'uuidv7'

// Used items rank by lastUsedAt (most recent first); never-used items fall
// below, keeping the default newest-created-first order. ISO-8601 timestamps
// sort correctly lexicographically.
function compareByRecency(
  a: FoodItem | MealTemplate,
  b: FoodItem | MealTemplate,
) {
  const la = a.lastUsedAt ?? null
  const lb = b.lastUsedAt ?? null
  if (la && lb) return lb.localeCompare(la)
  if (la) return -1
  if (lb) return 1
  return b.createdAt.localeCompare(a.createdAt)
}

export function filterByName<T extends FoodItem | MealTemplate>(
  items: T[],
  query: string,
): T[] {
  if (!query) return items
  const q = query.toLowerCase()
  return items.filter(item => item.name.toLowerCase().includes(q))
}

export const useFoodsStore = defineStore('foods', () => {
  const foodItems = ref<FoodItem[]>([])
  const mealTemplates = ref<MealTemplate[]>([])
  const searchQuery = ref('')

  const filteredFoodItems = computed(() => filterByName(foodItems.value, searchQuery.value))

  const filteredMealTemplates = computed(() => filterByName(mealTemplates.value, searchQuery.value))

  // Recency-sorted lists for the Add Entry dialog. MealsPage keeps using the
  // created-order lists above.
  const recentFoodItems = computed(() => [...foodItems.value].sort(compareByRecency))
  const recentMealTemplates = computed(() => [...mealTemplates.value].sort(compareByRecency))

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

  // Re-inserts a previously deleted item as-is (id and createdAt preserved),
  // used by the delete-undo snackbar. Callers pass the item straight from a
  // v-for, i.e. a reactive proxy — unwrap it, since IndexedDB's structured
  // clone rejects proxies with DataCloneError.
  async function restoreFoodItem(item: FoodItem) {
    await db.foodItems.add(toRaw(item))
    await loadFoodItems()
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

  async function restoreMealTemplate(template: MealTemplate) {
    await db.mealTemplates.add(toRaw(template))
    await loadMealTemplates()
  }

  return {
    foodItems,
    mealTemplates,
    searchQuery,
    filteredFoodItems,
    filteredMealTemplates,
    recentFoodItems,
    recentMealTemplates,
    loadFoodItems,
    loadMealTemplates,
    loadAll,
    addFoodItem,
    updateFoodItem,
    deleteFoodItem,
    restoreFoodItem,
    addMealTemplate,
    updateMealTemplate,
    deleteMealTemplate,
    restoreMealTemplate,
  }
})
