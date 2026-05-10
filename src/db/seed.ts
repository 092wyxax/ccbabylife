import { config } from 'dotenv'
config({ path: '.env.local' })

import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { sql } from 'drizzle-orm'
import {
  organizations,
  DEFAULT_ORG_ID,
} from './schema/organizations'
import { brands, categories, products, productImages } from './schema/products'

const SAMPLE_BRANDS = [
  { slug: 'pigeon', nameZh: 'Pigeon 貝親', nameJp: 'ピジョン' },
  { slug: 'combi', nameZh: 'Combi', nameJp: 'コンビ' },
  { slug: 'richell', nameZh: 'Richell 利其爾', nameJp: 'リッチェル' },
  { slug: 'doggyman', nameZh: 'Doggy Man', nameJp: 'ドギーマン' },
]

const SAMPLE_CATEGORIES = [
  { slug: 'baby-essentials', name: '母嬰用品', minAge: 0, maxAge: 36 },
  { slug: 'baby-apparel', name: '母嬰服飾', minAge: 0, maxAge: 36 },
  { slug: 'baby-living', name: '母嬰生活', minAge: 0, maxAge: 36 },
  { slug: 'pet-supplies', name: '寵物用品', minAge: null, maxAge: null },
]

interface SampleProduct {
  slug: string
  nameZh: string
  nameJp: string
  brandSlug: string
  categorySlug: string
  priceJpy: number
  priceTwd: number
  costJpy: number
  weightG: number
  minAgeMonths: number | null
  maxAgeMonths: number | null
  stockType: 'preorder' | 'in_stock'
  stockQuantity: number
  description: string
  useExperience: string
  imageUrl: string
}

