<template>
  <v-card class="mb-4">
    <v-card-title class="d-flex align-center">
      <span>Trends</span>
      <v-spacer />
      <v-btn-toggle v-model="range" mandatory density="compact" variant="outlined">
        <v-btn :value="7">7d</v-btn>
        <v-btn :value="14">14d</v-btn>
        <v-btn :value="30">30d</v-btn>
      </v-btn-toggle>
    </v-card-title>
    <v-card-text>
      <v-chip-group v-model="selectedMacros" multiple>
        <v-chip
          v-for="macro in macroOptions"
          :key="macro.key"
          :value="macro.key"
          :color="macro.color"
          filter
          size="small"
        >
          {{ macro.label }}
        </v-chip>
      </v-chip-group>
      <Line
        v-if="chartData.datasets.length > 0"
        :data="chartData"
        :options="chartOptions"
        style="max-height: 300px"
      />
      <p v-else class="text-body-2 text-medium-emphasis text-center pa-4">
        Select a macro to chart.
      </p>
    </v-card-text>
  </v-card>
</template>

<script lang="ts" setup>
  import { ref, computed, watch } from 'vue'
  import { Line } from 'vue-chartjs'
  import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler,
  } from 'chart.js'
  import { useHistoryStore } from '@/stores/history'
  import { useTheme } from 'vuetify'

  ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

  const store = useHistoryStore()
  const theme = useTheme()

  const isDark = computed(() => theme.global.name.value === 'dark')
  const gridColor = computed(() => isDark.value ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)')
  const tickColor = computed(() => isDark.value ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)')
  const legendColor = computed(() => isDark.value ? '#fff' : '#000')

  const range = ref(7)
  const selectedMacros = ref(['calories'])

  const macroOptions = [
    { key: 'calories', label: 'Calories', color: '#FFB300' },
    { key: 'protein', label: 'Protein', color: '#1E88E5' },
    { key: 'carbs', label: 'Carbs', color: '#43A047' },
    { key: 'fat', label: 'Fat', color: '#FB8C00' },
  ]

  const colorMap: Record<string, string> = {
    calories: '#FFB300',
    protein: '#1E88E5',
    carbs: '#43A047',
    fat: '#FB8C00',
  }

  const chartData = computed(() => {
    const trend = store.trendData
    return {
      labels: trend.labels,
      datasets: selectedMacros.value.map(key => ({
        label: key.charAt(0).toUpperCase() + key.slice(1),
        data: trend[key as keyof typeof trend] as number[],
        borderColor: colorMap[key],
        backgroundColor: colorMap[key] + '33',
        tension: 0.3,
        fill: false,
        pointRadius: 3,
      })),
    }
  })

  const chartOptions = computed(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: { color: legendColor.value },
      },
    },
    scales: {
      x: {
        grid: { color: gridColor.value },
        ticks: { color: tickColor.value },
      },
      y: {
        beginAtZero: true,
        grid: { color: gridColor.value },
        ticks: { color: tickColor.value },
      },
    },
  }))

  watch(range, (val) => {
    store.loadRangeData(val)
  })
</script>
