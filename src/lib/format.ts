export function formatTwd(value: number): string {
  return `NT$${value.toLocaleString('en-US')}`
}

export function formatJpy(value: number): string {
  return `¥${value.toLocaleString('en-US')}`
}

export function formatAgeRange(min: number | null, max: number | null): string | null {
  if (min == null && max == null) return null
  if (min === 0 && (max === 0 || max == null)) return null
  if (min == null) return `${max} 個月以下`
  if (max == null) return `${min} 個月以上`
  if (min === 0 && max >= 36) return '0–36 個月'
  return `${min}–${max} 個月`
}
