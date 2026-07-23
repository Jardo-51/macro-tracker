import type { Macros } from '@/types'

// Shared display config for the four headline macros, used by both the
// "Daily Progress" bars and the per-entry contribution dialog so their
// labels, units and colors stay in sync.
export interface MacroDisplay {
  key: keyof Pick<Macros, 'calories' | 'protein' | 'carbsTotal' | 'fat'>
  label: string
  unit: string
  color: string
}

export const macroDisplays: readonly MacroDisplay[] = [
  { key: 'calories', label: 'Calories', unit: ' kcal', color: 'macro-calories' },
  { key: 'protein', label: 'Protein', unit: 'g', color: 'macro-protein' },
  { key: 'carbsTotal', label: 'Carbs', unit: 'g', color: 'macro-carbs' },
  { key: 'fat', label: 'Fat', unit: 'g', color: 'macro-fat' },
]
