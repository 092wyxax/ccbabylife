/**
 * Hand-curated content for the four Japan-focused pages:
 *   - /trending  日本即時熱賣榜
 *   - /insta-picks  日本媽媽社群選書
 *   - /seasonal  日本各地季節限定
 *
 * Brand stories live in `src/db/schema/products.brands.description` and are
 * edited via the admin brand panel.
 *
 * These three lists are intentionally code-managed for Phase 1. When volume
 * grows, migrate to admin CRUD tables (see TODO at bottom).
 */

export type AvailabilityStatus = 'in_stock' | 'preorder' | 'restricted'

export interface TrendingProduct {
  rank: number
  source: 'rakuten_jp' | 'amazon_jp' | '@cosme' | 'mercari'
  nameJp: string
  nameZh: string
  priceJpy: number
  imageUrl?: string | null
  /**
   * If we already carry this exact product, link to /shop/[slug]. Otherwise
   * leave undefined and use availability to communicate why.
   */
  ourProductSlug?: string
  availability: AvailabilityStatus
  /** Reason / note shown next to "restricted" or special items. */
  note?: string
  category: string
}

export interface InstaPick {
  /** ISO date e.g. "2026-05-01" — used for sort + display. */
  publishedAt: string
  igHandle: string
  igFollowerCount: string
  postUrl: string
  originalQuoteJp: string
  translatedQuoteZh: string
  productNameZh: string
  /** Optional link to /shop/[slug] if we carry it. */
  ourProductSlug?: string
  imageUrl?: string | null
  notes?: string
}

export type Season = 'spring' | 'summer' | 'autumn' | 'winter'

export interface SeasonalPick {
  prefecture: string
  prefectureJp: string
  season: Season
  startMonth: number
  endMonth: number
  productNameZh: string
  productNameJp: string
  priceJpy?: number
  description: string
  ourProductSlug?: string
  imageUrl?: string | null
  /** A small evocative phrase — e.g. "桜花満開". */
  motif?: string
}

// ---------- Seed data ----------

export const TRENDING_PRODUCTS: TrendingProduct[] = [
  {
    rank: 1,
    source: 'rakuten_jp',
    nameJp: 'ピジョン 母乳実感哺乳びん 240ml',
    nameZh: 'Pigeon 母乳實感奶瓶 240ml',
    priceJpy: 1580,
    availability: 'in_stock',
    ourProductSlug: 'pigeon-bottle-240',
    category: '哺乳用品',
  },
  {
    rank: 2,
    source: 'amazon_jp',
    nameJp: 'アカチャンホンポ 純水 99% おしりふき 80枚×3',
    nameZh: 'Akachan Honpo 純水 99% 濕紙巾 80 抽 ×3',
    priceJpy: 398,
    availability: 'preorder',
    category: '日常消耗品',
  },
  {
    rank: 3,
    source: 'amazon_jp',
    nameJp: '明治 ほほえみ 800g',
    nameZh: '明治 Hohoemi 嬰兒奶粉 800g',
    priceJpy: 2180,
    availability: 'restricted',
    note: '依《嬰兒配方食品查驗登記辦法》不販售',
    category: '配方奶粉',
  },
  {
    rank: 4,
    source: 'rakuten_jp',
    nameJp: 'コンビ 抓握練習組 ベビーレーベル',
    nameZh: 'Combi Baby Label 抓握練習組',
    priceJpy: 2380,
    availability: 'preorder',
    category: '玩具',
  },
  {
    rank: 5,
    source: '@cosme',
    nameJp: 'リッチェル トライ ストローマグ 200ml',
    nameZh: 'Richell Try 學習杯 吸管型 200ml',
    priceJpy: 850,
    availability: 'in_stock',
    ourProductSlug: 'richell-straw-200',
    category: '餐具',
  },
  {
    rank: 6,
    source: 'amazon_jp',
    nameJp: 'コンビ つめ切りハサミ',
    nameZh: 'Combi 嬰兒指甲剪 剪刀型',
    priceJpy: 980,
    availability: 'preorder',
    category: '日常用品',
  },
  {
    rank: 7,
    source: 'rakuten_jp',
    nameJp: 'ペット用 國産 鶏ささみジャーキー',
    nameZh: '日本國產 雞胸肉條（寵物零食）',
    priceJpy: 680,
    availability: 'restricted',
    note: '含肉類動物食品 — 依《動物傳染病防治條例》不販售',
    category: '寵物用品',
  },
  {
    rank: 8,
    source: 'mercari',
    nameJp: 'aden + anais 包巾 4 枚セット',
    nameZh: 'aden + anais 紗布包巾 4 入',
    priceJpy: 4980,
    availability: 'preorder',
    category: '寢具',
  },
]

