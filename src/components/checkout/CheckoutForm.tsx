'use client'

import Link from 'next/link'
import { useActionState, useEffect, useState } from 'react'
import { useCartStore } from '@/stores/cartStore'
import { imageUrl } from '@/lib/image'
import { formatTwd } from '@/lib/format'
import { shippingFee, FREE_SHIP_THRESHOLD_TWD } from '@/lib/pricing'
import { checkoutAction, type CheckoutState } from '@/server/actions/checkout'
import {
  applyCouponAction,
  dismissActiveCouponAction,
  type ApplyCouponState,
} from '@/server/actions/active-coupon'
import type { CustomerAddress } from '@/db/schema/customer_addresses'
import { ShippingMethodPicker } from './ShippingMethodPicker'
import { AddressLinkedFields } from './AddressLinkedFields'

const initial: CheckoutState = {}

interface Prefill {
  name: string
  email: string
  phone: string
  lineUserId: string
}

interface Props {
  prefill: Prefill
  savedAddresses: CustomerAddress[]
  activeCouponCode: string | null
}

interface AddressFields {
  recipientName: string
  recipientPhone: string
  recipientCity: string
  recipientZip: string
  recipientAddress: string
}

function addrToFields(a: CustomerAddress): AddressFields {
  return {
    recipientName: a.recipientName,
    recipientPhone: a.phone,
    recipientCity: a.city,
    recipientZip: a.zipcode,
    recipientAddress: a.street,
  }
}

const couponInitial: ApplyCouponState = {}

