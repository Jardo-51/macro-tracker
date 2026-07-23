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
          <MacroProgressRow
            :label="macro.label"
            :value="entryMacros[macro.key]"
            :goal="store.goals[macro.key]"
            :unit="macro.unit"
            :color="macro.color"
            :percent="entryPercentages[macro.key]"
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
  import { computed, ref } from 'vue'
  import MacroProgressRow from './MacroProgressRow.vue'
  import { useDailyLogStore } from '@/stores/dailyLog'
  import { emptyMacros } from '@/types'
  import type { DailyLogEntry, Macros } from '@/types'
  import { macroDisplays, type MacroDisplay } from '@/utils/macroDisplay'
  import { percentOfGoal } from '@/utils/macros'

  const store = useDailyLogStore()

  const macros = macroDisplays

  const dialog = ref(false)
  const entryName = ref('')
  const entryMacros = ref<Macros>(emptyMacros())

  const entryPercentages = computed(() =>
    Object.fromEntries(
      macros.map(macro => [
        macro.key,
        percentOfGoal(entryMacros.value[macro.key], store.goals[macro.key]),
      ]),
    ) as Record<MacroDisplay['key'], number>,
  )

  function open(entry: DailyLogEntry) {
    entryName.value = entry.name
    // Snapshot the macros so the dialog stays read-only against later
    // mutations of the store's reactive entry object.
    entryMacros.value = { ...entry.macros }
    dialog.value = true
  }

  defineExpose({ open })
</script>
