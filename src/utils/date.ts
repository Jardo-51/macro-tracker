// All date strings in this app are local-time YYYY-MM-DD.
// Avoid toISOString() — it returns UTC dates, which can differ from local date around midnight.

export function toLocalDateStr(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function today(): string {
  return toLocalDateStr()
}
