/**
 * Weekly Operating Rhythm — hardcoded SOP from PLAYBOOK §3-§5.
 *
 * Tasks are CONSTANTS not DB rows: they describe the team's standing weekly
 * cadence and shouldn't drift. Only the per-period completion state lives
 * in the DB (see schema/rhythm.ts).
 */
import type { AdminRole } from '@/db/schema/admin_users'

export type RhythmRole = 'wife' | 'husband' | 'friend'

export const RHYTHM_ROLE_LABEL: Record<RhythmRole, string> = {
  wife: '太太（內容 + 客服）',
  husband: '先生（系統 + 物流）',
  friend: '朋友（採購）',
}

/** Map admin role → primary rhythm role (default tab). User can switch. */
export function defaultRhythmRole(role: AdminRole): RhythmRole {
  switch (role) {
    case 'owner':
      return 'husband'
    case 'manager':
      return 'wife'
    case 'editor':
      return 'wife'
    case 'ops':
      return 'wife'
    case 'buyer':
      return 'friend'
  }
}

export type RhythmTask = {
  id: string
  role: RhythmRole
  cadence: 'daily' | 'weekly'
  /** ISO weekday 1=Mon … 7=Sun (only for weekly cadence) */
  weekday?: 1 | 2 | 3 | 4 | 5 | 6 | 7
  /** display order within the role's list */
  sort: number
  label: string
  hint?: string
  /** soft time hint shown to user */
  timeHint?: string
}

export const RHYTHM_TASKS: RhythmTask[] = [
  // ─── 太太 daily ───────────────────────────────────────
  {
    id: 'wife-threads-daily',
    role: 'wife',
    cadence: 'daily',
    sort: 1,
    label: 'Threads 早晚各 1 則 + 客服回覆',
    timeHint: '每日早晚',
    hint: 'PLAYBOOK §3 — 每日 30–60 分鐘',
  },
  {
    id: 'wife-threads-engage',
    role: 'wife',
    cadence: 'daily',
    sort: 2,
    label: 'Threads 留 20–30 則他人留言',
    timeHint: '每日 30 分鐘',
    hint: '漲粉主引擎，鎖定母嬰 / 寵物 / 日本旅遊大帳',
  },

  // ─── 太太 weekly ──────────────────────────────────────
  {
    id: 'wife-mon-line-order',
    role: 'wife',
    cadence: 'weekly',
    weekday: 1,
    sort: 10,
    label: 'LINE 訂單通知（自動 + 個別補充）',
    timeHint: '週一早上',
  },
  {
    id: 'wife-mon-ig-story',
    role: 'wife',
    cadence: 'weekly',
    weekday: 1,
    sort: 11,
    label: '寫 IG 限動 1 則「本週開團」',
    timeHint: '週一下午',
  },
  {
    id: 'wife-tue-ig-post',
    role: 'wife',
    cadence: 'weekly',
    weekday: 2,
    sort: 20,
    label: '寫 1 篇深度 IG 貼文（試用 Day 1/7/14）',
    timeHint: '週二',
  },
  {
    id: 'wife-wed-threads-engage',
    role: 'wife',
    cadence: 'weekly',
    weekday: 3,
    sort: 30,
    label: 'Threads 重點互動日（留 30 則他人留言）',
    timeHint: '週三',
  },
  {
    id: 'wife-thu-journal',
    role: 'wife',
    cadence: 'weekly',
    weekday: 4,
    sort: 40,
    label: '寫 1 篇 Journal SEO 文章半成品',
    timeHint: '週四',
    hint: '可丟外包寫手，目標 25 篇 / 6 個月',
  },
  {
    id: 'wife-fri-line-broadcast',
    role: 'wife',
    cadence: 'weekly',
    weekday: 5,
    sort: 50,
    label: 'LINE OA 群發訊息（每週 1 次）',
    timeHint: '週五',
    hint: '4 育兒 ：3 上新 ：2 法規 ：1 限時',
  },
  {
    id: 'wife-sat-pack',
    role: 'wife',
    cadence: 'weekly',
    weekday: 6,
    sort: 60,
    label: '包裝 + 手寫感謝卡',
    timeHint: '週六',
  },
  {
    id: 'wife-sun-cutoff',
    role: 'wife',
    cadence: 'weekly',
    weekday: 7,
    sort: 70,
    label: 'LINE 推「截單倒數 3 小時」',
    timeHint: '週日 21:00',
  },

  // ─── 先生 weekly ──────────────────────────────────────
  {
    id: 'husband-mon-purchase-list',
    role: 'husband',
    cadence: 'weekly',
    weekday: 1,
    sort: 10,
    label: '統整訂單 → 給朋友採購清單',
    timeHint: '週一',
  },
  {
    id: 'husband-tue-returns',
    role: 'husband',
    cadence: 'weekly',
    weekday: 2,
    sort: 20,
    label: '處理上週退換貨、客服複雜案',
    timeHint: '週二',
  },
  {
    id: 'husband-wed-dev',
    role: 'husband',
    cadence: 'weekly',
    weekday: 3,
    sort: 30,
    label: '開發新功能（依 ROADMAP 優先級）',
    timeHint: '週三',
  },
  {
    id: 'husband-thu-dev',
    role: 'husband',
    cadence: 'weekly',
    weekday: 4,
    sort: 40,
    label: '開發新功能（接續週三）',
    timeHint: '週四',
  },
  {
    id: 'husband-fri-shipping',
    role: 'husband',
    cadence: 'weekly',
    weekday: 5,
    sort: 50,
    label: '出貨準備（標籤、託運單）',
    timeHint: '週五',
  },
  {
    id: 'husband-sat-stockin',
    role: 'husband',
    cadence: 'weekly',
    weekday: 6,
    sort: 60,
    label: '商品入庫 + 拍照（協助太太）',
    timeHint: '週六',
  },
  {
    id: 'husband-sun-review',
    role: 'husband',
    cadence: 'weekly',
    weekday: 7,
    sort: 70,
    label: '數據檢視 + 下週規劃',
    timeHint: '週日',
  },

  // ─── 朋友 weekly ──────────────────────────────────────
  {
    id: 'friend-mon-confirm',
    role: 'friend',
    cadence: 'weekly',
    weekday: 1,
    sort: 10,
    label: '收到清單 → 確認在日本 / 線上下單',
    timeHint: '週一',
  },
  {
    id: 'friend-week-purchase',
    role: 'friend',
    cadence: 'weekly',
    weekday: 2,
    sort: 20,
    label: '日本端採購、集運監控',
    timeHint: '週二–五',
  },
  {
    id: 'friend-weekend-suggest',
    role: 'friend',
    cadence: 'weekly',
    weekday: 6,
    sort: 30,
    label: '準備下週新品建議',
    timeHint: '週末',
  },
]

