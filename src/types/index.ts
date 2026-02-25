export interface Macros {
  calories: number
  protein: number
  carbsTotal: number
  carbsFiber: number
  carbsSugar: number
  fat: number
}

export interface FoodItem {
  id: string
  name: string
  servingSize: number
  servingUnit: string
  macros: Macros
  createdAt: string
}

export interface MealTemplate {
  id: string
  name: string
  macros: Macros
  createdAt: string
}

export interface DailyLogEntry {
  id: string
  date: string // YYYY-MM-DD
  name: string
  servings: number
  macros: Macros
  sourceType: 'manual' | 'food' | 'meal'
  sourceId?: string
  createdAt: string
}

export interface DailyGoals {
  id: string
  calories: number
  protein: number
  carbsTotal: number
  fat: number
}

export interface DailySummary {
  date: string
  totals: Macros
  goals: DailyGoals
  entries: DailyLogEntry[]
}

export function emptyMacros(): Macros {
  return {
    calories: 0,
    protein: 0,
    carbsTotal: 0,
    carbsFiber: 0,
    carbsSugar: 0,
    fat: 0,
  }
}
