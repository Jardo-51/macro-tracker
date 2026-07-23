import { describe, expect, it } from 'vitest'
import { addDays, formatDisplayDate, toLocalDateStr, today } from '@/utils/date'

describe('toLocalDateStr', () => {
  it('formats as YYYY-MM-DD with zero padding', () => {
    expect(toLocalDateStr(new Date(2026, 0, 5))).toBe('2026-01-05')
    expect(toLocalDateStr(new Date(2026, 11, 31))).toBe('2026-12-31')
  })

  it('uses the local date, not UTC', () => {
    // 23:30 local on Jan 5 is Jan 6 in UTC for any timezone west of UTC,
    // and toISOString would flip the date for timezones east of UTC at 00:30.
    expect(toLocalDateStr(new Date(2026, 0, 5, 23, 30))).toBe('2026-01-05')
    expect(toLocalDateStr(new Date(2026, 0, 5, 0, 30))).toBe('2026-01-05')
  })
})

describe('today', () => {
  it('matches toLocalDateStr of now', () => {
    expect(today()).toBe(toLocalDateStr(new Date()))
  })
})

describe('addDays', () => {
  it('adds and subtracts days', () => {
    expect(addDays('2026-06-15', 1)).toBe('2026-06-16')
    expect(addDays('2026-06-15', -1)).toBe('2026-06-14')
  })

  it('crosses month and year boundaries', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01')
    expect(addDays('2025-12-31', 1)).toBe('2026-01-01')
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31')
  })

  it('handles leap years', () => {
    expect(addDays('2024-02-28', 1)).toBe('2024-02-29')
    expect(addDays('2025-02-28', 1)).toBe('2025-03-01')
  })
})

describe('formatDisplayDate', () => {
  it('labels today and yesterday', () => {
    expect(formatDisplayDate(today())).toBe('Today')
    expect(formatDisplayDate(addDays(today(), -1))).toBe('Yesterday')
  })

  it('formats older dates as a locale date string', () => {
    const result = formatDisplayDate('2026-01-05')
    expect(result).not.toBe('Today')
    expect(result).not.toBe('Yesterday')
    expect(result.length).toBeGreaterThan(0)
  })
})
