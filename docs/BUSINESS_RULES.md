# 業務規則

> 本文件記錄訂單、預購、退款、購物金等核心業務規則。
> 程式碼實作位於 `src/server/services/OrderService.ts` 等服務層。

---

## 1. 訂單狀態機（H4 修正）

### 1.1 狀態定義

| 狀態值 | 中文 | 說明 |
|---|---|---|
| `pending_payment` | 待付款 | 訂單已建立，尚未完成付款 |
| `paid` | 已付款 | 綠界 webhook 確認付款完成 |
| `sourcing_jp` | 日本下單中 | 朋友在日本通路下單 |
| `received_jp` | 日本到貨 | 商品已抵達日本集運倉 |
| `shipping_intl` | 國際集運中 | 集運批次已從日本出口 |
| `arrived_tw` | 台灣到港 | 集運抵達台灣，海關放行中 |
| `shipped` | 已出貨 | 黑貓 / 超商物流取件 |
| `completed` | 已完成 | 客戶簽收 + 7 天無爭議期過 |
| `cancelled` | 已取消 | 訂單在 paid 之前取消 |
| `refunded` | 已退款 | 已退款（必須先 cancelled 或 completed） |

### 1.2 合法轉移矩陣

> 規則：除矩陣中標 ✅ 外，**所有其他轉移皆為非法**，由 `OrderService.changeStatus(from, to)` 拋出 `InvalidStatusTransitionError`。

| From \ To | pending | paid | sourcing | received | shipping | arrived | shipped | completed | cancelled | refunded |
|---|---|---|---|---|---|---|---|---|---|---|
| **pending_payment** | — | ✅ | — | — | — | — | — | — | ✅ | — |
| **paid** | — | — | ✅ | — | — | — | — | — | ✅ | ✅ |
| **sourcing_jp** | — | — | — | ✅ | — | — | — | — | ✅ | ✅ |
| **received_jp** | — | — | — | — | ✅ | — | — | — | ✅ | ✅ |
| **shipping_intl** | — | — | — | — | — | ✅ | — | — | — | ✅ |
| **arrived_tw** | — | — | — | — | — | — | ✅ | — | — | ✅ |
| **shipped** | — | — | — | — | — | — | — | ✅ | — | ✅ |
| **completed** | — | — | — | — | — | — | — | — | — | ✅ |
| **cancelled** | — | — | — | — | — | — | — | — | — | ✅ |
| **refunded** | — | — | — | — | — | — | — | — | — | — |

### 1.3 規則摘要

- **取消（cancelled）只能在 `pending_payment` → `received_jp` 之間**：商品到日本後仍可取消（需朋友協調退貨給通路），但已國際集運後不能取消（成本不可逆）。
- **退款（refunded）可從 `paid` 起到 `completed` 都進入**：但需先標 cancelled 或補金流退款流程。
- **`completed` 不可改回 `paid`** 等較早狀態，避免會計重複入帳。
- **狀態變更必寫入 `order_status_logs`**，含操作人 ID、原因、時戳。

### 1.4 OrderService 介面

```typescript
// src/server/services/OrderService.ts
const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending_payment: ['paid', 'cancelled'],
  paid:            ['sourcing_jp', 'cancelled', 'refunded'],
  sourcing_jp:     ['received_jp', 'cancelled', 'refunded'],
  received_jp:     ['shipping_intl', 'cancelled', 'refunded'],
  shipping_intl:   ['arrived_tw', 'refunded'],
  arrived_tw:      ['shipped', 'refunded'],
  shipped:         ['completed', 'refunded'],
  completed:       ['refunded'],
  cancelled:       ['refunded'],
  refunded:        []
}

export async function changeStatus(orderId: string, to: OrderStatus, actor: AdminUser, reason?: string) {
  const order = await getOrder(orderId)
  if (!TRANSITIONS[order.status].includes(to)) {
    throw new InvalidStatusTransitionError(order.status, to)
  }
  await db.transaction(async (tx) => {
    await tx.update(orders).set({ status: to, updatedAt: new Date() }).where(eq(orders.id, orderId))
    await tx.insert(orderStatusLogs).values({
      orderId, fromStatus: order.status, toStatus: to,
      actorId: actor.id, reason
    })
  })
  await notifyCustomer(order, to)  // LINE + Email
}
```

---

## 2. 預購制規則

### 2.1 預購批次
- **截單**：每週日 23:59
- **日本下單**：每週一
- **預計到貨**：截單後 10–14 天

### 2.2 付款
- **新客**：全額預收
- **回頭客（≥ 3 訂單）**：可選訂金 30% + 出貨前尾款 70%
- **高價品（≥ NT$5,000）**：強制訂金制

### 2.3 跑單處理
- 訂金已收 + 7 天未補尾款 → 自動 `cancelled`，訂金不退
- 全額預收訂單 → 不會跑單

---

## 3. 退款規則

| 情境 | 處理 |
|---|---|
| 客戶下單 24 小時內取消（未付款） | 直接 cancel，無扣費 |
| 已付款、未進日本下單前取消 | 全額退（扣綠界手續費） |
| 已日本下單、未集運前取消 | 退 80%（朋友需協調退貨） |
| 已集運後取消 | 不可取消，僅瑕疵可退 |
| 商品瑕疵 | 全額退或換貨（依客戶選擇） |
| 客戶簽收 7 天內爭議 | 個案處理 |
| 客戶簽收 7 天後 | 標 `completed`，不再受理退款 |

---

## 4. 購物金規則

- **取得**：推薦獎金、客訴補償、活動贈送
- **使用**：每筆訂單最多折抵 30%
- **效期**：取得後 12 個月內（`store_credit_expire`）
- **不可轉讓**、不可換現金

---

## 5. 黑名單規則

進入黑名單觸發條件：
- 連續 2 次跑單
- 客訴後仍惡意散播不實資訊
- 違反法規誠信宣告（要求代購禁運品）

黑名單客戶：
- 不可下單（前台 checkout 阻擋）
- LINE 推播停止
- 仍保留歷史訂單資料（不主動刪除，依個資法處理請求）
