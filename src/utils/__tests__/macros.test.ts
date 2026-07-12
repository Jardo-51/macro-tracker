import { describe, expect, it } from 'vitest'
import type { Macros } from '@/types'
import {
  addMacros,
  multiplyMacros,
  percentOfGoal,
  sanitizeMacros,
  sumMacros,
  toFiniteNonNegative,
} from '@/utils/macros'

function macros(overrides: Partial<Macros> = {}): Macros {
  return {
    calories: 100,
    protein: 10,
    carbsTotal: 20,
    carbsFiber: 3,
    carbsSugar: 5,
    fat: 4,
    ...overrides,
  }
}

describe('toFiniteNonNegative', () => {
  it('passes through finite non-negative numbers', () => {
    expect(toFiniteNonNegative(0)).toBe(0)
    expect(toFiniteNonNegative(2.5)).toBe(2.5)
  })

  it('clamps negatives and non-finite values to 0', () => {
    expect(toFiniteNonNegative(-3)).toBe(0)
    expect(toFiniteNonNegative(Number.NaN)).toBe(0)
    expect(toFiniteNonNegative(Number.POSITIVE_INFINITY)).toBe(0)
  })

  it('handles the raw strings v-model.number can produce', () => {
    expect(toFiniteNonNegative('')).toBe(0)
    expect(toFiniteNonNegative('abc')).toBe(0)
    expect(toFiniteNonNegative('1.5')).toBe(1.5)
    expect(toFiniteNonNegative('-2')).toBe(0)
  })

  it('accepts a decimal comma', () => {
    expect(toFiniteNonNegative('1,5')).toBe(1.5)
  })

  it('coerces other types to 0', () => {
    expect(toFiniteNonNegative(undefined)).toBe(0)
    expect(toFiniteNonNegative(null)).toBe(0)
  })
})

describe('sanitizeMacros', () => {
  it('sanitizes every field', () => {
    const dirty = macros({ calories: '' as unknown as number, protein: -5 })
    expect(sanitizeMacros(dirty)).toEqual(macros({ calories: 0, protein: 0 }))
  })
})

describe('multiplyMacros', () => {
  it('multiplies and rounds every field', () => {
    expect(multiplyMacros(macros(), 1.5)).toEqual({
      calories: 150,
      protein: 15,
      carbsTotal: 30,
      carbsFiber: 5, // 4.5 rounds up
      carbsSugar: 8, // 7.5 rounds up
      fat: 6,
    })
  })
})

describe('addMacros / sumMacros', () => {
  it('adds field-wise', () => {
    expect(addMacros(macros(), macros())).toEqual(multiplyMacros(macros(), 2))
  })

  it('sums a list and returns zeros for an empty list', () => {
    expect(sumMacros([macros(), macros(), macros()])).toEqual(multiplyMacros(macros(), 3))
    expect(sumMacros([])).toEqual({
      calories: 0,
      protein: 0,
      carbsTotal: 0,
      carbsFiber: 0,
      carbsSugar: 0,
      fat: 0,
    })
  })
})

describe('percentOfGoal', () => {
  it('rounds the percentage', () => {
    expect(percentOfGoal(50, 200)).toBe(25)
    expect(percentOfGoal(1, 3)).toBe(33)
  })

  it('returns 0 instead of Infinity/NaN when the goal is 0', () => {
    expect(percentOfGoal(50, 0)).toBe(0)
    expect(percentOfGoal(0, 0)).toBe(0)
  })
})
