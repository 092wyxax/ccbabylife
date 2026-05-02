import Link from 'next/link'
import { ProductForm, type ProductFormDefaults } from '@/components/admin/ProductForm'
import {
  listAllBrands,
  listAllCategories,
} from '@/server/services/ProductService'
import { createProductAction } from '@/server/actions/products'
import {
  extractProductFromUrl,
  AIKeyMissingError,
  type ProductExtraction,
} from '@/server/services/AIAssistService'
import { calculatePrice } from '@/lib/pricing'

interface Props {
  searchParams: Promise<{ fromUrl?: string }>
}

interface AssistOutcome {
  url: string
  result?: ProductExtraction
  suggestedTwd?: number
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

      // Suggest TWD price using docs/PRICING_FORMULA.md (default category母嬰用品).
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

      defaults = {
        nameZh: result.nameZh,
        nameJp: result.nameJp,
        priceJpy: result.priceJpy,
        priceTwd: suggestedTwd,
        weightG: result.weightG ?? undefined,
        description: result.description,
        sourceUrl: fromUrl,
        // category / brand 不自動指派，留給太太從下拉選
        // imageUrl 沒辦法直接帶（form 用 file upload），下方面板顯示給她另存
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
        貼上樂天 / Amazon JP / ZOZO 商品連結，Claude 會抓網頁、抽出品名、日幣售價、重量等，
        並用 PRICING_FORMULA 算建議台幣售價。請務必檢查抽取結果。
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
          解析並預填
        </button>
      </form>

      {assist?.error && (
        <p className="mt-3 text-xs text-danger leading-relaxed">{assist.error}</p>
      )}

      {assist?.result && (
        <div className="mt-3 text-xs leading-relaxed bg-success/10 border border-success/30 p-3 rounded-md">
          <p className="font-medium text-ink mb-1">✓ 已預填，請檢查下方表單</p>
          <ul className="space-y-0.5 text-ink-soft">
            <li>品名：{assist.result.nameZh}（{assist.result.nameJp}）</li>
            <li>品牌：{assist.result.brand ?? '未識別 — 請手動選'}</li>
            <li>日幣定價：¥{assist.result.priceJpy.toLocaleString()}</li>
            <li>重量：{assist.result.weightG != null ? `${assist.result.weightG} g` : '未提供 — 請手動填'}</li>
            {assist.suggestedTwd && (
              <li>建議台幣售價（公式）：NT${assist.suggestedTwd}</li>
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
          <p className="mt-2 text-ink-soft">
            ⚠ 法規檢核 / 使用心得 / 上架狀態 仍需人工填寫。
          </p>
        </div>
      )}
    </section>
  )
}