export const INSTA_PICKS: InstaPick[] = [
  {
    publishedAt: '2026-05-01',
    igHandle: 'miho_baby_mama',
    igFollowerCount: '3.2 萬',
    postUrl: 'https://www.instagram.com/p/example1',
    originalQuoteJp: '初めての爪切り、これが正解だった。先が丸くて怖くない。',
    translatedQuoteZh: '第一次幫寶寶剪指甲，這款就對了。前端是圓的不會怕。',
    productNameZh: 'Combi 嬰兒指甲剪 剪刀型',
    notes: '日本媽媽 IG 上 4 月最常被標的「新生兒必備」',
  },
  {
    publishedAt: '2026-04-25',
    igHandle: 'yamamoto_papa',
    igFollowerCount: '8.1 萬',
    postUrl: 'https://www.instagram.com/p/example2',
    originalQuoteJp: '角がない、塗料も食品レベル。安心して舐めさせられる。',
    translatedQuoteZh: '沒有銳角、塗料是食品等級。可以放心讓他咬。',
    productNameZh: 'Edute 木製抓握玩具',
    notes: '日本爸爸帳號最近一致推的木玩，安全規範細節寫超清楚',
  },
  {
    publishedAt: '2026-04-18',
    igHandle: 'hokkaido_mom',
    igFollowerCount: '1.5 萬',
    postUrl: 'https://www.instagram.com/p/example3',
    originalQuoteJp: '北海道の冬、これがないと外出できない。フリースの裏地が神。',
    translatedQuoteZh: '北海道的冬天沒這條包巾根本出不了門。內裡刷毛超神。',
    productNameZh: 'Combi mini 冬季厚款包巾',
    ourProductSlug: 'combi-mini-blanket-winter',
  },
]

export const SEASONAL_PICKS: SeasonalPick[] = [
  // ── Spring ──
  {
    prefecture: '東京',
    prefectureJp: '東京都',
    season: 'spring',
    startMonth: 3,
    endMonth: 4,
    productNameZh: 'Pigeon 櫻花季限定包巾',
    productNameJp: 'ピジョン 桜限定おくるみ',
    priceJpy: 2480,
    description: '每年 3 月櫻花前線開始上市，4 月底前售完。粉桜印花，東京限定通路販售。',
    motif: '桜花満開',
  },
  {
    prefecture: '京都',
    prefectureJp: '京都府',
    season: 'spring',
    startMonth: 3,
    endMonth: 5,
    productNameZh: 'Akachan Honpo 鯉魚旗系列圍兜',
    productNameJp: 'アカチャンホンポ こいのぼり よだれかけ',
    priceJpy: 980,
    description: '5/5 兒童節（こどもの日）紀念品，京都本店限定發售。男孩家庭最愛。',
    motif: '端午の節句',
  },
  // ── Summer ──
  {
    prefecture: '沖繩',
    prefectureJp: '沖縄県',
    season: 'summer',
    startMonth: 6,
    endMonth: 8,
    productNameZh: '沖繩限定 涼感冷敷包巾',
    productNameJp: '沖縄限定 ひんやりおくるみ',
    priceJpy: 1680,
    description: '沖繩夏季高溫設計，內含冷感纖維。當地媽媽外出車內必備。',
    motif: '南国の夏',
  },
  {
    prefecture: '東京',
    prefectureJp: '東京都',
    season: 'summer',
    startMonth: 7,
    endMonth: 8,
    productNameZh: '夏祭限定餐具組（金魚）',
    productNameJp: '夏祭り限定 食器セット 金魚柄',
    priceJpy: 2180,
    description: '7 月隅田川花火大會周邊發售，金魚浮繪印花。',
    motif: '隅田川花火',
  },
  // ── Autumn ──
  {
    prefecture: '北海道',
    prefectureJp: '北海道',
    season: 'autumn',
    startMonth: 9,
    endMonth: 11,
    productNameZh: '北海道限定 紅葉印花圍兜',
    productNameJp: '北海道限定 紅葉柄スタイ',
    priceJpy: 850,
    description: '北海道 9–11 月秋季限定。札幌大丸百貨母嬰專櫃獨家。',
    motif: '紅葉狩り',
  },
  {
    prefecture: '東京',
    prefectureJp: '東京都',
    season: 'autumn',
    startMonth: 10,
    endMonth: 10,
    productNameZh: '萬聖節限量奶嘴鏈（南瓜）',
    productNameJp: 'ハロウィン限定 おしゃぶりホルダー',
    priceJpy: 780,
    description: '10 月限定。Akachan Honpo 全國門市。',
    motif: 'Halloween',
  },
  // ── Winter ──
  {
    prefecture: '東京',
    prefectureJp: '東京都',
    season: 'winter',
    startMonth: 11,
    endMonth: 12,
    productNameZh: '聖誕限定禮盒（紗布巾 + 圍兜）',
    productNameJp: 'クリスマス限定ギフトセット',
    priceJpy: 3280,
    description: '11 月底上架，12/24 前售完。包裝就是禮盒，送彌月禮首選。',
    motif: 'メリークリスマス',
  },
  {
    prefecture: '京都',
    prefectureJp: '京都府',
    season: 'winter',
    startMonth: 12,
    endMonth: 1,
    productNameZh: '柚子湯入浴包（嬰兒可用）',
    productNameJp: '柚子湯入浴剤 ベビー',
    priceJpy: 580,
    description: '12/22 冬至「柚子湯」傳統。京都老舖製造，嬰兒可用低敏配方。',
    motif: '冬至・柚子湯',
  },
]

