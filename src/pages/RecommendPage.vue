<template>
  <v-container>
    <h1 class="text-h5 mb-4">Menu Recommendation</h1>

    <v-card class="mb-4">
      <v-card-title class="text-subtitle-1">Remaining Today</v-card-title>
      <v-card-text>
        <div class="d-flex justify-space-between flex-wrap ga-2">
          <v-chip size="small" color="macro-calories" variant="tonal">
            {{ dailyLog.remainingMacros.calories }} kcal
          </v-chip>
          <v-chip size="small" color="macro-protein" variant="tonal">
            {{ dailyLog.remainingMacros.protein }}g protein
          </v-chip>
          <v-chip size="small" color="macro-carbs" variant="tonal">
            {{ dailyLog.remainingMacros.carbsTotal }}g carbs
          </v-chip>
          <v-chip size="small" color="macro-fat" variant="tonal">
            {{ dailyLog.remainingMacros.fat }}g fat
          </v-chip>
        </div>
      </v-card-text>
    </v-card>

    <v-textarea
      v-model="menuText"
      label="Paste restaurant menu"
      variant="outlined"
      rows="6"
      auto-grow
      hide-details
      class="mb-4"
    />

    <v-btn
      color="primary"
      variant="flat"
      block
      :loading="loading"
      :disabled="!menuText.trim() || !app.openaiApiKey"
      class="mb-4"
      @click="getRecommendation"
    >
      Get Recommendation
    </v-btn>

    <v-alert
      v-if="!app.openaiApiKey"
      type="info"
      variant="tonal"
      class="mb-4"
    >
      Set your OpenAI API key in
      <router-link to="/settings">Settings</router-link>
      to use this feature.
    </v-alert>

    <v-alert
      v-if="error"
      type="error"
      variant="tonal"
      closable
      class="mb-4"
      @click:close="error = ''"
    >
      {{ error }}
    </v-alert>

    <template v-if="recommendation">
      <v-card v-if="recommendation.soup" class="mb-4">
        <v-card-title>Recommended Soup</v-card-title>
        <v-card-subtitle>{{ recommendation.soup.name }}</v-card-subtitle>
        <v-card-text>
          <div class="d-flex flex-wrap ga-2 mb-2">
            <v-chip size="x-small" color="macro-calories" variant="tonal">{{ recommendation.soup.macros.calories }} kcal</v-chip>
            <v-chip size="x-small" color="macro-protein" variant="tonal">{{ recommendation.soup.macros.protein }}g protein</v-chip>
            <v-chip size="x-small" color="macro-carbs" variant="tonal">{{ recommendation.soup.macros.carbsTotal }}g carbs</v-chip>
            <v-chip size="x-small" color="macro-fat" variant="tonal">{{ recommendation.soup.macros.fat }}g fat</v-chip>
          </div>
          <p class="text-body-2 text-medium-emphasis">{{ recommendation.soup.reasoning }}</p>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" color="primary" @click="addToLog(recommendation.soup!)">
            Add to Daily Log
          </v-btn>
        </v-card-actions>
      </v-card>

      <v-card class="mb-4">
        <v-card-title>Recommended Main Course</v-card-title>
        <v-card-subtitle>{{ recommendation.mainCourse.name }}</v-card-subtitle>
        <v-card-text>
          <div class="d-flex flex-wrap ga-2 mb-2">
            <v-chip size="x-small" color="macro-calories" variant="tonal">{{ recommendation.mainCourse.macros.calories }} kcal</v-chip>
            <v-chip size="x-small" color="macro-protein" variant="tonal">{{ recommendation.mainCourse.macros.protein }}g protein</v-chip>
            <v-chip size="x-small" color="macro-carbs" variant="tonal">{{ recommendation.mainCourse.macros.carbsTotal }}g carbs</v-chip>
            <v-chip size="x-small" color="macro-fat" variant="tonal">{{ recommendation.mainCourse.macros.fat }}g fat</v-chip>
          </div>
          <p class="text-body-2 text-medium-emphasis">{{ recommendation.mainCourse.reasoning }}</p>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" color="primary" @click="addToLog(recommendation.mainCourse)">
            Add to Daily Log
          </v-btn>
        </v-card-actions>
      </v-card>

      <v-card variant="tonal" class="mb-4">
        <v-card-title class="text-subtitle-1">Combined</v-card-title>
        <v-card-text>
          <div class="d-flex flex-wrap ga-2">
            <v-chip size="small" color="macro-calories" variant="outlined">{{ recommendation.combinedMacros.calories }} kcal</v-chip>
            <v-chip size="small" color="macro-protein" variant="outlined">{{ recommendation.combinedMacros.protein }}g protein</v-chip>
            <v-chip size="small" color="macro-carbs" variant="outlined">{{ recommendation.combinedMacros.carbsTotal }}g carbs</v-chip>
            <v-chip size="small" color="macro-fat" variant="outlined">{{ recommendation.combinedMacros.fat }}g fat</v-chip>
          </div>
        </v-card-text>
        <v-card-actions v-if="recommendation.soup">
          <v-spacer />
          <v-btn variant="flat" color="primary" @click="addBothToLog">
            Add Both to Daily Log
          </v-btn>
        </v-card-actions>
      </v-card>
    </template>
  </v-container>
</template>

<script lang="ts" setup>
  import { ref, onMounted } from 'vue'
  import { useDailyLogStore } from '@/stores/dailyLog'
  import { useAppStore } from '@/stores/app'
  import { recommendFromMenu } from '@/services/openai'
  import { today } from '@/utils/date'
  import { emptyMacros } from '@/types'
  import type { MenuRecommendation, RecommendedItem } from '@/types'

  const dailyLog = useDailyLogStore()
  const app = useAppStore()

  const menuText = ref('')
  const loading = ref(false)
  const error = ref('')
  const recommendation = ref<MenuRecommendation | null>(null)

  onMounted(async () => {
    await dailyLog.loadGoals()
    const dateToLoad = dailyLog.currentDate < today() ? today() : undefined
    await dailyLog.loadDate(dateToLoad)
  })

  async function getRecommendation() {
    loading.value = true
    error.value = ''
    recommendation.value = null
    try {
      recommendation.value = await recommendFromMenu(
        menuText.value,
        dailyLog.remainingMacros,
        app.openaiApiKey,
      )
    } catch (e: any) {
      error.value = e.message || 'Failed to get recommendation'
    } finally {
      loading.value = false
    }
  }

  async function addToLog(item: RecommendedItem) {
    await dailyLog.addEntry({
      date: dailyLog.currentDate,
      name: item.name,
      servings: 1,
      macros: { ...emptyMacros(), ...item.macros },
      sourceType: 'manual',
    })
    app.showSnackbar(`Added "${item.name}" to daily log`)
  }

  async function addBothToLog() {
    if (recommendation.value?.soup) {
      await addToLog(recommendation.value.soup)
    }
    await addToLog(recommendation.value!.mainCourse)
  }
</script>
