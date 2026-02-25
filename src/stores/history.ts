import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { db } from '@/db'
import { emptyMacros } from '@/types'
import type { DailyLogEntry, Macros } from '@/types'

interface DayData {
  date: string
  entries: DailyLogEntry[]
  totals: Macros
}

export const useHistoryStore = defineStore('history', () => {
  const weeklyData = ref<DayData[]>([])
  const rangeData = ref<DayData[]>([])
  const selectedRange = ref(7)

  const weeklyAverages = computed<Macros>(() => {
    const days = weeklyData.value.filter(d => d.entries.length > 0)
    if (days.length === 0) return emptyMacros()
    const totals = emptyMacros()
    for (const day of days) {
      totals.calories += day.totals.calories
      totals.protein += day.totals.protein
      totals.carbsTotal += day.totals.carbsTotal
      totals.carbsFiber += day.totals.carbsFiber
      totals.carbsSugar += day.totals.carbsSugar
      totals.fat += day.totals.fat
    }
    const count = days.length
    return {
      calories: Math.round(totals.calories / count),
      protein: Math.round(totals.protein / count),
      carbsTotal: Math.round(totals.carbsTotal / count),
      carbsFiber: Math.round(totals.carbsFiber / count),
      carbsSugar: Math.round(totals.carbsSugar / count),
      fat: Math.round(totals.fat / count),
    }
  })

  const trendData = computed(() => {
    const data = rangeData.value
    const labels = data.map(d => {
      const date = new Date(d.date + 'T00:00:00')
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    })
    return {
      labels,
      calories: data.map(d => d.totals.calories),
      protein: data.map(d => d.totals.protein),
      carbs: data.map(d => d.totals.carbsTotal),
      fat: data.map(d => d.totals.fat),
    }
  })

  function aggregateByDate(entries: DailyLogEntry[], startDate: string, endDate: string): DayData[] {
    const map = new Map<string, DailyLogEntry[]>()

    // Initialize all dates in range
    const start = new Date(startDate + 'T00:00:00')
    const end = new Date(endDate + 'T00:00:00')
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      map.set(d.toISOString().slice(0, 10), [])
    }

    for (const entry of entries) {
      const list = map.get(entry.date)
      if (list) list.push(entry)
    }

    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, dayEntries]) => {
        const totals = emptyMacros()
        for (const e of dayEntries) {
          totals.calories += e.macros.calories
          totals.protein += e.macros.protein
          totals.carbsTotal += e.macros.carbsTotal
          totals.carbsFiber += e.macros.carbsFiber
          totals.carbsSugar += e.macros.carbsSugar
          totals.fat += e.macros.fat
        }
        return { date, entries: dayEntries, totals }
      })
  }

  async function loadRangeData(days: number) {
    selectedRange.value = days
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - days + 1)

    const startStr = startDate.toISOString().slice(0, 10)
    const endStr = endDate.toISOString().slice(0, 10)

    const entries = await db.dailyLogEntries
      .where('date')
      .between(startStr, endStr, true, true)
      .toArray()

    rangeData.value = aggregateByDate(entries, startStr, endStr)
  }

  async function loadWeeklyData() {
    await loadRangeData(7)
    weeklyData.value = rangeData.value
  }

  return {
    weeklyData,
    rangeData,
    selectedRange,
    weeklyAverages,
    trendData,
    loadWeeklyData,
    loadRangeData,
  }
})
