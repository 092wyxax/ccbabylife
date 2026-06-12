import 'server-only'
import { generateText, tool, stepCountIs } from 'ai'
import { z } from 'zod'
import { and, desc, eq, gte, ilike, inArray, lte, or, sql } from 'drizzle-orm'
import { db } from '@/db/client'
import { orders, orderItems, customers, products } from '@/db/schema'
import { aiUsageLogs } from '@/db/schema/ai_usage'
import { lineMessages } from '@/db/schema/line_messages'
import { DEFAULT_ORG_ID } from '@/db/schema/organizations'
import { STATUS_LABEL } from '@/lib/order-progress'
import { deepseekChat, isDeepSeekConfigured } from '@/lib/deepseek'
import { getStoreSettings } from './StoreSettingsService'

export class DeepSeekKeyMissingError extends Error {
  constructor() {
    super('DEEPSEEK_API_KEY 未設定，請在 Zeabur 環境變數補上後重新部署')
    this.name = 'DeepSeekKeyMissingError'
  }
}

/** 活躍訂單狀態（排除取消/退款） */
const REVENUE_STATUSES = [
  'paid',
  'sourcing_jp',
  'received_jp',
  'shipping_intl',
  'arrived_tw',
  'shipped',
  'completed',
] as const

function daysAgo(n: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}

/* ---------- 唯讀查詢 tools（所有數字一律查 DB，不讓模型瞎掰） ---------- */

