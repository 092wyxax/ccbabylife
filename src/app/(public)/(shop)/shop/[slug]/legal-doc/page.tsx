import { notFound } from 'next/navigation'
import { getProductBySlug } from '@/server/services/ProductService'
import { imageUrl } from '@/lib/image'
import { formatTwd } from '@/lib/format'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: '法規說明 / 合法清單',
  robots: { index: false },
}

interface Props {
  params: Promise<{ slug: string }>
}

/**
 * Printable single-page legal document for a product. Renders all 5 legal
 * sections + BSMI/SGS codes + product photo + key specs. Browser's native
 * "Save as PDF" turns this into a downloadable PDF — no server-side PDF
 * library needed.
 *
 * Auto-fires window.print() on load via inline script.
 */
export default async function ProductLegalDocPage({ params }: Props) {
  const { slug } = await params
  const detail = await getProductBySlug(slug)
  if (!detail) notFound()
  const { product, brand, images } = detail

  const today = new Date().toLocaleDateString('zh-Hant', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })

  const primary = images.find((i) => i.isPrimary) ?? images[0] ?? null

  return (
    <>
      <style>{`
        @page { size: A4; margin: 18mm 16mm; }
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .page-wrap { box-shadow: none !important; border: 0 !important; padding: 0 !important; }
        }
        .legal-doc { font-family: 'Noto Serif TC', 'Noto Serif JP', serif; }
      `}</style>

      <div className="legal-doc bg-white text-ink min-h-screen py-8 print:py-0">
        <div className="no-print max-w-3xl mx-auto px-4 mb-6 flex justify-between items-center bg-cream-100 border border-line rounded-md p-3">
          <p className="text-xs text-ink-soft">
            這是可列印的法規說明書 — 按下方按鈕儲存為 PDF。
          </p>
          <button
            onClick={() => window.print()}
            className="bg-ink text-cream px-4 py-2 rounded-md text-sm hover:bg-accent transition-colors"
            type="button"
          >
            下載 PDF / 列印
          </button>
        </div>

        <div className="page-wrap max-w-3xl mx-auto bg-white border border-line rounded-md p-10 print:p-0 print:max-w-none print:border-0">
          <header className="border-b-2 border-ink pb-4 mb-6">
            <p className="text-[11px] tracking-[0.3em] text-ink-soft mb-1">
              熙熙初日 · 日系選物店 · LEGAL DOCUMENT
            </p>
            <h1 className="font-serif text-2xl tracking-wide">商品法規說明書</h1>
            <p className="text-xs text-ink-soft mt-1">
              產出日期：{today} · 統一編號 60766849 · ccbabylife.com
            </p>
          </header>

          <section className="mb-6 grid grid-cols-[100px_1fr] gap-4 items-start">
            {primary && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl(primary.cfImageId)}
                alt={product.nameZh}
                className="w-24 h-24 object-cover border border-line rounded-md"
              />
            )}
            <div>
              <h2 className="font-serif text-lg mb-1">{product.nameZh}</h2>
              {product.nameJp && (
                <p className="text-xs text-ink-soft mb-1.5">{product.nameJp}</p>
              )}
              <dl className="text-xs grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
                {brand && (
                  <>
                    <dt className="text-ink-soft">品牌</dt>
                    <dd>{brand.nameZh}</dd>
                  </>
                )}
                <dt className="text-ink-soft">商品 SKU</dt>
                <dd className="font-mono">{product.slug}</dd>
                <dt className="text-ink-soft">售價</dt>
                <dd>{formatTwd(product.priceTwd)}</dd>
                <dt className="text-ink-soft">重量</dt>
                <dd>{product.weightG} g</dd>
                <dt className="text-ink-soft">商品類型</dt>
                <dd>
                  {product.stockType === 'preorder' ? '預購（10–14 天到貨）' : '現貨'}
                </dd>
              </dl>
            </div>
          </section>

          <Section title="法規分類">
            {product.legalCategory ? (
              <p>{product.legalCategory}</p>
            ) : (
              <p className="text-ink-soft italic text-xs">
                未設定（建議補上：非應施檢驗品 / 應施檢驗 / 食藥署備查 等）
              </p>
            )}
            {(product.bsmiCode || product.sgsReportNo) && (
              <ul className="text-sm space-y-0.5 mt-2">
                {product.bsmiCode && (
                  <li>
                    BSMI 字號：
                    <span className="font-mono">{product.bsmiCode}</span>
                  </li>
                )}
                {product.sgsReportNo && (
                  <li>
                    SGS / TFDA 報告編號：
                    <span className="font-mono">{product.sgsReportNo}</span>
                  </li>
                )}
              </ul>
            )}
          </Section>

          {product.legalChineseLabel && (
            <Section title="中文標示">
              <p className="whitespace-pre-wrap">{product.legalChineseLabel}</p>
            </Section>
          )}

          {product.legalShopPromise && (
            <Section title="熙熙初日的承諾">
              <p className="whitespace-pre-wrap">{product.legalShopPromise}</p>
            </Section>
          )}

          {product.legalShopLimits && (
            <Section title="誠實揭露 — 我們做不到">
              <p className="whitespace-pre-wrap">{product.legalShopLimits}</p>
            </Section>
          )}

          {product.legalReturnNote && (
            <Section title="退換貨條款">
              <p className="whitespace-pre-wrap">{product.legalReturnNote}</p>
            </Section>
          )}

          {!product.legalChineseLabel &&
            !product.legalShopPromise &&
            !product.legalShopLimits &&
            !product.legalReturnNote &&
            !product.legalCategory && (
              <p className="text-sm text-ink-soft italic mt-4">
                這項商品的結構化法規欄位尚未填寫。請聯繫我們的客服取得文件版本。
              </p>
            )}

          <section className="mt-8 pt-4 border-t border-line">
            <p className="text-[11px] text-ink-soft leading-relaxed">
              本文件由熙熙初日（ccbabylife.com）於商品上架時所填內容自動產出，
              用途為協助消費者、海關、收件親友核對商品法規身份。
              如商品實物與本文件不符，請於收貨 7 日內透過 LINE 客服反映，
              我們將協助處理（含全額退費 + 退貨運費由本店負擔）。
            </p>
            <p className="text-[11px] text-ink-soft mt-2">
              熙熙初日｜日系選物店 · 統一編號 60766849 · LINE @ccbabylife · hello@ccbabylife.com
            </p>
          </section>
        </div>

        <script
          dangerouslySetInnerHTML={{
            __html: `setTimeout(function(){window.print()},400);`,
          }}
        />
      </div>
    </>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="mb-5">
      <h3 className="font-serif text-base mb-2 border-l-4 border-ink pl-2">
        {title}
      </h3>
      <div className="text-sm leading-relaxed">{children}</div>
    </section>
  )
}