export function CheckoutForm({ prefill, savedAddresses, activeCouponCode }: Props) {
  const [mounted, setMounted] = useState(false)
  const items = useCartStore((s) => s.items)
  const totals = useCartStore((s) => s.totals)
  useEffect(() => setMounted(true), [])

  const defaultAddress =
    savedAddresses.find((a) => a.isDefault) ?? savedAddresses[0] ?? null

  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    defaultAddress?.id ?? null
  )
  const [fields, setFields] = useState<AddressFields>(() =>
    defaultAddress
      ? addrToFields(defaultAddress)
      : {
          recipientName: prefill.name,
          recipientPhone: prefill.phone,
          recipientCity: '',
          recipientZip: '',
          recipientAddress: '',
        }
  )

  const [state, formAction, pending] = useActionState(checkoutAction, initial)
  const errs = state.fieldErrors ?? {}

  const [couponState, couponFormAction, couponPending] = useActionState(
    applyCouponAction,
    couponInitial
  )
  const [autoTried, setAutoTried] = useState(false)

  // Auto-apply cookie coupon once cart is mounted (so we know subtotal)
  useEffect(() => {
    if (!mounted || autoTried || !activeCouponCode) return
    const subtotal = items.reduce((s, i) => s + i.priceTwd * i.quantity, 0)
    if (subtotal === 0) return
    const fd = new FormData()
    fd.set('code', activeCouponCode)
    fd.set('subtotalTwd', String(subtotal))
    couponFormAction(fd)
    setAutoTried(true)
  }, [mounted, autoTried, activeCouponCode, items, couponFormAction])

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
  const overweight = ship < 0

  // Effective coupon: server result (after apply) overrides initial cookie state
  const effectiveCode: string | null =
    couponState.ok && couponState.code
      ? couponState.code
      : couponState.error
        ? null
        : activeCouponCode
  const couponDiscount = couponState.ok ? (couponState.discount ?? 0) : 0
  const couponFreeShipping = couponState.ok && Boolean(couponState.freeShipping)
  const reachedFreeShipThreshold = t.subtotal >= FREE_SHIP_THRESHOLD_TWD
  const finalShip = couponFreeShipping || reachedFreeShipThreshold ? 0 : computedShip
  const total = Math.max(0, t.subtotal + finalShip - couponDiscount)

  const pickAddress = (id: string | null) => {
    setSelectedAddressId(id)
    if (id === null) {
      setFields({
        recipientName: prefill.name,
        recipientPhone: prefill.phone,
        recipientCity: '',
        recipientZip: '',
        recipientAddress: '',
      })
      return
    }
    const a = savedAddresses.find((x) => x.id === id)
    if (a) setFields(addrToFields(a))
  }

  return (
    <div className="grid lg:grid-cols-[1fr_360px] gap-8">
      <form id="checkout-form" action={formAction} className="space-y-8">
        {state.error && (
          <div className="bg-danger/10 border border-danger/40 text-danger text-sm p-3 rounded-md">
            {state.error}
          </div>
        )}

        <Section title="お客様情報 · 收件人資訊">
          <Row>
            <Field
              label="收件人姓名"
              name="recipientName"
              required
              error={errs.recipientName}
              value={fields.recipientName}
              onChange={(v) => setFields((f) => ({ ...f, recipientName: v }))}
            />
            <Field
              label="電話"
              name="recipientPhone"
              type="tel"
              required
              error={errs.recipientPhone}
              value={fields.recipientPhone}
              onChange={(v) => setFields((f) => ({ ...f, recipientPhone: v }))}
            />
          </Row>
          <Field
            label="Email"
            name="recipientEmail"
            type="email"
            required
            hint="訂單通知 + Email 備援會寄到這"
            error={errs.recipientEmail}
            defaultValue={prefill.email}
          />
          <Field
            label="LINE ID（選填）"
            name="recipientLineId"
            hint="填了之後 LINE 推播會直接送到妳的 LINE"
            error={errs.recipientLineId}
            defaultValue={prefill.lineUserId}
          />
        </Section>

        <ShippingMethodPicker />

        <Section title="お届け先 · 寄送地址">
          {savedAddresses.length > 0 && (
            <div className="bg-cream-100 border border-line rounded-lg p-4 mb-2">
              <p className="font-jp text-xs tracking-[0.2em] text-ink-soft mb-3">
                既存のお届け先 · 從常用地址挑選
              </p>
              <div className="flex flex-wrap gap-2">
                {savedAddresses.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => pickAddress(a.id)}
                    className={
                      'text-xs px-3 py-1.5 rounded-full border transition-colors ' +
                      (selectedAddressId === a.id
                        ? 'bg-ink text-cream border-ink'
                        : 'bg-cream border-line text-ink-soft hover:border-ink hover:text-ink')
                    }
                  >
                    {a.label}
                    {a.isDefault && (
                      <span className="ml-1.5 font-jp text-[10px] opacity-70">既定</span>
                    )}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => pickAddress(null)}
                  className={
                    'text-xs px-3 py-1.5 rounded-full border transition-colors font-jp ' +
                    (selectedAddressId === null
                      ? 'bg-ink text-cream border-ink'
                      : 'bg-cream border-line text-ink-soft hover:border-ink hover:text-ink')
                  }
                >
                  その他 · 手動填寫
                </button>
              </div>
              <p className="text-xs text-ink-soft mt-3">
                沒有想要的地址？
                <Link
                  href="/account/addresses/new"
                  className="underline hover:text-accent ml-1"
                  target="_blank"
                >
                  新增常用地址
                </Link>
              </p>
            </div>
          )}
          <AddressLinkedFields
            initialCity={fields.recipientCity}
            initialZip={fields.recipientZip}
            cityError={errs.recipientCity}
            zipError={errs.recipientZip}
            syncKey={selectedAddressId ?? 'manual'}
          />
          <Field
            label="詳細地址"
            name="recipientAddress"
            required
            placeholder="例：信義路四段 1 號 5 樓"
            error={errs.recipientAddress}
            value={fields.recipientAddress}
            onChange={(v) => setFields((f) => ({ ...f, recipientAddress: v }))}
          />
        </Section>

        <Section title="お子様情報 · 寶寶資訊（選填）">
          <Field
            label="寶寶生日"
            name="babyBirthDate"
            type="date"
            hint="填了之後我們會在寶寶生日當天送你優惠券 🎁。寵物 / 一般商品請留空。"
            error={errs.babyBirthDate}
          />
        </Section>

        <input type="hidden" name="cartJson" value={JSON.stringify(items)} />
      </form>

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
            <span>
              {overweight ? (
                '個案'
              ) : couponFreeShipping || reachedFreeShipThreshold ? (
                <>
                  <span className="line-through text-ink-soft mr-1">
                    {formatTwd(computedShip)}
                  </span>
                  <span className="text-success">免運 🎉</span>
                </>
              ) : (
                formatTwd(computedShip)
              )}
            </span>
          </div>
          {couponDiscount > 0 && (
            <div className="flex justify-between text-accent">
              <span>優惠券折抵（{effectiveCode}）</span>
              <span>−{formatTwd(couponDiscount)}</span>
            </div>
          )}
          {overweight && (
            <p className="text-xs text-warning">
              超過 5kg，運費先暫設 0，下單後 24 小時內人工回覆精準金額。
            </p>
          )}
        </div>

        <CouponSection
          subtotal={t.subtotal}
          activeCode={effectiveCode}
          state={couponState}
          formAction={couponFormAction}
          pending={couponPending}
        />

        <div className="border-t border-line pt-4 flex justify-between text-base font-medium">
          <span>總計</span>
          <span>{formatTwd(total)}</span>
        </div>

        <input
          type="hidden"
          form="checkout-form"
          name="couponCode"
          value={effectiveCode ?? ''}
        />

        <button
          type="submit"
          form="checkout-form"
          disabled={pending}
          className="font-jp w-full bg-ink text-cream py-3 rounded-md hover:bg-accent transition-colors disabled:opacity-50 tracking-wider"
        >
          {pending ? '送信中・・・' : 'ご注文を確定する · 送出訂單'}
        </button>

        <p className="text-xs text-ink-soft leading-relaxed">
          送出後訂單狀態為「待付款」。綠界金流 API 接通後（審核中），妳會收到付款連結。
          目前先用此訂單編號 + Email 在{' '}
          <Link href="/account" className="underline">
            /account
          </Link>{' '}
          查詢進度。
        </p>

        <div className="border-t border-line pt-4 mt-2">
          <ul className="space-y-2 text-xs text-ink-soft">
            <li className="flex items-start gap-2">
              <span aria-hidden>🔒</span>
              <span>綠界金流 SSL 加密，本店不接觸卡號</span>
            </li>
            <li className="flex items-start gap-2">
              <span aria-hidden>📦</span>
              <span>7 天鑑賞期（預購除外，依消保法）</span>
            </li>
            <li className="flex items-start gap-2">
              <span aria-hidden>💬</span>
              <span>LINE 客服營業日 24 小時內回覆</span>
            </li>
            <li className="flex items-start gap-2">
              <span aria-hidden>🇯🇵</span>
              <span>日本實體店面採購，非水貨</span>
            </li>
          </ul>
        </div>
      </aside>
    </div>
  )
}

