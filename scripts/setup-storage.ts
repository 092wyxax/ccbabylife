import { config } from 'dotenv'
config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'

const BUCKET = 'product-images'
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  const sb = createClient(url, serviceKey)

  const { data: existing, error: fetchError } = await sb.storage.getBucket(BUCKET)

  if (existing) {
    console.log(`✓ Bucket "${BUCKET}" already exists`)
    const { error: updateError } = await sb.storage.updateBucket(BUCKET, {
      public: true,
      fileSizeLimit: MAX_FILE_SIZE,
      allowedMimeTypes: ALLOWED_MIME_TYPES,
    })
    if (updateError) {
      console.error('  Failed to update bucket settings:', updateError.message)
      process.exit(1)
    }
    console.log('  Settings updated (public, 5MB, image/* mimes)')
    return
  }

  if (fetchError && fetchError.message !== 'Bucket not found') {
    console.error('Unexpected error:', fetchError.message)
    process.exit(1)
  }

  const { error: createError } = await sb.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: MAX_FILE_SIZE,
    allowedMimeTypes: ALLOWED_MIME_TYPES,
  })
  if (createError) {
    console.error('Failed to create bucket:', createError.message)
    process.exit(1)
  }

  console.log(`✓ Created public bucket "${BUCKET}" (5MB max, image/* only)`)
}

main()
