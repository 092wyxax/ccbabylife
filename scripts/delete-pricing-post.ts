import { config } from 'dotenv'
config({ path: '.env.local' })

import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { and, eq } from 'drizzle-orm'
import { createClient } from '@supabase/supabase-js'
import { posts } from '../src/db/schema/posts'
import { DEFAULT_ORG_ID } from '../src/db/schema/organizations'

const SLUG = 'pricing-formula-transparent'

async function main() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const client = postgres(process.env.DATABASE_URL!, { prepare: false })
  const db = drizzle(client)

  const { error: storageErr } = await supabase.storage
    .from('product-images')
    .remove([`posts/${SLUG}.png`])
  console.log(`Storage delete: ${storageErr ? `error: ${storageErr.message}` : 'ok'}`)

  const deleted = await db
    .delete(posts)
    .where(and(eq(posts.orgId, DEFAULT_ORG_ID), eq(posts.slug, SLUG)))
    .returning({ id: posts.id })
  console.log(`DB delete: ${deleted.length} row(s)`)

  await client.end()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
