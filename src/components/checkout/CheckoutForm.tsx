'use client'

import Link from 'next/link'
import { useActionState, useEffect, useState } from 'react'
import { useCartStore } from '@/stores/cartStore'
import { imageUrl } from '@/lib/image'
import { formatTwd } from '@/lib/format'
import { shippingFee } from '@/lib/pricing'
import { checkoutAction, type CheckoutState } from '@/server/actions/checkout'

const initial: CheckoutState = {}

export function CheckoutForm() {
  const [mounted, setMounted] = useState(false)
  const items = useCartStore((s) => s.items)
  const totals = useCartStore((s) => s.totals)
  useEffect(() => setMounted(true), [])

  const [state, formAction, pending] = useActionState(checkoutAction, initial)
  const errs = state.fieldErrors ?? {}

  if (!mounted) return <p className="text-ink-soft text-sm">載入中⋯</p>

  if (items.length === 0) {
    return (
      <div className="py-12 text-center text-ink-soft border border-dashed border-line rounded-lg">
        購物車是空的，無法結帳。
        <Link href="/shop" className="underline hover:text-accent ml-2">
          去逛逛
        </Link>
      </div>
    )
  }

  const t = totals()
  const ship = shippingFee(t.totalWeightG)
  const computedShip = ship < 0 ? 0 : ship
  const total = t.subtotal + computedShip
  const overweight = ship < 0

  return (
    <form action={formAction} className="grid lg:grid-cols-[1fr_360px] gap-8">
      <div className="space-y-8">
        {state.error && (
          <div className="bg-danger/10 border border-danger/40 text-danger text-sm p-3 rounded-md">
            {state.error}
          </div>
        )}

        <Section title="收件人資訊">
          <Row>
            <Field label="收件人姓名" name="recipientName" required error={errs.recipientName} />
            <Field label="電話" name="recipientPhone" type="tel" required error={errs.recipientPhone} />
          </Row>
          <Field
            label="Email"
            name="recipientEmail"
            type="email"
            required
            hint="訂單通知 + Email 備援會寄到這"
            error={errs.recipientEmail}
          />
          <Field
            label="LINE ID（選填）"
            name="recipientLineId"
            hint="填了之後 LINE 推播會直接送到妳的 LINE"
            error={errs.recipientLineId}
          />
        </Section>

        <Section title="寄送地址">
          <Row>
            <Field label="縣市" name="recipientCity" required placeholder="例：台北市" error={errs.recipientCity} />
            <Field label="郵遞區號" name="recipientZip" required placeholder="例：106" error={errs.recipientZip} />
          </Row>
          <Field
            label="詳細地址"
            name="recipientAddress"
            required
            placeholder="例：信義路四段 1 號 5 樓"
            error={errs.recipientAddress}
          />
        </Section>

        <Section title="寶寶資訊（選填）">
          <Field
            label="寶寶月齡"
            name="babyAgeMonths"
            type="number"
            placeholder="例：6"
            hint="幫助我們未來推薦適合的選物。寵物 / 一般商品請留空。"
            error={errs.babyAgeMonths}
          />
        </Section>

        <input type="hidden" name="cartJson" value={JSON.stringify(items)} />
      </div>

      <aside className="bg-white border border-line rounded-lg p-6 h-fit lg:sticky lg:top-20 space-y-4">
        <h2 className="font-serif text-lg">訂單摘要</h2>

        <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
          {items.map((it) => (
            <div key={it.productId} className="flex items-start gap-3 text-sm">
              <div className="w-12 h-12 flex-shrink-0 bg-cream-100 rounded-md overflow-hidden">
                {it.imagePath && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imageUrl(it.imagePath)}
                    alt={it.nameZh}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="line-clamp-2 leading-snug">{it.nameZh}</p>
                <p className="text-xs text-ink-soft mt-0.5">
                  {formatTwd(it.priceTwd)} × {it.quantity}
                </p>
              </div>
              <p className="font-medium whitespace-nowrap">
                {formatTwd(it.priceTwd * it.quantity)}
              </p>
            </div>
          ))}
        </div>

        <div className="border-t border-line pt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-ink-soft">商品小計</span>
            <span>{formatTwd(t.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-soft">總重量</span>
            <span>{(t.totalWeightG / 1000).toFixed(2)} kg</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-soft">國際運費（估算）</span>
            <span>{overweight ? '個案' : formatTwd(computedShip)}</span>
          </div>
          {overweight && (
            <p className="text-xs text-warning">
              超過 5kg，運費先暫設 0，下單後 24 小時內人工回覆精準金額。
            </p>
          )}
        </div>

        <div className="border-t border-line pt-4 flex justify-between text-base font-medium">
          <span>總計</span>
          <span>{formatTwd(total)}</span>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="w-full bg-ink text-cream py-3 rounded-md hover:bg-accent transition-colors disabled:opacity-50"
        >
          {pending ? '建立訂單中⋯' : '送出訂單'}
        </button>

        <p className="text-xs text-ink-soft leading-relaxed">
          送出後訂單狀態為「待付款」。綠界金流 API 接通後（審核中），妳會收到付款連結。
          目前先用此訂單編號 + Email 在{' '}
          <Link href="/account" className="underline">
            /account
          </Link>{' '}
          查詢進度。
        </p>
      </aside>
    </form>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-xs uppercase tracking-widest text-ink-soft mb-3">
        {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </section>
  )
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid sm:grid-cols-2 gap-4">{children}</div>
}

interface FieldProps {
  label: string
  name: string
  type?: string
  required?: boolean
  placeholder?: string
  hint?: string
  error?: string
}

function Field({ label, name, type = 'text', required, placeholder, hint, error }: FieldProps) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm mb-1.5">
        {label}
        {required && <span className="text-danger ml-0.5">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="w-full border border-line rounded-md px-3 py-2 focus:outline-none focus:border-ink"
      />
      {hint && !error && <p className="text-xs text-ink-soft mt-1">{hint}</p>}
      {error && <p className="text-xs text-danger mt-1">{error}</p>}
    </div>
  )
}