const tools = {
  getSalesSummary: tool({
    description:
      '查營收摘要：指定最近 N 天的訂單數、營收（已付款的活躍訂單）、待付款單數。問「這個月/今天/最近賣多少」時用。',
    inputSchema: z.object({
      days: z.number().int().min(1).max(365).describe('往回看的天數，例如今天=1、本週=7、本月=30'),
    }),
    execute: async ({ days }) => {
      const since = daysAgo(days)
      const [revenue] = await db
        .select({
          orderCount: sql<number>`count(*)::int`,
          totalTwd: sql<number>`coalesce(sum(${orders.total}), 0)::int`,
        })
        .from(orders)
        .where(
          and(
            eq(orders.orgId, DEFAULT_ORG_ID),
            gte(orders.createdAt, since),
            inArray(orders.status, [...REVENUE_STATUSES])
          )
        )
      const [pending] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(orders)
        .where(
          and(
            eq(orders.orgId, DEFAULT_ORG_ID),
            gte(orders.createdAt, since),
            eq(orders.status, 'pending_payment')
          )
        )
      return {
        days,
        paidOrderCount: revenue.orderCount,
        revenueTwd: revenue.totalTwd,
        pendingPaymentCount: pending.count,
      }
    },
  }),

  searchOrders: tool({
    description: '搜訂單：依訂單編號、客戶姓名或 email 模糊搜尋，回傳最多 10 筆基本資訊。',
    inputSchema: z.object({
      query: z.string().min(1).max(100).describe('訂單編號 / 客戶姓名 / email 關鍵字'),
    }),
    execute: async ({ query }) => {
      const kw = `%${query}%`
      const rows = await db
        .select({
          orderNumber: orders.orderNumber,
          status: orders.status,
          total: orders.total,
          createdAt: orders.createdAt,
          customerName: customers.name,
          customerEmail: customers.email,
          trackingNumber: orders.trackingNumber,
        })
        .from(orders)
        .leftJoin(customers, eq(orders.customerId, customers.id))
        .where(
          and(
            eq(orders.orgId, DEFAULT_ORG_ID),
            or(
              ilike(orders.orderNumber, kw),
              ilike(customers.name, kw),
              ilike(customers.email, kw)
            )
          )
        )
        .orderBy(desc(orders.createdAt))
        .limit(10)
      return rows.map((r) => ({
        ...r,
        statusLabel: STATUS_LABEL[r.status],
        createdAt: r.createdAt.toISOString().slice(0, 10),
      }))
    },
  }),

  getOrderDetail: tool({
    description: '查單一訂單完整明細（品項、金額、物流、收件資訊）。需要精確訂單編號。',
    inputSchema: z.object({
      orderNumber: z.string().min(1).max(60).describe('完整訂單編號'),
    }),
    execute: async ({ orderNumber }) => {
      const [row] = await db
        .select()
        .from(orders)
        .where(and(eq(orders.orgId, DEFAULT_ORG_ID), eq(orders.orderNumber, orderNumber)))
        .limit(1)
      if (!row) return { error: '找不到此訂單編號' }
      const items = await db
        .select({
          name: orderItems.productNameSnapshot,
          qty: orderItems.quantity,
          lineTotal: orderItems.lineTotal,
        })
        .from(orderItems)
        .where(eq(orderItems.orderId, row.id))
      return {
        orderNumber: row.orderNumber,
        status: row.status,
        statusLabel: STATUS_LABEL[row.status],
        subtotal: row.subtotal,
        shippingFee: row.shippingFee,
        couponDiscount: row.couponDiscount,
        manualAdjustment: row.manualAdjustment,
        total: row.total,
        trackingNumber: row.trackingNumber,
        shippingProvider: row.shippingProvider,
        createdAt: row.createdAt.toISOString().slice(0, 10),
        items,
      }
    },
  }),

  getTopProducts: tool({
    description: '查最近 N 天的熱賣商品排行（依銷售數量）。',
    inputSchema: z.object({
      days: z.number().int().min(1).max(365).describe('往回看的天數'),
      limit: z.number().int().min(1).max(20).default(5),
    }),
    execute: async ({ days, limit }) => {
      const since = daysAgo(days)
      const rows = await db
        .select({
          name: orderItems.productNameSnapshot,
          totalQty: sql<number>`sum(${orderItems.quantity})::int`,
          totalTwd: sql<number>`sum(${orderItems.lineTotal})::int`,
        })
        .from(orderItems)
        .innerJoin(orders, eq(orderItems.orderId, orders.id))
        .where(
          and(
            eq(orders.orgId, DEFAULT_ORG_ID),
            gte(orders.createdAt, since),
            inArray(orders.status, [...REVENUE_STATUSES])
          )
        )
        .groupBy(orderItems.productNameSnapshot)
        .orderBy(desc(sql`sum(${orderItems.quantity})`))
        .limit(limit)
      return rows
    },
  }),

  getLowStock: tool({
    description: '查低庫存的現貨商品（庫存 ≤ 指定門檻，預設 5）。',
    inputSchema: z.object({
      threshold: z.number().int().min(0).max(100).default(5),
    }),
    execute: async ({ threshold }) => {
      const rows = await db
        .select({
          name: products.nameZh,
          stock: products.stockQuantity,
          priceTwd: products.priceTwd,
        })
        .from(products)
        .where(
          and(
            eq(products.orgId, DEFAULT_ORG_ID),
            eq(products.status, 'active'),
            eq(products.stockType, 'in_stock'),
            lte(products.stockQuantity, threshold)
          )
        )
        .orderBy(products.stockQuantity)
        .limit(20)
      return rows
    },
  }),

  getPendingWork: tool({
    description:
      '查今日待辦：待出貨訂單（台灣到港）、待處理的各狀態訂單數、未讀 LINE 訊息數。問「今天要做什麼/有什麼待辦」時用。',
    inputSchema: z.object({}),
    execute: async () => {
      const byStatus = await db
        .select({
          status: orders.status,
          count: sql<number>`count(*)::int`,
        })
        .from(orders)
        .where(
          and(
            eq(orders.orgId, DEFAULT_ORG_ID),
            inArray(orders.status, [
              'pending_payment',
              'paid',
              'sourcing_jp',
              'received_jp',
              'shipping_intl',
              'arrived_tw',
            ])
          )
        )
        .groupBy(orders.status)
      const [unread] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(lineMessages)
        .where(
          and(
            eq(lineMessages.orgId, DEFAULT_ORG_ID),
            eq(lineMessages.direction, 'in'),
            eq(lineMessages.isRead, false)
          )
        )
      return {
        ordersByStatus: byStatus.map((r) => ({
          status: r.status,
          label: STATUS_LABEL[r.status],
          count: r.count,
        })),
        unreadLineMessages: unread.count,
      }
    },
  }),
}

