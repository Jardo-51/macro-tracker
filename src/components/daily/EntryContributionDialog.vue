<template>
  <v-dialog v-model="dialog" max-width="500" scrollable>
    <v-card>
      <v-card-title style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap">
        {{ entryName }}
      </v-card-title>
      <v-card-subtitle>Contribution to daily goals</v-card-subtitle>
      <v-card-text>
        <div
          v-for="macro in macros"
          :key="macro.key"
          class="mb-3"
        >
          <div class="d-flex justify-space-between text-body-2 mb-1">
            <span>{{ macro.label }}</span>
            <span>
              {{ entryMacros[macro.key] }}{{ macro.unit }} / {{ store.goals[macro.key] }}{{ macro.unit }} ({{ percentOfGoal(entryMacros[macro.key], store.goals[macro.key]) }}%)
            </span>
          </div>
          <v-progress-linear
            :model-value="Math.min(100, percentOfGoal(entryMacros[macro.key], store.goals[macro.key]))"
            :color="macro.color"
            height="12"
            rounded
          />
        </div>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn @click="dialog = false">Close</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
  import { ref } from 'vue'
  import { useDailyLogStore } from '@/stores/dailyLog'
  import { emptyMacros } from '@/types'
  import type { DailyLogEntry, Macros } from '@/types'
  import { macroDisplays } from '@/utils/macroDisplay'
  import { percentOfGoal } from '@/utils/macros'

  const store = useDailyLogStore()

  const macros = macroDisplays

  const dialog = ref(false)
  const entryName = ref('')
  const entryMacros = ref<Macros>(emptyMacros())

  function open(entry: DailyLogEntry) {
    entryName.value = entry.name
    entryMacros.value = entry.macros
    dialog.value = true
  }

  defineExpose({ open })
</script>
