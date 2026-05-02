import Link from 'next/link'
import { CsvImportForm } from '@/components/admin/CsvImportForm'

export default function ProductImportPage() {
  return (
    <div className="p-8 max-w-5xl">
      <nav className="text-xs text-ink-soft mb-4">
        <Link href="/admin/products" className="hover:text-ink">商品管理</Link>
        <span className="mx-2">/</span>
        <span>CSV 匯入</span>
      </nav>

      <h1 className="font-serif text-2xl mb-1">CSV 商品批次匯入</h1>
      <p className="text-ink-soft text-sm mb-8">
        從 Excel / Numbers 一次上多筆商品。Header 不分大小寫順序。
        slug 已存在會更新、不存在會新建。
      </p>

      <CsvImportForm />

      <section className="mt-12 bg-cream-100 border border-line rounded-lg p-6 text-sm">
        <h2 className="font-medium mb-3">CSV 範例</h2>
        <pre className="text-xs font-mono whitespace-pre-wrap break-all bg-white border border-line rounded p-3">
{`slug,nameZh,nameJp,brand,category,priceJpy,priceTwd,costJpy,weightG,stockType,minAgeMonths,maxAgeMonths,status,legalCheckPassed,description
pigeon-bottle-240,Pigeon 母乳實感奶瓶 240ml,ピジョン 母乳実感,pigeon,baby-essentials,2480,1200,2200,260,preorder,0,12,active,true,日本貝親經典款
combi-bath-thermo,Combi 洗澡溫度計,コンビ お風呂温度計,combi,baby-essentials,1280,650,1100,80,preorder,0,36,draft,false,矽膠浮水溫度計`}
        </pre>
        <p className="text-xs text-ink-soft mt-3 leading-relaxed">
          技巧：在 Excel / Numbers 編好內容 → 「另存新檔」選 CSV (UTF-8) → 上傳。
          brand / category 填 slug 或顯示名稱皆可（系統會幫妳對應）；
          legalCheckPassed 填 true / 是 / 1 即視為已通過。
        </p>
      </section>
    </div>
  )
}
