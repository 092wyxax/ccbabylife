import Link from 'next/link'
import {
  FaqPreorderIllustration,
  FaqPaymentIllustration,
  FaqReturnsIllustration,
  FaqRegulationsIllustration,
} from '@/components/shared/BrandIllustrations'

export const metadata = {
  title: '常見問題',
  description: '預購流程、付款、退換貨、法規限制等常見問題',
}

const SECTION_ICON: Record<string, { Icon: React.ComponentType<{ className?: string }>; tone: string }> = {
  預購流程: { Icon: FaqPreorderIllustration, tone: 'text-seal' },
  付款: { Icon: FaqPaymentIllustration, tone: 'text-sage' },
  退換貨: { Icon: FaqReturnsIllustration, tone: 'text-accent' },
  法規: { Icon: FaqRegulationsIllustration, tone: 'text-seal' },
}

const FAQS = [
  {
    section: '預購流程',
    items: [
      {
        q: '什麼時候截單？什麼時候到貨？',
        a: '每週日 23:59 截單，隔週一日本下單，預計 10–14 天到貨。實際到貨日會在訂單追蹤頁顯示，每階段（日本到貨、台灣到港、出貨）我們都會 LINE 通知。',
      },
      {
        q: '可以一次買多家品牌嗎？',
        a: '可以。我們會幫妳合單集運，省運費。',
      },
      {
        q: '有現貨嗎？',
        a: '少數熱門品我們會囤現貨，前台商品頁標註「現貨」。其餘為「預購」。',
      },
    ],
  },
  {
    section: '付款',
    items: [
      {
        q: '付款方式有哪些？',
        a: '信用卡、ATM 轉帳、超商代碼、超商條碼。透過綠界金流，安全有保障。',
      },
      {
        q: '可以分期嗎？',
        a: '信用卡支援 3、6、12 期分期（依發卡銀行支援度）。',
      },
      {
        q: '是否可以訂金制？',
        a: '回頭客（≥ 3 訂單）或單筆 NT$5,000 以上的訂單，可選訂金 30% + 出貨前尾款 70%。新客以全額預收為主。',
      },
    ],
  },
  {
    section: '退換貨',
    items: [
      {
        q: '可以退貨嗎？',
        a: '依下單時間：(1) 24 小時內未付款可直接取消；(2) 已付款未進日本下單，全額退（扣綠界手續費）；(3) 已日本下單未集運，退 80%；(4) 已國際集運後不可取消，僅瑕疵可退。',
      },
      {
        q: '商品瑕疵怎麼處理？',
        a: '收到貨 7 天內若有瑕疵，請拍照 LINE 給我們，全額退或換貨（依妳選擇）。',
      },
      {
        q: '寄丟了怎麼辦？',
        a: '黑貓宅配在台灣段有保險。國際集運段我們有保單，遇丟件由我們承擔，全額退款。',
      },
    ],
  },
  {
    section: '法規',
    items: [
      {
        q: '為什麼有些東西你們不賣？',
        a: '台灣對嬰兒奶粉、藥品、寵物處方食品、含肉寵物食品等都有嚴格的查驗登記與檢疫要求，個人或商業進口都不適合。我們選擇不碰，避免妳收到產品後出狀況。',
      },
      {
        q: '我貼日本網址你們可以代購嗎？',
        a: '可以，但我們會先檢核法規。紅燈品項一律婉拒；黃燈品項雙方確認後才下單；綠燈品項正常處理。',
      },
      {
        q: '為什麼透明公開定價公式？',
        a: '誠信是品牌的根基。匯率、運費、服務費、利潤率對所有人公開，沒有隱藏費用。',
      },
    ],
  },
]

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-16">
      <p className="font-jp text-xs tracking-[0.3em] text-ink-soft mb-3">FAQ · よくある質問</p>
      <h1 className="font-serif text-4xl mb-8 tracking-wide">常見問題</h1>

      <div className="space-y-14">
        {FAQS.map((sec) => {
          const meta = SECTION_ICON[sec.section]
          const Icon = meta?.Icon
          return (
            <section key={sec.section}>
              <header className="flex items-center gap-3 mb-5 pb-3 border-b border-line">
                {Icon && (
                  <span className={meta.tone}>
                    <Icon className="w-10 h-10" />
                  </span>
                )}
                <h2 className="font-serif text-xl tracking-wide">{sec.section}</h2>
              </header>
              <div className="space-y-6">
                {sec.items.map((item) => (
                  <div key={item.q}>
                    <h3 className="font-medium mb-2">Q. {item.q}</h3>
                    <p className="text-sm leading-relaxed text-ink-soft whitespace-pre-wrap">
                      {item.a}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )
        })}
      </div>

      <section className="mt-16 p-6 bg-cream-100 border border-line rounded-lg text-sm">
        <p className="mb-2">沒找到你的問題？</p>
        <p className="text-ink-soft">
          直接私訊我們的 LINE，工作時間 24 小時內會回覆。
          也歡迎查看 <Link href="/about" className="underline hover:text-accent">關於我們 + 法規誠信宣告</Link>。
        </p>
      </section>
    </div>
  )
}
