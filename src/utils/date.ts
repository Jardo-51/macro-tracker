// All date strings in this app are local-time YYYY-MM-DD.
// Avoid toISOString() — it returns UTC dates, which can differ from local date around midnight.

export function toLocalDateStr(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function today(): string {
  return toLocalDateStr()
}

export function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  date.setDate(date.getDate() + days)
  return toLocalDateStr(date)
}

export function formatDisplayDate(dateStr: string): string {
  const todayStr = today()
  if (dateStr === todayStr) return 'Today'
  if (dateStr === addDays(todayStr, -1)) return 'Yesterday'
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
}
