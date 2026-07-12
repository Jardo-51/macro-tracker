import { emptyMacros } from '@/types'
import type { Macros } from '@/types'

// v-model.number falls back to the raw string when the input isn't parseable,
// and an emptied field yields ''. Values coming from forms therefore need
// sanitizing before they are persisted. Accepts a decimal comma ("1,5") and
// clamps negatives and non-finite values to 0.
export function toFiniteNonNegative(v: unknown): number {
  const n = typeof v === 'string' ? Number.parseFloat(v.replace(',', '.')) : Number(v)
  return Number.isFinite(n) && n > 0 ? n : 0
}

export function sanitizeMacros(m: Macros): Macros {
  return {
    calories: toFiniteNonNegative(m.calories),
    protein: toFiniteNonNegative(m.protein),
    carbsTotal: toFiniteNonNegative(m.carbsTotal),
    carbsFiber: toFiniteNonNegative(m.carbsFiber),
    carbsSugar: toFiniteNonNegative(m.carbsSugar),
    fat: toFiniteNonNegative(m.fat),
  }
}

export function multiplyMacros(m: Macros, factor: number): Macros {
  return {
    calories: Math.round(m.calories * factor),
    protein: Math.round(m.protein * factor),
    carbsTotal: Math.round(m.carbsTotal * factor),
    carbsFiber: Math.round(m.carbsFiber * factor),
    carbsSugar: Math.round(m.carbsSugar * factor),
    fat: Math.round(m.fat * factor),
  }
}

export function addMacros(a: Macros, b: Macros): Macros {
  return {
    calories: a.calories + b.calories,
    protein: a.protein + b.protein,
    carbsTotal: a.carbsTotal + b.carbsTotal,
    carbsFiber: a.carbsFiber + b.carbsFiber,
    carbsSugar: a.carbsSugar + b.carbsSugar,
    fat: a.fat + b.fat,
  }
}

export function sumMacros(items: Macros[]): Macros {
  return items.reduce(addMacros, emptyMacros())
}
