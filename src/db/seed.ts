import { db } from '.'
import type { DailyGoals } from '@/types'

const DEFAULT_GOALS: DailyGoals = {
  id: 'default',
  calories: 2000,
  protein: 150,
  carbsTotal: 250,
  fat: 65,
}

export async function seedDefaults() {
  const existing = await db.dailyGoals.get('default')
  if (!existing) {
    await db.dailyGoals.put(DEFAULT_GOALS)
  }
}
