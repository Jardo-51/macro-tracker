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

  const app = useAppStore()
  const dailyLog = useDailyLogStore()
  const confirmClear = ref(false)
  const fileInput = ref<HTMLInputElement>()

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
    a.download = `macro-tracker-export-${new Date().toISOString().slice(0, 10)}.json`
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
      const data = JSON.parse(text)
      if (data.foodItems) {
        await db.foodItems.clear()
        await db.foodItems.bulkAdd(data.foodItems)
      }
      if (data.mealTemplates) {
        await db.mealTemplates.clear()
        await db.mealTemplates.bulkAdd(data.mealTemplates)
      }
      if (data.dailyLogEntries) {
        await db.dailyLogEntries.clear()
        await db.dailyLogEntries.bulkAdd(data.dailyLogEntries)
      }
      if (data.dailyGoals) {
        await db.dailyGoals.clear()
        await db.dailyGoals.bulkAdd(data.dailyGoals)
      }
      await dailyLog.loadGoals()
      await dailyLog.loadDate()
      app.showSnackbar('Data imported successfully')
    } catch {
      app.showSnackbar('Failed to import data', 'error')
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
