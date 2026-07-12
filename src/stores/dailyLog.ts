import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { db } from '@/db'
import { seedDefaults } from '@/db/seed'
import type { DailyGoals, DailyLogEntry, Macros } from '@/types'
import { uuidv7 } from 'uuidv7'
import { today } from '@/utils/date'
import { percentOfGoal, sumMacros } from '@/utils/macros'

export const useDailyLogStore = defineStore('dailyLog', () => {
  const currentDate = ref(today())
  const entries = ref<DailyLogEntry[]>([])
  const goals = ref<DailyGoals>({
    id: 'default',
    calories: 2000,
    protein: 150,
    carbsTotal: 250,
    fat: 65,
  })
  const isLoading = ref(false)

  const dailyTotals = computed<Macros>(() => sumMacros(entries.value.map(e => e.macros)))

  const remainingMacros = computed(() => ({
    calories: goals.value.calories - dailyTotals.value.calories,
    protein: goals.value.protein - dailyTotals.value.protein,
    carbsTotal: goals.value.carbsTotal - dailyTotals.value.carbsTotal,
    fat: goals.value.fat - dailyTotals.value.fat,
  }))

  const progressPercentages = computed(() => ({
    calories: percentOfGoal(dailyTotals.value.calories, goals.value.calories),
    protein: percentOfGoal(dailyTotals.value.protein, goals.value.protein),
    carbsTotal: percentOfGoal(dailyTotals.value.carbsTotal, goals.value.carbsTotal),
    fat: percentOfGoal(dailyTotals.value.fat, goals.value.fat),
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

  // Page bootstrap: load goals and the current day's entries, snapping back
  // to today if the store still points at a stale (past) date from an
  // earlier session.
  async function ensureFreshToday() {
    await loadGoals()
    await loadDate(currentDate.value < today() ? today() : undefined)
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
    if (entry.sourceId && (entry.sourceType === 'food' || entry.sourceType === 'meal')) {
      const table = entry.sourceType === 'food' ? db.foodItems : db.mealTemplates
      await table.update(entry.sourceId, { lastUsedAt: newEntry.createdAt })
    }
    if (entry.date === currentDate.value) {
      entries.value.push(newEntry)
    }
  }

  async function removeEntry(id: string) {
    await db.dailyLogEntries.delete(id)
    entries.value = entries.value.filter(e => e.id !== id)
  }

  // Re-inserts a previously deleted entry as-is (id and createdAt preserved),
  // used by the delete-undo snackbar.
  async function restoreEntry(entry: DailyLogEntry) {
    await db.dailyLogEntries.add(entry)
    if (entry.date === currentDate.value) await loadDate()
  }

  async function updateEntry(id: string, changes: Pick<DailyLogEntry, 'name' | 'macros' | 'servings'>) {
    const existing = entries.value.find(e => e.id === id)
    if (!existing) return
    const updated: DailyLogEntry = { ...existing, ...changes }
    await db.dailyLogEntries.put(updated)
    const idx = entries.value.findIndex(e => e.id === id)
    if (idx !== -1) entries.value[idx] = updated
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
    ensureFreshToday,
    loadDate,
    addEntry,
    removeEntry,
    restoreEntry,
    updateEntry,
  }
})