function CouponSection({
  subtotal,
  activeCode,
  state,
  formAction,
  pending,
}: {
  subtotal: number
  activeCode: string | null
  state: ApplyCouponState
  formAction: (formData: FormData) => void
  pending: boolean
}) {
  return (
    <div className="border-t border-line pt-4">
      <details open={Boolean(activeCode) || Boolean(state.error)}>
        <summary className="cursor-pointer text-sm font-jp tracking-widest text-ink-soft hover:text-ink select-none">
          {activeCode ? `🎁 已套用：${activeCode}` : '使用優惠券 / クーポン'}
        </summary>
        <div className="mt-3 space-y-2">
          {/* nested form is fine - submits to its own action */}
          <form action={formAction} className="flex gap-2">
            <input type="hidden" name="subtotalTwd" value={subtotal} />
            <input
              name="code"
              defaultValue={activeCode ?? ''}
              placeholder="輸入優惠碼"
              className="flex-1 border border-line rounded-md px-3 py-2 text-sm uppercase tracking-wider focus:outline-none focus:border-ink"
            />
            <button
              type="submit"
              disabled={pending}
              className="text-sm bg-ink text-cream px-4 rounded-md hover:bg-accent transition-colors disabled:opacity-50"
            >
              {pending ? '⋯' : '套用'}
            </button>
          </form>
          {state.error && (
            <p className="text-xs text-danger">{state.error}</p>
          )}
          {state.ok && (
            <p className="text-xs text-accent">
              已套用 {state.code}
              {state.freeShipping
                ? '：免運'
                : state.discount
                  ? `：折抵 ${state.discount.toLocaleString('zh-TW')} 元`
                  : ''}
            </p>
          )}
          {activeCode && (
            <form action={dismissActiveCouponAction.bind(null)}>
              <button
                type="submit"
                className="text-xs text-ink-soft hover:text-danger underline-offset-2 hover:underline"
              >
                移除優惠券
              </button>
            </form>
          )}
        </div>
      </details>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-jp text-xs tracking-[0.3em] text-ink-soft mb-3">
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
  value?: string
  defaultValue?: string
  onChange?: (v: string) => void
}

function Field({
  label,
  name,
  type = 'text',
  required,
  placeholder,
  hint,
  error,
  value,
  defaultValue,
  onChange,
}: FieldProps) {
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
        value={value}
        defaultValue={defaultValue}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        className="w-full border border-line rounded-md px-3 py-2 focus:outline-none focus:border-ink"
      />
      {hint && !error && <p className="text-xs text-ink-soft mt-1">{hint}</p>}
      {error && <p className="text-xs text-danger mt-1">{error}</p>}
    </div>
  )
}