const SYSTEM_PROMPT = `你是「熙熙初日」（預購制日系母嬰選物店）的後台 AI 小幫手，使用者是店主／老闆娘。

規則：
- 回答一律用繁體中文（台灣用語），口吻親切簡潔。
- 涉及數字（營收、訂單、庫存）一定要先呼叫 tool 查資料庫，絕不憑空編造。查不到就老實說查不到。
- 金額一律用 NT$ 格式呈現。
- 幫忙寫文案（IG 貼文、LINE 群發、商品文）時：品牌調性是「日本媽媽親身試用、誠實不誇大、溫柔專業」，避免浮誇促銷感嘆號連發。
- 你只有唯讀查詢能力。若使用者要你執行操作（改訂單狀態、發券、出貨），請說明你目前不能直接操作，並告訴他在後台哪個頁面可以做。
- 回答盡量短：先講重點數字/結論，需要時再列細節。`

export interface ChatTurn {
  role: 'user' | 'assistant'
  content: string
}

/** 記錄一次呼叫的 token 用量（失敗不影響主流程） */
async function logUsage(
  feature: 'chat' | 'inbox_draft',
  usage: { inputTokens: number | undefined; outputTokens: number | undefined }
): Promise<void> {
  try {
    await db.insert(aiUsageLogs).values({
      orgId: DEFAULT_ORG_ID,
      feature,
      inputTokens: usage.inputTokens ?? 0,
      outputTokens: usage.outputTokens ?? 0,
    })
  } catch (e) {
    console.error('[AdminAiService] logUsage failed:', e)
  }
}

/** 店家在「AI 設定」頁維護的備忘，附加到 system prompt */
async function storeNotesBlock(): Promise<string> {
  const { aiNotes } = await getStoreSettings()
  if (!aiNotes) return ''
  return `\n\n店家補充資訊（店主在後台「AI 設定」維護，視為最新且可信）：\n${aiNotes}`
}

export async function runAdminAssistant(history: ChatTurn[]): Promise<string> {
  if (!isDeepSeekConfigured()) throw new DeepSeekKeyMissingError()
  const result = await generateText({
    model: deepseekChat(),
    system: SYSTEM_PROMPT + (await storeNotesBlock()),
    messages: history,
    tools,
    stopWhen: stepCountIs(6),
  })
  await logUsage('chat', result.totalUsage)
  return result.text || '（沒有產生回覆，請換個方式問問看）'
}

/* ---------- 收件匣：AI 草擬客服回覆 ---------- */

