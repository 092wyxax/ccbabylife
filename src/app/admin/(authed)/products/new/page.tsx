import Link from 'next/link'
import { ProductForm, type ProductFormDefaults } from '@/components/admin/ProductForm'
import {
  listAllBrands,
  listAllCategories,
} from '@/server/services/ProductService'
import { createProductAction } from '@/server/actions/products'
import {
  extractProductFromUrl,
  enrichExtraction,
  AIKeyMissingError,
  type ProductExtraction,
  type ProductEnrichment,
} from '@/server/services/AIAssistService'
import { calculatePrice } from '@/lib/pricing'

interface Props {
  searchParams: Promise<{ fromUrl?: string }>
}

interface AssistOutcome {
  url: string
  result?: ProductExtraction
  enrichment?: ProductEnrichment
  suggestedTwd?: number
  matchedCategoryName?: string
  error?: string
}

export default async function NewProductPage({ searchParams }: Props) {
  const { fromUrl } = await searchParams
  const [brands, categories] = await Promise.all([
    listAllBrands(),
    listAllCategories(),
  ])

  let assist: AssistOutcome | null = null
  let defaults: ProductFormDefaults | undefined

  if (fromUrl) {
    assist = { url: fromUrl }
    try {
      const result = await extractProductFromUrl(fromUrl)
      assist.result = result

      // Suggest TWD price using PRICING_FORMULA (default category 母嬰用品).
      let suggestedTwd: number | undefined
      if (result.weightG) {
        const calc = calculatePrice({
          priceJpy: result.priceJpy,
          weightG: result.weightG,
          category: 'baby_essentials',
        })
        if (!calc.needsManualQuote) {
          suggestedTwd = calc.finalTwd
          assist.suggestedTwd = suggestedTwd
        }
      }

      // Phase 1: enrich (copy / age / category / not-suitable-for).
      // Failures here don't break extraction — we still prefill what we have.
      let enrichment: ProductEnrichment | null = null
      try {
        enrichment = await enrichExtraction(
          result,
          categories.map((c) => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
            minAgeMonths: c.minAgeMonths,
            maxAgeMonths: c.maxAgeMonths,
          }))
        )
      } catch (e) {
        // Log but don't surface — extraction prefill is still useful.
        console.warn('[products/new] enrichExtraction failed:', e)
      }

      if (enrichment) {
        assist.enrichment = enrichment
        if (enrichment.categoryId) {
          const cat = categories.find((c) => c.id === enrichment.categoryId)
          assist.matchedCategoryName = cat?.name
        }
      }

      // Build description from enrichment if available
      let description = result.description
      if (enrichment) {
        const parts = [enrichment.seoDescription]
        if (enrichment.sellingPoints.length > 0) {
          parts.push('', '【賣點】', ...enrichment.sellingPoints)
        }
        description = parts.join('\n')
      }

      defaults = {
        nameZh: enrichment?.title ?? result.nameZh,
        nameJp: result.nameJp,
        priceJpy: result.priceJpy,
        priceTwd: suggestedTwd,
        weightG: result.weightG ?? undefined,
        description,
        sourceUrl: fromUrl,
        minAgeMonths: enrichment?.minAgeMonths ?? undefined,
        maxAgeMonths: enrichment?.maxAgeMonths ?? undefined,
        categoryId: enrichment?.categoryId ?? undefined,
        notSuitableFor: enrichment?.notSuitableFor ?? undefined,
        // brand 不自動指派（避免錯配既有 brand id）；下方面板提示太太手動選
        // imageUrl 沒辦法直接帶（form 用 file upload），下方面板顯示
      }
    } catch (e) {
      assist.error =
        e instanceof AIKeyMissingError
          ? e.message
          : `自動建檔失敗：${e instanceof Error ? e.message : String(e)}`
    }
  }

  return (
    <div className="p-8 max-w-3xl">
      <nav className="text-xs text-ink-soft mb-4">
        <Link href="/admin/products" className="hover:text-ink">商品管理</Link>
        <span className="mx-2">/</span>
        <span>新增</span>
      </nav>

      <h1 className="font-serif text-2xl mb-1">新增商品</h1>
      <p className="text-ink-soft text-sm mb-6">
        建立後預設為「草稿」，確認資訊與法規檢核後再切換為「上架中」。
      </p>

      <AIAssistantPanel assist={assist} />

      <ProductForm
        mode="create"
        brands={brands}
        categories={categories}
        defaults={defaults}
        action={createProductAction}
      />
    </div>
  )
}

