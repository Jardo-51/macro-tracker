<template>
  <v-dialog v-model="dialog" max-width="500" scrollable>
    <v-card>
      <v-card-title>Edit Entry</v-card-title>
      <v-card-text>
        <div class="d-flex align-center mb-4" style="gap: 8px">
          <v-text-field
            v-model="name"
            label="Food name"
            variant="outlined"
            density="compact"
            hide-details
          />
          <v-btn
            v-if="appStore.openaiApiKey"
            icon
            size="small"
            variant="tonal"
            color="primary"
            :disabled="!name.trim()"
            :loading="estimating"
            @click="estimate"
          >
            <v-icon>mdi-auto-fix</v-icon>
            <v-tooltip activator="parent" location="top">Estimate macros with AI</v-tooltip>
          </v-btn>
        </div>
        <MacroInputFields v-model="macros" />
        <div class="d-flex align-center mt-3 mb-1" style="gap: 8px">
          <v-text-field
            v-model.number="multiplier"
            label="Multiplier"
            type="number"
            density="compact"
            variant="outlined"
            hide-details
            style="max-width: 140px"
          />
          <v-btn
            variant="tonal"
            size="small"
            :disabled="multiplier === 1"
            @click="applyMultiplier"
          >
            Apply
          </v-btn>
        </div>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="close">Cancel</v-btn>
        <v-btn color="primary" variant="flat" :disabled="!canSave" @click="save">Save</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
  import { ref, computed } from 'vue'
  import MacroInputFields from './MacroInputFields.vue'
  import { useDailyLogStore } from '@/stores/dailyLog'
  import { useAppStore } from '@/stores/app'
  import { estimateMacros } from '@/services/openai'
  import { emptyMacros } from '@/types'
  import type { DailyLogEntry } from '@/types'

  const dailyLog = useDailyLogStore()
  const appStore = useAppStore()

  const dialog = ref(false)
  const editingId = ref('')
  const name = ref('')
  const macros = ref(emptyMacros())
  const multiplier = ref(1)

  const canSave = computed(() => !!name.value.trim())

  const estimating = ref(false)

  async function estimate() {
    estimating.value = true
    try {
      macros.value = await estimateMacros(name.value.trim(), appStore.openaiApiKey)
    } catch (e: any) {
      appStore.showSnackbar(e.message || 'Estimation failed', 'error')
    } finally {
      estimating.value = false
    }
  }

  function open(entry: DailyLogEntry) {
    editingId.value = entry.id
    name.value = entry.name
    macros.value = { ...entry.macros }
    multiplier.value = 1
    dialog.value = true
  }

  function applyMultiplier() {
    const f = multiplier.value
    macros.value = {
      calories: macros.value.calories * f,
      protein: macros.value.protein * f,
      carbsTotal: macros.value.carbsTotal * f,
      carbsFiber: macros.value.carbsFiber * f,
      carbsSugar: macros.value.carbsSugar * f,
      fat: macros.value.fat * f,
    }
    multiplier.value = 1
  }

  async function save() {
    await dailyLog.updateEntry(editingId.value, {
      name: name.value.trim(),
      macros: { ...macros.value },
      servings: 1,
    })
    close()
  }

  function close() {
    dialog.value = false
    editingId.value = ''
    name.value = ''
    macros.value = emptyMacros()
    multiplier.value = 1
  }

  defineExpose({ open })
</script>