export async function draftInboxReply(lineUserId: string): Promise<string> {
  if (!isDeepSeekConfigured()) throw new DeepSeekKeyMissingError()

  const thread = await db
    .select({
      direction: lineMessages.direction,
      text: lineMessages.text,
      createdAt: lineMessages.createdAt,
    })
    .from(lineMessages)
    .where(
      and(eq(lineMessages.orgId, DEFAULT_ORG_ID), eq(lineMessages.lineUserId, lineUserId))
    )
    .orderBy(desc(lineMessages.createdAt))
    .limit(20)
  thread.reverse()

  const [customer] = await db
    .select()
    .from(customers)
    .where(
      and(eq(customers.orgId, DEFAULT_ORG_ID), eq(customers.lineUserId, lineUserId))
    )
    .limit(1)

  let orderContext = '（此 LINE 用戶未綁定客戶帳號，查不到訂單）'
  if (customer) {
    const recent = await db
      .select({
        orderNumber: orders.orderNumber,
        status: orders.status,
        total: orders.total,
        trackingNumber: orders.trackingNumber,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .where(and(eq(orders.orgId, DEFAULT_ORG_ID), eq(orders.customerId, customer.id)))
      .orderBy(desc(orders.createdAt))
      .limit(5)
    orderContext =
      recent.length === 0
        ? '此客戶尚無訂單'
        : recent
            .map(
              (o) =>
                `${o.orderNumber}｜${STATUS_LABEL[o.status]}｜NT$${o.total.toLocaleString()}｜${
                  o.trackingNumber ? `追蹤碼 ${o.trackingNumber}` : '無追蹤碼'
                }｜${o.createdAt.toISOString().slice(0, 10)}`
            )
            .join('\n')
  }

  const conversation = thread
    .map((m) => `${m.direction === 'in' ? '客人' : '小編'}：${m.text ?? '(非文字訊息)'}`)
    .join('\n')

  const result = await generateText({
    model: deepseekChat(),
    system:
      `你是「熙熙初日」（預購制日系母嬰選物店）的 LINE 客服小編。根據對話脈絡與客戶訂單資料，草擬「下一句要回給客人的訊息」。

要求：
- 繁體中文（台灣用語）、親切溫柔、像真人小編，可以用 1-2 個適度的 emoji。
- 直接輸出要傳送的訊息內容本身，不要加任何前綴、引號或說明。
- 若客人在問訂單進度，引用下方訂單資料的實際狀態回答；資料裡沒有的事不要保證（如確切到貨日）。
- 控制在 150 字內。` + (await storeNotesBlock()),
    prompt: `客戶：${customer?.name ?? '（未綁定）'}
近期訂單：
${orderContext}

最近對話：
${conversation}

請草擬下一句回覆：`,
  })
  await logUsage('inbox_draft', result.totalUsage)
  return result.text.trim()
}

/* ---------- AI 設定頁：用量統計與 DeepSeek 餘額 ---------- */

/** deepseek-chat 牌價（USD / 百萬 tokens）。以 cache-miss 計 = 估算上限，實際常更低 */
const PRICE_USD_PER_M = { input: 0.28, output: 0.42 }
const USD_TO_TWD = 31

export interface AiUsageSummary {
  monthCalls: number
  monthInputTokens: number
  monthOutputTokens: number
  /** 本月估算費用（TWD，cache-miss 上限價） */
  monthCostTwd: number
  totalCalls: number
}

export async function getAiUsageSummary(): Promise<AiUsageSummary> {
  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)

  const [month] = await db
    .select({
      calls: sql<number>`count(*)::int`,
      input: sql<number>`coalesce(sum(${aiUsageLogs.inputTokens}), 0)::int`,
      output: sql<number>`coalesce(sum(${aiUsageLogs.outputTokens}), 0)::int`,
    })
    .from(aiUsageLogs)
    .where(and(eq(aiUsageLogs.orgId, DEFAULT_ORG_ID), gte(aiUsageLogs.createdAt, monthStart)))

  const [total] = await db
    .select({ calls: sql<number>`count(*)::int` })
    .from(aiUsageLogs)
    .where(eq(aiUsageLogs.orgId, DEFAULT_ORG_ID))

  const costUsd =
    (month.input / 1_000_000) * PRICE_USD_PER_M.input +
    (month.output / 1_000_000) * PRICE_USD_PER_M.output

  return {
    monthCalls: month.calls,
    monthInputTokens: month.input,
    monthOutputTokens: month.output,
    monthCostTwd: costUsd * USD_TO_TWD,
    totalCalls: total.calls,
  }
}

export interface DeepSeekBalance {
  currency: string
  totalBalance: string
}

/** DeepSeek 官方餘額 API；查不到（網路/未設 key）回 null，頁面顯示「查無」 */
export async function getDeepSeekBalance(): Promise<DeepSeekBalance | null> {
  if (!isDeepSeekConfigured()) return null
  try {
    const res = await fetch('https://api.deepseek.com/user/balance', {
      headers: { Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}` },
      signal: AbortSignal.timeout(8000),
      cache: 'no-store',
    })
    if (!res.ok) return null
    const data = (await res.json()) as {
      balance_infos?: Array<{ currency: string; total_balance: string }>
    }
    const info = data.balance_infos?.[0]
    if (!info) return null
    return { currency: info.currency, totalBalance: info.total_balance }
  } catch {
    return null
  }
}
