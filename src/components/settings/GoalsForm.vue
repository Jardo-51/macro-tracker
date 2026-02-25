<template>
  <v-card class="mb-4">
    <v-card-title>Daily Goals</v-card-title>
    <v-card-text>
      <v-row dense>
        <v-col cols="6">
          <v-text-field
            v-model.number="form.calories"
            label="Calories (kcal)"
            type="number"
            min="0"
            density="compact"
            variant="outlined"
            hide-details
          />
        </v-col>
        <v-col cols="6">
          <v-text-field
            v-model.number="form.protein"
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
            v-model.number="form.carbsTotal"
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
            v-model.number="form.fat"
            label="Fat (g)"
            type="number"
            min="0"
            density="compact"
            variant="outlined"
            hide-details
          />
        </v-col>
      </v-row>
    </v-card-text>
    <v-card-actions>
      <v-spacer />
      <v-btn color="primary" variant="flat" @click="save">Save Goals</v-btn>
    </v-card-actions>
  </v-card>
</template>

<script lang="ts" setup>
  import { reactive, watch } from 'vue'
  import { useDailyLogStore } from '@/stores/dailyLog'
  import { useAppStore } from '@/stores/app'

  const store = useDailyLogStore()
  const app = useAppStore()

  const form = reactive({
    calories: store.goals.calories,
    protein: store.goals.protein,
    carbsTotal: store.goals.carbsTotal,
    fat: store.goals.fat,
  })

  watch(() => store.goals, (g) => {
    form.calories = g.calories
    form.protein = g.protein
    form.carbsTotal = g.carbsTotal
    form.fat = g.fat
  })

  async function save() {
    await store.updateGoals(form)
    app.showSnackbar('Goals updated')
  }
</script>
