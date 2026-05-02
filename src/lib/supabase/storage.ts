import 'server-only'
import { createClient } from '@supabase/supabase-js'

const BUCKET = 'product-images'

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

export async function uploadProductImage(productId: string, file: File): Promise<string> {
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
  const path = `${productId}/${crypto.randomUUID()}.${ext}`

  const { error } = await admin()
    .storage.from(BUCKET)
    .upload(path, file, {
      contentType: file.type || `image/${ext}`,
      upsert: false,
    })
  if (error) throw new Error(`Upload failed: ${error.message}`)
  return path
}

export async function deleteProductImage(path: string): Promise<void> {
  // Skip legacy http(s) URLs — those weren't stored in our bucket
  if (path.startsWith('http')) return

  const { error } = await admin().storage.from(BUCKET).remove([path])
  if (error) {
    console.warn(`deleteProductImage: ${error.message}`)
  }
}
