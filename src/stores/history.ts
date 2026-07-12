import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { db } from '@/db'
import { emptyMacros } from '@/types'
import type { DailyLogEntry, Macros } from '@/types'
import { toLocalDateStr } from '@/utils/date'
import { multiplyMacros, sumMacros } from '@/utils/macros'

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
    return multiplyMacros(sumMacros(days.map(d => d.totals)), 1 / days.length)
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
      map.set(toLocalDateStr(d), [])
    }

    for (const entry of entries) {
      const list = map.get(entry.date)
      if (list) list.push(entry)
    }

    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, dayEntries]) => ({
        date,
        entries: dayEntries,
        totals: sumMacros(dayEntries.map(e => e.macros)),
      }))
  }

  async function loadRangeData(days: number) {
    selectedRange.value = days
    const endDate = new Date()
    endDate.setDate(endDate.getDate() - 1) // exclude today (incomplete data)
    const startDate = new Date(endDate)
    startDate.setDate(endDate.getDate() - days + 1)

    const startStr = toLocalDateStr(startDate)
    const endStr = toLocalDateStr(endDate)

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
