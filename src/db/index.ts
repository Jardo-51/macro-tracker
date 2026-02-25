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

export { db }