const SAMPLE_PRODUCTS: SampleProduct[] = [
  {
    slug: 'pigeon-gauze-towel-30',
    nameZh: 'Pigeon 純棉紗布巾 30×30cm（10 入）',
    nameJp: 'ピジョン ガーゼハンカチ 10枚組',
    brandSlug: 'pigeon',
    categorySlug: 'baby-essentials',
    priceJpy: 980,
    priceTwd: 480,
    costJpy: 880,
    weightG: 80,
    minAgeMonths: 0,
    maxAgeMonths: 36,
    stockType: 'preorder',
    stockQuantity: 0,
    description: '日本貝親經典純棉紗布巾，吸水性佳、洗多次不變形。一組 10 入適合新生兒到幼兒期使用。',
    useExperience: '我家寶寶從新生兒用到 1 歲半。\n優點是吸水快、洗多次不變形。\n缺點是純白色易染色，要分洗。\n適合：新生兒、純棉敏感肌寶寶。',
    imageUrl: 'https://images.unsplash.com/photo-1522771930-78848d9293e8?w=800&h=800&fit=crop',
  },
  {
    slug: 'combi-teether-banana',
    nameZh: 'Combi 香蕉造型固齒器',
    nameJp: 'コンビ バナナ型 歯固め',
    brandSlug: 'combi',
    categorySlug: 'baby-essentials',
    priceJpy: 1280,
    priceTwd: 690,
    costJpy: 1100,
    weightG: 120,
    minAgeMonths: 4,
    maxAgeMonths: 18,
    stockType: 'preorder',
    stockQuantity: 0,
    description: '矽膠軟硬適中，表面有起伏紋路設計。日本 Combi 出品，符合 BSMI 標準。',
    useExperience: '我家寶寶從 4 個月開始用。\n優點：軟硬剛好、香蕉造型好抓握、可冷藏舒緩牙齦。\n缺點：吊環設計繫在推車上會稍鬆，需自加束帶。\n適合：4–18 個月開始長牙的寶寶。',
    imageUrl: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=800&h=800&fit=crop',
  },
  {
    slug: 'richell-trail-cup-200',
    nameZh: 'Richell 三階段練習杯 200ml',
    nameJp: 'リッチェル トライ ストローマグ',
    brandSlug: 'richell',
    categorySlug: 'baby-essentials',
    priceJpy: 1580,
    priceTwd: 850,
    costJpy: 1380,
    weightG: 200,
    minAgeMonths: 6,
    maxAgeMonths: 36,
    stockType: 'in_stock',
    stockQuantity: 8,
    description: '從吸管杯到直飲杯三階段轉換，適合 6 個月以上寶寶練習自主喝水。耐摔、可拆洗。',
    useExperience: '我家寶寶 7 個月開始用，1 歲多還在用。\n優點：杯底防滑、漏水機率低、零件好洗。\n缺點：吸管偶爾會被咬扁，要備換管。\n推薦給戒奶瓶過渡期的寶寶。',
    imageUrl: 'https://images.unsplash.com/photo-1591561954555-607968c989ab?w=800&h=800&fit=crop',
  },
  {
    slug: 'pigeon-baby-soap',
    nameZh: 'Pigeon 嬰兒沐浴泡泡 500ml',
    nameJp: 'ピジョン 全身泡ソープ',
    brandSlug: 'pigeon',
    categorySlug: 'baby-essentials',
    priceJpy: 750,
    priceTwd: 380,
    costJpy: 650,
    weightG: 580,
    minAgeMonths: 0,
    maxAgeMonths: 36,
    stockType: 'preorder',
    stockQuantity: 0,
    description: '弱酸性、無香料、無酒精。新生兒可用，泡沫綿密。日本本土版包裝。',
    useExperience: '我家寶寶用了一年多，沒過敏。\n泡沫好沖、不澀眼。\n大瓶補充裝比小瓶划算。',
    imageUrl: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&h=800&fit=crop',
  },
  {
    slug: 'combi-stroller-fan',
    nameZh: 'Combi 推車涼感風扇（USB 充電）',
    nameJp: 'コンビ ベビーカー扇風機',
    brandSlug: 'combi',
    categorySlug: 'baby-living',
    priceJpy: 3480,
    priceTwd: 1850,
    costJpy: 3000,
    weightG: 400,
    minAgeMonths: 0,
    maxAgeMonths: 60,
    stockType: 'preorder',
    stockQuantity: 0,
    description: '可夾、可立、可掛三用。3 段風速，靜音設計不嚇到寶寶。',
    useExperience: '夏天救星。我家寶寶推車外出必備。\n注意：扇葉是矽膠材質，寶寶手伸進去也不會傷。\n但充電線單獨買比較好。',
    imageUrl: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=800&h=800&fit=crop',
  },
  {
    slug: 'richell-snack-jar',
    nameZh: 'Richell 點心罐攜帶盒',
    nameJp: 'リッチェル おやつケース',
    brandSlug: 'richell',
    categorySlug: 'baby-living',
    priceJpy: 880,
    priceTwd: 460,
    costJpy: 760,
    weightG: 90,
    minAgeMonths: 8,
    maxAgeMonths: 36,
    stockType: 'preorder',
    stockQuantity: 0,
    description: '雙層分隔設計，上層放餅乾、下層放葡萄乾。耐摔不易破。',
    useExperience: '出門必帶。\n我家寶寶會自己抓著吃。\n小提醒：洗碗機可以洗，但建議手洗保色。',
    imageUrl: 'https://images.unsplash.com/photo-1519824145371-296894a0daa9?w=800&h=800&fit=crop',
  },
  {
    slug: 'doggyman-rope-toy',
    nameZh: 'Doggy Man 純棉編織狗狗繩玩具',
    nameJp: 'ドギーマン コットンロープ',
    brandSlug: 'doggyman',
    categorySlug: 'pet-supplies',
    priceJpy: 580,
    priceTwd: 320,
    costJpy: 480,
    weightG: 80,
    minAgeMonths: null,
    maxAgeMonths: null,
    stockType: 'in_stock',
    stockQuantity: 12,
    description: '100% 純棉編織，無染料、不易脫線。適合中小型犬潔齒、磨牙。',
    useExperience: '朋友家的柴犬咬了三個月還很堅固。\n比台灣常見的便宜版扎實很多。',
    imageUrl: 'https://images.unsplash.com/photo-1583511655802-41095e8eef5e?w=800&h=800&fit=crop',
  },
  {
    slug: 'pigeon-baby-wipes',
    nameZh: 'Pigeon 純水嬰兒濕巾 80 抽 × 3',
    nameJp: 'ピジョン おしりナップ 純水',
    brandSlug: 'pigeon',
    categorySlug: 'baby-essentials',
    priceJpy: 880,
    priceTwd: 460,
    costJpy: 750,
    weightG: 750,
    minAgeMonths: 0,
    maxAgeMonths: 36,
    stockType: 'preorder',
    stockQuantity: 0,
    description: '99% 純水、無香料、無酒精。蓋子設計不漏水，柔軟厚實。',
    useExperience: '我家寶寶從新生兒用到現在。\n比台灣藥局版本厚、不容易破。\n包裝蓋偶爾會卡住，是小缺點。',
    imageUrl: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=800&h=800&fit=crop',
  },
]

