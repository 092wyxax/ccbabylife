/**
 * Seed the four brands referenced in BRAND_STORIES into the brands table.
 * Idempotent — re-running will only insert missing slugs.
 */
import { config } from 'dotenv'
config({ path: '.env.local' })

import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { and, eq } from 'drizzle-orm'
import { brands } from '../src/db/schema'
import { DEFAULT_ORG_ID } from '../src/db/schema/organizations'

const SEED_BRANDS = [
  { slug: 'pigeon', nameZh: 'Pigeon', nameJp: 'ピジョン', description: '日本嬰兒奶瓶市佔第一，60 年的母乳實感系列。' },
  { slug: 'combi', nameZh: 'Combi', nameJp: 'コンビ', description: '日本嬰兒推車先驅，安全與細節並重。' },
  { slug: 'richell', nameZh: 'Richell', nameJp: 'リッチェル', description: '塑膠射出 70 年自有工廠，Try 學習杯系列代表作。' },
  { slug: 'doggyman', nameZh: 'Doggy Man', nameJp: 'ドギーマン', description: '日本室內寵物用品開拓者，本店僅代購非含肉類商品。' },
]

async function main() {
  const client = postgres(process.env.DATABASE_URL!, { prepare: false })
  const db = drizzle(client)

  for (const b of SEED_BRANDS) {
    const existing = await db
      .select()
      .from(brands)
      .where(and(eq(brands.orgId, DEFAULT_ORG_ID), eq(brands.slug, b.slug)))
      .limit(1)

    if (existing[0]) {
      await db
        .update(brands)
        .set({ nameZh: b.nameZh, nameJp: b.nameJp, description: b.description })
        .where(eq(brands.id, existing[0].id))
      console.log(`  updated: ${b.slug}`)
    } else {
      await db.insert(brands).values({ orgId: DEFAULT_ORG_ID, ...b })
      console.log(`  inserted: ${b.slug}`)
    }
  }

  await client.end()
  console.log(`Done. ${SEED_BRANDS.length} brands seeded.`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
