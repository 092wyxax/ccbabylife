/**
 * 預購截單時間：每週日 23:59:59 (台灣時間 GMT+8)
 * 取得最近一次截單的時間戳。
 */
export function nextCutoffDate(now: Date = new Date()): Date {
  // Shift +8h so getUTC* methods read out Taipei wall-clock values.
  // Host machine timezone independent.
  const taipei = new Date(now.getTime() + 8 * 60 * 60 * 1000)

  const taipeiDay = taipei.getUTCDay() // 0 = Sunday
  const taipeiH = taipei.getUTCHours()
  const taipeiM = taipei.getUTCMinutes()

  let daysUntilSunday = (7 - taipeiDay) % 7
  // If it's already Sunday past 23:59, jump to next week
  if (daysUntilSunday === 0 && (taipeiH > 23 || (taipeiH === 23 && taipeiM >= 59))) {
    daysUntilSunday = 7
  }

  // Build Taipei "this Sunday 23:59:59"
  const cutoffTaipei = new Date(taipei)
  cutoffTaipei.setUTCDate(taipei.getUTCDate() + daysUntilSunday)
  cutoffTaipei.setUTCHours(23, 59, 59, 0)

  // Convert back to UTC instant
  return new Date(cutoffTaipei.getTime() - 8 * 60 * 60 * 1000)
}