function AIAssistantPanel({ assist }: { assist: AssistOutcome | null }) {
  return (
    <section className="mb-8 bg-cream-100 border border-line rounded-lg p-5">
      <h2 className="font-serif text-base mb-1">從日本網址自動建檔（AI）</h2>
      <p className="text-xs text-ink-soft mb-3">
        貼上樂天 / Amazon JP / ZOZO 商品連結，Claude 會抓網頁、抽出資料、
        生成中文標題 / 賣點 / 月齡 / 品類 / 不適合誰用，並算建議台幣售價。
        <strong>請務必檢查結果，AI 偶爾會抓錯。</strong>
      </p>

      <form method="GET" action="/admin/products/new" className="flex gap-2">
        <input
          type="url"
          name="fromUrl"
          defaultValue={assist?.url ?? ''}
          placeholder="https://item.rakuten.co.jp/..."
          className="flex-1 border border-line rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:border-ink"
        />
        <button
          type="submit"
          className="bg-ink text-cream px-4 py-2 rounded-md text-sm hover:bg-accent transition-colors whitespace-nowrap"
        >
          ✨ 解析並預填
        </button>
      </form>

      {assist?.error && (
        <p className="mt-3 text-xs text-danger leading-relaxed">{assist.error}</p>
      )}

      {assist?.result && (
        <div className="mt-3 text-xs leading-relaxed bg-success/10 border border-success/30 p-3 rounded-md space-y-3">
          <div>
            <p className="font-medium text-ink mb-1">✓ 已預填，請檢查下方表單</p>
            <ul className="space-y-0.5 text-ink-soft">
              <li>原始品名：{assist.result.nameZh}（{assist.result.nameJp}）</li>
              {assist.enrichment && (
                <li>
                  <strong className="text-ink">AI 建議標題：</strong>
                  {assist.enrichment.title}
                </li>
              )}
              <li>
                品牌：{assist.result.brand ?? '未識別'} — 請從下方下拉手動選定既有品牌
              </li>
              <li>日幣定價：¥{assist.result.priceJpy.toLocaleString()}</li>
              <li>
                重量：
                {assist.result.weightG != null
                  ? `${assist.result.weightG} g`
                  : '未提供 — 請手動填'}
              </li>
              {assist.suggestedTwd && (
                <li>建議台幣售價（公式）：NT${assist.suggestedTwd}</li>
              )}
              {assist.enrichment && (
                <>
                  <li>
                    AI 推測月齡：
                    {assist.enrichment.minAgeMonths != null ||
                    assist.enrichment.maxAgeMonths != null
                      ? `${assist.enrichment.minAgeMonths ?? 0}–${assist.enrichment.maxAgeMonths ?? '∞'} 個月`
                      : '無月齡（寵物 / 通用）'}
                  </li>
                  <li>
                    AI 匹配分類：{assist.matchedCategoryName ?? '無合適分類 — 請手動選'}
                  </li>
                </>
              )}
              {assist.result.imageUrl && (
                <li>
                  AI 找到主圖：
                  <a
                    href={assist.result.imageUrl}
                    target="_blank"
                    rel="noopener"
                    className="underline hover:text-accent ml-1"
                  >
                    另存後上傳到下方圖片區
                  </a>
                </li>
              )}
            </ul>
          </div>

          {assist.enrichment && (
            <>
              <details className="border-t border-line/50 pt-2">
                <summary className="cursor-pointer text-ink-soft hover:text-ink font-medium">
                  📝 AI 生成的 IG / Threads 文案初稿（點開複製給太太修潤）
                </summary>
                <pre className="mt-2 p-2 bg-white border border-line rounded text-xs whitespace-pre-wrap font-sans">
                  {assist.enrichment.igDraft}
                </pre>
              </details>

              {assist.enrichment.warnings.length > 0 && (
                <div className="border-t border-line/50 pt-2 text-warning">
                  <p className="font-medium mb-1">⚠ AI 提醒</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    {assist.enrichment.warnings.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}

          <p className="text-ink-soft pt-2 border-t border-line/50">
            ⚠ <strong>法規檢核 / 14 天試用筆記 / 上架狀態</strong> 仍需人工填寫，AI 不能代替媽媽的真實感受。
          </p>
        </div>
      )}
    </section>
  )
}
