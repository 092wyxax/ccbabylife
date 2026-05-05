/**
 * Generate thematic hero images for journal posts via Cloudflare Workers AI
 * (Stable Diffusion XL), upload to Supabase Storage, and update the post's
 * heroImage.
 *
 * Run:  pnpm tsx scripts/generate-post-covers.ts
 *
 * Requires .env.local: CF_ACCOUNT_ID, CF_WORKERS_TOKEN,
 * NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DATABASE_URL
 */
import { config } from 'dotenv'
config({ path: '.env.local' })

import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { and, eq } from 'drizzle-orm'
import { createClient } from '@supabase/supabase-js'
import { posts } from '../src/db/schema/posts'
import { DEFAULT_ORG_ID } from '../src/db/schema/organizations'

const PROMPTS: Record<string, string> = {
  'why-preorder-not-stock':
    'A small wrapped white gift box tied with brown twine and a kraft paper tag, sitting alone on a smooth wooden table next to a folded linen cloth, soft warm window light from the side, top-down close-up, minimal Japanese aesthetic, no humans, no hands, no people, no text',
  'newborn-0-3-months-essentials':
    'A single neatly folded soft white cotton baby onesie placed next to a small wooden teether ring on a cream linen cloth, top-down view, soft directional natural light, minimal Japanese baby product photography, no humans, no hands, no text',
  'pigeon-bottle-6-months-review':
    'A clean white baby feeding bottle standing on a soft beige cloth, blurred natural background, product photography, soft window light, minimal Japanese aesthetic, no humans, no hands',
  'gauze-cloth-5-brands-test':
    'Neatly folded stack of white cotton gauze cloths on a natural wood surface, soft window light, top-down view, minimal Japanese aesthetic, no humans, no hands, no text',
  'why-no-baby-formula':
    'A traditional Japanese red hanko stamp resting on a stack of cream paper documents on a dark walnut desk, soft warm directional light, minimal aesthetic, top-down close-up, no humans, no hands, no text, no logos',
}

const MODEL = '@cf/stabilityai/stable-diffusion-xl-base-1.0'

async function generate(prompt: string): Promise<Buffer> {
  const accountId = process.env.CF_ACCOUNT_ID
  const token = process.env.CF_WORKERS_TOKEN || process.env.CF_IMAGES_TOKEN
  if (!accountId || !token) {
    throw new Error('CF_ACCOUNT_ID and CF_WORKERS_TOKEN (or CF_IMAGES_TOKEN) must be set in .env.local')
  }

  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${MODEL}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt, num_steps: 20, width: 1024, height: 576 }),
    }
  )

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Cloudflare AI ${res.status}: ${text.slice(0, 300)}`)
  }
  const ab = await res.arrayBuffer()
  return Buffer.from(ab)
}

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const dbUrl = process.env.DATABASE_URL
  if (!supabaseUrl || !serviceKey || !dbUrl) {
    throw new Error('Missing Supabase / DATABASE_URL env')
  }

  const supabase = createClient(supabaseUrl, serviceKey)
  const client = postgres(dbUrl, { prepare: false })
  const db = drizzle(client)

  for (const [slug, prompt] of Object.entries(PROMPTS)) {
    process.stdout.write(`→ ${slug} ... `)
    try {
      const image = await generate(prompt)
      const path = `posts/${slug}.png`

      const { error: upErr } = await supabase.storage
        .from('product-images')
        .upload(path, image, { contentType: 'image/png', upsert: true })
      if (upErr) throw upErr

      await db
        .update(posts)
        .set({ heroImage: path, updatedAt: new Date() })
        .where(and(eq(posts.orgId, DEFAULT_ORG_ID), eq(posts.slug, slug)))

      console.log(`✓ ${path} (${(image.length / 1024).toFixed(0)} KB)`)
    } catch (err) {
      console.log(`✗ ${err instanceof Error ? err.message : err}`)
    }
  }

  await client.end()
  console.log('\nDone.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
