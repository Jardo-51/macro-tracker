<template>
  <v-row dense>
    <v-col cols="6">
      <v-text-field
        v-model.number="model.calories"
        label="Calories"
        type="number"
        min="0"
        density="compact"
        variant="outlined"
        hide-details
      />
    </v-col>
    <v-col cols="6">
      <v-text-field
        v-model.number="model.protein"
        label="Protein (g)"
        type="number"
        min="0"
        density="compact"
        variant="outlined"
        hide-details
      />
    </v-col>
    <v-col cols="6">
      <v-text-field
        v-model.number="model.carbsTotal"
        label="Carbs (g)"
        type="number"
        min="0"
        density="compact"
        variant="outlined"
        hide-details
      />
    </v-col>
    <v-col cols="6">
      <v-text-field
        v-model.number="model.fat"
        label="Fat (g)"
        type="number"
        min="0"
        density="compact"
        variant="outlined"
        hide-details
      />
    </v-col>
    <v-col cols="6">
      <v-text-field
        v-model.number="model.carbsFiber"
        label="Fiber (g)"
        type="number"
        min="0"
        density="compact"
        variant="outlined"
        hide-details
      />
    </v-col>
    <v-col cols="6">
      <v-text-field
        v-model.number="model.carbsSugar"
        label="Sugar (g)"
        type="number"
        min="0"
        density="compact"
        variant="outlined"
        hide-details
      />
    </v-col>
  </v-row>
</template>

<script lang="ts" setup>
  import type { Macros } from '@/types'

  const model = defineModel<Macros>({ required: true })
</script>
