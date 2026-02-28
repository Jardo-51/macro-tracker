<template>
  <v-card class="mb-4">
    <v-card-title>Data Management</v-card-title>
    <v-card-text>
      <v-btn
        prepend-icon="mdi-download"
        variant="outlined"
        block
        class="mb-2"
        @click="exportData"
      >
        Export Data (JSON)
      </v-btn>

      <v-btn
        prepend-icon="mdi-upload"
        variant="outlined"
        block
        class="mb-2"
        @click="triggerImport"
      >
        Import Data (JSON)
      </v-btn>
      <input
        ref="fileInput"
        type="file"
        accept=".json"
        style="display: none"
        @change="importData"
      >

      <v-btn
        prepend-icon="mdi-delete-alert"
        variant="outlined"
        color="error"
        block
        @click="confirmClear = true"
      >
        Clear All Data
      </v-btn>
    </v-card-text>
  </v-card>

  <v-dialog v-model="confirmClear" max-width="400">
    <v-card>
      <v-card-title>Clear All Data?</v-card-title>
      <v-card-text>
        This will permanently delete all your foods, meals, log entries, and goals. This cannot be undone.
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="confirmClear = false">Cancel</v-btn>
        <v-btn color="error" variant="flat" @click="clearAll">Delete Everything</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
  import { ref } from 'vue'
  import { db } from '@/db'
  import { seedDefaults } from '@/db/seed'
  import { useAppStore } from '@/stores/app'
  import { useDailyLogStore } from '@/stores/dailyLog'
  import type { DailyGoals, DailyLogEntry, FoodItem, MealTemplate } from '@/types'
  import { toLocalDateStr } from '@/utils/date'

  const app = useAppStore()
  const dailyLog = useDailyLogStore()
  const confirmClear = ref(false)
  const fileInput = ref<HTMLInputElement>()

  function isString(v: unknown): v is string {
    return typeof v === 'string'
  }

  function isFiniteNum(v: unknown): v is number {
    return typeof v === 'number' && isFinite(v)
  }

  function isValidMacros(m: unknown): boolean {
    if (!m || typeof m !== 'object') return false
    const o = m as Record<string, unknown>
    return (
      isFiniteNum(o.calories) &&
      isFiniteNum(o.protein) &&
      isFiniteNum(o.carbsTotal) &&
      isFiniteNum(o.carbsFiber) &&
      isFiniteNum(o.carbsSugar) &&
      isFiniteNum(o.fat)
    )
  }

  function isValidFoodItem(v: unknown): v is FoodItem {
    if (!v || typeof v !== 'object') return false
    const o = v as Record<string, unknown>
    return (
      isString(o.id) && o.id.length > 0 &&
      isString(o.name) && o.name.length > 0 &&
      isFiniteNum(o.servingSize) &&
      isString(o.servingUnit) &&
      isValidMacros(o.macros) &&
      isString(o.createdAt)
    )
  }

  function isValidMealTemplate(v: unknown): v is MealTemplate {
    if (!v || typeof v !== 'object') return false
    const o = v as Record<string, unknown>
    return (
      isString(o.id) && o.id.length > 0 &&
      isString(o.name) && o.name.length > 0 &&
      isValidMacros(o.macros) &&
      isString(o.createdAt)
    )
  }

  function isValidDailyLogEntry(v: unknown): v is DailyLogEntry {
    if (!v || typeof v !== 'object') return false
    const o = v as Record<string, unknown>
    return (
      isString(o.id) && o.id.length > 0 &&
      isString(o.date) && /^\d{4}-\d{2}-\d{2}$/.test(o.date) &&
      isString(o.name) && o.name.length > 0 &&
      isFiniteNum(o.servings) &&
      isValidMacros(o.macros) &&
      (o.sourceType === 'manual' || o.sourceType === 'food' || o.sourceType === 'meal') &&
      (o.sourceId === undefined || isString(o.sourceId)) &&
      isString(o.createdAt)
    )
  }

  function isValidDailyGoals(v: unknown): v is DailyGoals {
    if (!v || typeof v !== 'object') return false
    const o = v as Record<string, unknown>
    return (
      isString(o.id) && o.id.length > 0 &&
      isFiniteNum(o.calories) &&
      isFiniteNum(o.protein) &&
      isFiniteNum(o.carbsTotal) &&
      isFiniteNum(o.fat)
    )
  }

  function validateImport(data: unknown): {
    foodItems?: FoodItem[]
    mealTemplates?: MealTemplate[]
    dailyLogEntries?: DailyLogEntry[]
    dailyGoals?: DailyGoals[]
  } {
    if (!data || typeof data !== 'object') throw new Error('Invalid file format')
    const d = data as Record<string, unknown>

    if (d.foodItems !== undefined) {
      if (!Array.isArray(d.foodItems)) throw new Error('foodItems must be an array')
      const invalid = d.foodItems.findIndex((v) => !isValidFoodItem(v))
      if (invalid !== -1) throw new Error(`Invalid food item at index ${invalid}`)
    }
    if (d.mealTemplates !== undefined) {
      if (!Array.isArray(d.mealTemplates)) throw new Error('mealTemplates must be an array')
      const invalid = d.mealTemplates.findIndex((v) => !isValidMealTemplate(v))
      if (invalid !== -1) throw new Error(`Invalid meal template at index ${invalid}`)
    }
    if (d.dailyLogEntries !== undefined) {
      if (!Array.isArray(d.dailyLogEntries)) throw new Error('dailyLogEntries must be an array')
      const invalid = d.dailyLogEntries.findIndex((v) => !isValidDailyLogEntry(v))
      if (invalid !== -1) throw new Error(`Invalid log entry at index ${invalid}`)
    }
    if (d.dailyGoals !== undefined) {
      if (!Array.isArray(d.dailyGoals)) throw new Error('dailyGoals must be an array')
      const invalid = d.dailyGoals.findIndex((v) => !isValidDailyGoals(v))
      if (invalid !== -1) throw new Error(`Invalid daily goal at index ${invalid}`)
    }

    return {
      foodItems: d.foodItems as FoodItem[] | undefined,
      mealTemplates: d.mealTemplates as MealTemplate[] | undefined,
      dailyLogEntries: d.dailyLogEntries as DailyLogEntry[] | undefined,
      dailyGoals: d.dailyGoals as DailyGoals[] | undefined,
    }
  }

  async function exportData() {
    const data = {
      foodItems: await db.foodItems.toArray(),
      mealTemplates: await db.mealTemplates.toArray(),
      dailyLogEntries: await db.dailyLogEntries.toArray(),
      dailyGoals: await db.dailyGoals.toArray(),
      exportedAt: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const now = new Date()
    const timestamp = `${toLocalDateStr(now)}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}`
    a.download = `macro-tracker-export-${timestamp}.json`
    a.click()
    URL.revokeObjectURL(url)
    app.showSnackbar('Data exported')
  }

  function triggerImport() {
    fileInput.value?.click()
  }

  async function importData(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const validated = validateImport(JSON.parse(text))
      if (validated.foodItems) {
        await db.foodItems.clear()
        await db.foodItems.bulkAdd(validated.foodItems)
      }
      if (validated.mealTemplates) {
        await db.mealTemplates.clear()
        await db.mealTemplates.bulkAdd(validated.mealTemplates)
      }
      if (validated.dailyLogEntries) {
        await db.dailyLogEntries.clear()
        await db.dailyLogEntries.bulkAdd(validated.dailyLogEntries)
      }
      if (validated.dailyGoals) {
        await db.dailyGoals.clear()
        await db.dailyGoals.bulkAdd(validated.dailyGoals)
      }
      await dailyLog.loadGoals()
      await dailyLog.loadDate()
      app.showSnackbar('Data imported successfully')
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error'
      app.showSnackbar(`Import failed: ${msg}`, 'error')
    }
    if (fileInput.value) fileInput.value.value = ''
  }

  async function clearAll() {
    await db.foodItems.clear()
    await db.mealTemplates.clear()
    await db.dailyLogEntries.clear()
    await db.dailyGoals.clear()
    await seedDefaults()
    await dailyLog.loadGoals()
    await dailyLog.loadDate()
    confirmClear.value = false
    app.showSnackbar('All data cleared')
  }
</script>