async function seed() {
  const url = process.env.DATABASE_URL_DIRECT ?? process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL not set')

  const client = postgres(url, { max: 1, prepare: false })
  const db = drizzle(client)

  console.log('1/4 Default organization...')
  await db
    .insert(organizations)
    .values({
      id: DEFAULT_ORG_ID,
      slug: 'default',
      name: '日系選物店',
      plan: 'owner',
      billingStatus: 'active',
    })
    .onConflictDoNothing({ target: organizations.id })

  console.log('2/4 Brands...')
  const brandRows = await db
    .insert(brands)
    .values(
      SAMPLE_BRANDS.map((b) => ({
        orgId: DEFAULT_ORG_ID,
        slug: b.slug,
        nameZh: b.nameZh,
        nameJp: b.nameJp,
      }))
    )
    .onConflictDoNothing()
    .returning()

  // re-fetch in case onConflictDoNothing skipped existing
  const allBrands = await db.select().from(brands).where(sql`org_id = ${DEFAULT_ORG_ID}`)
  const brandBySlug = new Map(allBrands.map((b) => [b.slug, b]))

  console.log('3/4 Categories...')
  await db
    .insert(categories)
    .values(
      SAMPLE_CATEGORIES.map((c) => ({
        orgId: DEFAULT_ORG_ID,
        slug: c.slug,
        name: c.name,
        minAgeMonths: c.minAge,
        maxAgeMonths: c.maxAge,
      }))
    )
    .onConflictDoNothing()
  const allCategories = await db
    .select()
    .from(categories)
    .where(sql`org_id = ${DEFAULT_ORG_ID}`)
  const categoryBySlug = new Map(allCategories.map((c) => [c.slug, c]))

  console.log('4/4 Products + images...')
  for (const p of SAMPLE_PRODUCTS) {
    const brand = brandBySlug.get(p.brandSlug)
    const category = categoryBySlug.get(p.categorySlug)
    if (!brand || !category) {
      console.warn(`Skipping ${p.slug}: missing brand/category`)
      continue
    }

    const existing = await db
      .select()
      .from(products)
      .where(sql`org_id = ${DEFAULT_ORG_ID} AND slug = ${p.slug}`)
      .limit(1)
    if (existing.length > 0) {
      continue
    }

    const [inserted] = await db
      .insert(products)
      .values({
        orgId: DEFAULT_ORG_ID,
        slug: p.slug,
        nameZh: p.nameZh,
        nameJp: p.nameJp,
        brandId: brand.id,
        categoryId: category.id,
        description: p.description,
        useExperience: p.useExperience,
        minAgeMonths: p.minAgeMonths,
        maxAgeMonths: p.maxAgeMonths,
        priceJpy: p.priceJpy,
        priceTwd: p.priceTwd,
        costJpy: p.costJpy,
        weightG: p.weightG,
        stockType: p.stockType,
        stockQuantity: p.stockQuantity,
        status: 'active',
        legalCheckPassed: true,
        legalNotes: '純棉 / 矽膠等材質，無查驗登記需求',
      })
      .returning()

    await db.insert(productImages).values({
      orgId: DEFAULT_ORG_ID,
      productId: inserted.id,
      cfImageId: p.imageUrl,
      altText: p.nameZh,
      isPrimary: true,
      sortOrder: 0,
    })
  }

  const productCount = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(products)
    .where(sql`org_id = ${DEFAULT_ORG_ID}`)

  console.log(`Done. Total products: ${productCount[0].count}`)
  await client.end()
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
