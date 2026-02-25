import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { db } from '@/db'
import { seedDefaults } from '@/db/seed'
import { emptyMacros } from '@/types'
import type { DailyGoals, DailyLogEntry, Macros } from '@/types'
import { uuidv7 } from 'uuidv7'

function todayDate(): string {
  return new Date().toISOString().slice(0, 10)
}

export const useDailyLogStore = defineStore('dailyLog', () => {
  const currentDate = ref(todayDate())
  const entries = ref<DailyLogEntry[]>([])
  const goals = ref<DailyGoals>({
    id: 'default',
    calories: 2000,
    protein: 150,
    carbsTotal: 250,
    fat: 65,
  })
  const isLoading = ref(false)

  const dailyTotals = computed<Macros>(() => {
    const totals = emptyMacros()
    for (const entry of entries.value) {
      totals.calories += entry.macros.calories
      totals.protein += entry.macros.protein
      totals.carbsTotal += entry.macros.carbsTotal
      totals.carbsFiber += entry.macros.carbsFiber
      totals.carbsSugar += entry.macros.carbsSugar
      totals.fat += entry.macros.fat
    }
    return totals
  })

  const remainingMacros = computed(() => ({
    calories: goals.value.calories - dailyTotals.value.calories,
    protein: goals.value.protein - dailyTotals.value.protein,
    carbsTotal: goals.value.carbsTotal - dailyTotals.value.carbsTotal,
    fat: goals.value.fat - dailyTotals.value.fat,
  }))

  const progressPercentages = computed(() => ({
    calories: Math.min(100, Math.round((dailyTotals.value.calories / goals.value.calories) * 100)),
    protein: Math.min(100, Math.round((dailyTotals.value.protein / goals.value.protein) * 100)),
    carbsTotal: Math.min(100, Math.round((dailyTotals.value.carbsTotal / goals.value.carbsTotal) * 100)),
    fat: Math.min(100, Math.round((dailyTotals.value.fat / goals.value.fat) * 100)),
  }))

  async function loadGoals() {
    await seedDefaults()
    const g = await db.dailyGoals.get('default')
    if (g) goals.value = g
  }

  async function updateGoals(newGoals: Omit<DailyGoals, 'id'>) {
    const updated = { ...newGoals, id: 'default' }
    await db.dailyGoals.put(updated)
    goals.value = updated
  }

  async function loadDate(date?: string) {
    isLoading.value = true
    if (date) currentDate.value = date
    try {
      entries.value = await db.dailyLogEntries
        .where('date')
        .equals(currentDate.value)
        .toArray()
      entries.value.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    } finally {
      isLoading.value = false
    }
  }

  async function addEntry(entry: Omit<DailyLogEntry, 'id' | 'createdAt'>) {
    const newEntry: DailyLogEntry = {
      ...entry,
      id: uuidv7(),
      createdAt: new Date().toISOString(),
    }
    await db.dailyLogEntries.add(newEntry)
    if (entry.date === currentDate.value) {
      entries.value.push(newEntry)
    }
  }

  async function removeEntry(id: string) {
    await db.dailyLogEntries.delete(id)
    entries.value = entries.value.filter(e => e.id !== id)
  }

  return {
    currentDate,
    entries,
    goals,
    isLoading,
    dailyTotals,
    remainingMacros,
    progressPercentages,
    loadGoals,
    updateGoals,
    loadDate,
    addEntry,
    removeEntry,
  }
})
