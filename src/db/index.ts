import Dexie, { type EntityTable } from 'dexie'
import type { DailyGoals, DailyLogEntry, FoodItem, MealTemplate } from '@/types'

const db = new Dexie('MacroTrackerDB') as Dexie & {
  foodItems: EntityTable<FoodItem, 'id'>
  mealTemplates: EntityTable<MealTemplate, 'id'>
  dailyLogEntries: EntityTable<DailyLogEntry, 'id'>
  dailyGoals: EntityTable<DailyGoals, 'id'>
}

db.version(1).stores({
  foodItems: 'id, name, createdAt',
  mealTemplates: 'id, name, createdAt',
  dailyLogEntries: 'id, date, sourceType, createdAt',
  dailyGoals: 'id',
})

db.version(2).stores({
  foodItems: 'id, name, createdAt, lastUsedAt',
  mealTemplates: 'id, name, createdAt, lastUsedAt',
  dailyLogEntries: 'id, date, sourceType, createdAt',
  dailyGoals: 'id',
}).upgrade(async tx => {
  const lastUsed = new Map<string, string>()
  // ascending by createdAt → last write per sourceId = most recent use
  await tx.table('dailyLogEntries').orderBy('createdAt').each((e: DailyLogEntry) => {
    if (e.sourceId) lastUsed.set(e.sourceId, e.createdAt)
  })
  await tx.table('foodItems').toCollection().modify((f: FoodItem) => {
    const lu = lastUsed.get(f.id)
    if (lu) f.lastUsedAt = lu
  })
  await tx.table('mealTemplates').toCollection().modify((m: MealTemplate) => {
    const lu = lastUsed.get(m.id)
    if (lu) m.lastUsedAt = lu
  })
})

export { db }
