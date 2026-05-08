'use client'

import { useEffect, useState } from 'react'

type Method = 'home' | 'cvs_711' | 'cvs_family' | 'cvs_hilife' | 'cvs_okmart'

interface PickedStore {
  storeId: string
  storeName: string
  storeAddress: string
  cvsType: string
}

const CVS_LABEL: Record<Exclude<Method, 'home'>, string> = {
  cvs_711: '7-ELEVEN',
  cvs_family: '全家',
  cvs_hilife: '萊爾富',
  cvs_okmart: 'OK 超商',
}

const CVS_TO_ECPAY: Record<Exclude<Method, 'home'>, string> = {
  cvs_711: 'UNIMARTC2C',
  cvs_family: 'FAMIC2C',
  cvs_hilife: 'HILIFEC2C',
  cvs_okmart: 'OKMARTC2C',
}

export function ShippingMethodPicker() {
  const [method, setMethod] = useState<Method>('home')
  const [store, setStore] = useState<PickedStore | null>(null)

  useEffect(() => {
    // Read pending_cvs_store cookie if returned from ECPay map
    const m = document.cookie.match(/(?:^|;\s*)pending_cvs_store=([^;]+)/)
    if (!m) return
    try {
      const parsed = JSON.parse(decodeURIComponent(m[1])) as PickedStore
      setStore(parsed)
      // Pre-select corresponding method
      const found = (Object.entries(CVS_TO_ECPAY) as Array<[Exclude<Method, 'home'>, string]>).find(
        ([, v]) => v === parsed.cvsType
      )
      if (found) setMethod(found[0])
    } catch {
      /* ignore */
    }
  }, [])

  const isCvs = method !== 'home'

  function openMap() {
    if (method === 'home') return
    const cvsType = CVS_TO_ECPAY[method as Exclude<Method, 'home'>]
    const tempId = `T${Date.now()}`.slice(0, 20)
    const win = document.createElement('form')
    win.method = 'POST'
    win.action = '/api/ecpay/logistics/store-map-redirect'
    const inputs: Array<[string, string]> = [
      ['merchantTradeNo', tempId],
      ['cvsType', cvsType],
    ]
    for (const [k, v] of inputs) {
      const i = document.createElement('input')
      i.type = 'hidden'
      i.name = k
      i.value = v
      win.appendChild(i)
    }
    document.body.appendChild(win)
    win.submit()
  }

  return (
    <section>
      <h2 className="font-jp text-xs tracking-[0.3em] text-ink-soft mb-3">
        配送方法 · 配送方式
      </h2>
      <input type="hidden" name="shippingMethod" value={method} form="checkout-form" />
      {isCvs && store && (
        <>
          <input type="hidden" name="cvsStoreId" value={store.storeId} form="checkout-form" />
          <input type="hidden" name="cvsStoreName" value={store.storeName} form="checkout-form" />
          <input type="hidden" name="cvsStoreAddress" value={store.storeAddress} form="checkout-form" />
        </>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
        <MethodBtn
          active={method === 'home'}
          onClick={() => setMethod('home')}
          label="宅配到府"
          desc="黑貓 / 新竹貨運"
        />
        <MethodBtn
          active={method === 'cvs_711'}
          onClick={() => setMethod('cvs_711')}
          label="7-11 取貨"
          desc="到指定門市自取"
        />
        <MethodBtn
          active={method === 'cvs_family'}
          onClick={() => setMethod('cvs_family')}
          label="全家取貨"
          desc="到指定門市自取"
        />
        <MethodBtn
          active={method === 'cvs_hilife'}
          onClick={() => setMethod('cvs_hilife')}
          label="萊爾富取貨"
          desc="到指定門市自取"
        />
      </div>

      {isCvs && (
        <div className="bg-cream-100 border border-line rounded-lg p-4">
          {store ? (
            <div className="flex items-start justify-between gap-3">
              <div className="text-sm">
                <p className="font-medium">
                  {CVS_LABEL[method as Exclude<Method, 'home'>]}：{store.storeName}
                </p>
                <p className="text-xs text-ink-soft mt-0.5">{store.storeAddress}</p>
                <p className="text-xs text-ink-soft mt-0.5 font-mono">門市代號 {store.storeId}</p>
              </div>
              <button
                type="button"
                onClick={openMap}
                className="text-xs underline text-ink-soft hover:text-ink whitespace-nowrap"
              >
                重新選擇
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={openMap}
              className="font-jp text-sm bg-ink text-cream px-4 py-2 rounded-md tracking-wider"
            >
              選擇 {CVS_LABEL[method as Exclude<Method, 'home'>]} 門市
            </button>
          )}
        </div>
      )}
    </section>
  )
}

function MethodBtn({
  active,
  onClick,
  label,
  desc,
}: {
  active: boolean
  onClick: () => void
  label: string
  desc: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        'text-left px-4 py-3 rounded-md border transition-colors ' +
        (active
          ? 'border-ink bg-cream-100'
          : 'border-line hover:border-ink/40 bg-white')
      }
    >
      <p className="text-sm font-medium">{label}</p>
      <p className="text-xs text-ink-soft mt-0.5">{desc}</p>
    </button>
  )
}