const TASK_BY_ID = new Map(RHYTHM_TASKS.map((t) => [t.id, t]))
export function findTask(id: string): RhythmTask | undefined {
  return TASK_BY_ID.get(id)
}

/** ISO Monday-start week. Returns a UTC date at 00:00 representing the Monday. */
export function isoWeekStart(d: Date = new Date()): Date {
  const date = new Date(d)
  const day = date.getDay() // 0=Sun … 6=Sat
  const diff = (day === 0 ? -6 : 1 - day) // shift to Monday
  date.setDate(date.getDate() + diff)
  date.setHours(0, 0, 0, 0)
  return date
}

/** Today as YYYY-MM-DD in local time. */
export function todayDateStr(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** YYYY-MM-DD for a given Date (local). */
export function toDateStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Today's ISO weekday (1=Mon … 7=Sun). */
export function todayIsoWeekday(): 1 | 2 | 3 | 4 | 5 | 6 | 7 {
  const d = new Date().getDay() // 0=Sun … 6=Sat
  return (d === 0 ? 7 : d) as 1 | 2 | 3 | 4 | 5 | 6 | 7
}

/**
 * For a given task and "now", return the period-start date string used as
 * the completion key:
 *   - daily → today
 *   - weekly → this week's Monday
 */
export function periodStartFor(task: RhythmTask, now: Date = new Date()): string {
  if (task.cadence === 'daily') return toDateStr(now)
  return toDateStr(isoWeekStart(now))
}

export const ISO_WEEKDAY_LABEL: Record<1 | 2 | 3 | 4 | 5 | 6 | 7, string> = {
  1: '週一',
  2: '週二',
  3: '週三',
  4: '週四',
  5: '週五',
  6: '週六',
  7: '週日',
}
