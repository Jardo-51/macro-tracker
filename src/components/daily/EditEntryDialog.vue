<template>
  <v-dialog v-model="dialog" max-width="500" scrollable>
    <v-card>
      <v-card-title>Edit Entry</v-card-title>
      <v-card-text>
        <v-text-field
          v-model="name"
          label="Food name"
          variant="outlined"
          density="compact"
          hide-details
          class="mb-4"
        />
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
  import { emptyMacros } from '@/types'
  import type { DailyLogEntry } from '@/types'

  const dailyLog = useDailyLogStore()

  const dialog = ref(false)
  const editingId = ref('')
  const name = ref('')
  const macros = ref(emptyMacros())
  const multiplier = ref(1)

  const canSave = computed(() => name.value.trim() && macros.value.calories > 0)

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