// ---------- Brand stories ----------

/**
 * Long-form brand stories keyed by brand slug. The brand admin panel still
 * holds the short `description`; this is the rich page content. Markdown
 * paragraphs separated by blank lines.
 */
export const BRAND_STORIES: Record<string, BrandStory> = {
  pigeon: {
    foundedYear: 1957,
    headline: '60 年陪日本媽媽長大的奶瓶品牌',
    story: `1957 年創業於東京，最初只做一支「母乳實感哺乳びん」。
創辦人中田徹三的初衷是：「奶瓶要讓寶寶喝起來像母乳」。
這支奶瓶的奶嘴流速、握力、唇形貼合度，都是與日本婦產科共同開發。

到今天，Pigeon 在日本嬰兒奶瓶市佔率超過 60%。
日本婦產科出院前的「新生兒贈品」清單裡幾乎都有它。
我們選 Pigeon 的理由很單純：60 年的數據與信任，比任何宣傳都有說服力。`,
    facts: [
      '1957 年創業（東京都）',
      '日本嬰兒奶瓶市佔 60%+',
      '母乳實感系列累計賣出 5 億支',
      '所有產品經 ISO 13485 醫療器材等級認證',
    ],
  },
  combi: {
    foundedYear: 1957,
    headline: '從一台手推車起家的 70 年品牌',
    story: `Combi 最早做的是嬰兒推車。1961 年推出日本第一台「可摺疊嬰兒車」，
徹底改變日本媽媽外出的方式。

之後產品線擴張到餐椅、玩具、抓握練習組、指甲剪⋯⋯
但 Combi 的核心始終是「**安全 + 細節**」。
他們的指甲剪刀型，邊緣是圓的、刀刃只露出 2mm，
這種細節是台灣本地廠商不會做的。`,
    facts: [
      '1957 年創業（埼玉縣）',
      '日本嬰兒推車市場前三大',
      'mini 系列為日本超商通路獨家',
      '2023 年新增 baby label 副牌（更平價）',
    ],
  },
  richell: {
    foundedYear: 1956,
    headline: '塑膠技術專業 70 年的家族企業',
    story: `Richell 從工業塑膠製品起家，1956 年創立於新潟。
70 年代開始進入嬰兒用品領域，主打「**塑膠製品的耐用與機能性**」。

Try 學習杯系列是 Richell 的代表作 —
吸管設計成「不會反流」、握把是 360° 旋轉、瓶身有刻度。
這些功能在台灣賣 NT$300 的學習杯都做不到。`,
    facts: [
      '1956 年創業（新潟縣）',
      '寵物用品也很強（D.O.G 系列）',
      '日本國內塑膠射出工廠 100% 自有',
      '海外經銷 30+ 國家',
    ],
  },
  doggyman: {
    foundedYear: 1969,
    headline: '日本寵物用品的開拓者',
    story: `1969 年創業於大阪。Doggy Man 是日本第一家做「室內寵物用品」的品牌。

當時日本人多養戶外狗，Doggy Man 看見「室內小型犬」興起的趨勢，
率先做小型犬零食、室內潔牙骨、抓板。
今天 Doggy Man 在日本寵物超市的市佔率超過 40%。

⚠ 我們**不販售**含肉類的 Doggy Man 商品（依台灣動物傳染病防治條例）。
非含肉類產品（如玩具、清潔用品、潔牙骨）正常代購。`,
    facts: [
      '1969 年創業（大阪府）',
      '日本寵物零食品牌前三',
      '海外進口受台灣動植物防疫檢疫局規範',
      '本店僅代購非含肉類商品',
    ],
  },
}

export interface BrandStory {
  foundedYear: number
  headline: string
  /** Markdown-ish, paragraphs split by blank line */
  story: string
  facts: string[]
}

// TODO Phase 2: migrate these arrays to drizzle tables `trending_products`,
// `insta_picks`, `seasonal_picks` with admin CRUD pages so the data isn't
// locked behind a deploy.
