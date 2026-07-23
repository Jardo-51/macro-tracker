<template>
  <v-card>
    <v-card-title>
      <span>Daily Progress</span>
    </v-card-title>
    <v-card-text>
      <div
        v-for="macro in macros"
        :key="macro.key"
        v-ripple
        class="mb-3 rounded"
        style="cursor: pointer; padding: 4px; margin: -4px"
        @click="openBreakdown(macro)"
      >
        <MacroProgressRow
          :label="macro.label"
          :value="store.dailyTotals[macro.key]"
          :goal="store.goals[macro.key]"
          :unit="macro.unit"
          :color="macro.color"
          :percent="store.progressPercentages[macro.key]"
        />
      </div>
    </v-card-text>
    <MacroBreakdownDialog
      v-model="breakdownDialog"
      :macro-key="selectedMacro.key"
      :macro-label="selectedMacro.label"
      :macro-color="selectedMacro.color"
      :macro-unit="selectedMacro.unit"
    />
  </v-card>
</template>

<script lang="ts" setup>
  import { ref } from 'vue'
  import { useDailyLogStore } from '@/stores/dailyLog'
  import { macroDisplays, type MacroDisplay } from '@/utils/macroDisplay'
  import MacroBreakdownDialog from './MacroBreakdownDialog.vue'
  import MacroProgressRow from './MacroProgressRow.vue'

  const store = useDailyLogStore()

  const macros = macroDisplays

  const breakdownDialog = ref(false)
  const selectedMacro = ref(macros[0]!)

  function openBreakdown(macro: MacroDisplay) {
    selectedMacro.value = macro
    breakdownDialog.value = true
  }
</script>
