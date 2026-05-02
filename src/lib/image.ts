/**
 * Build a public URL for a product image.
 *
 * `stored` may be:
 * - a Supabase Storage path like `<productId>/<uuid>.jpg` → resolves to bucket URL
 * - a legacy full http(s) URL (sample seed data, Unsplash 等) → returned as-is
 */
export function imageUrl(stored: string): string {
  if (stored.startsWith('http://') || stored.startsWith('https://')) {
    return stored
  }
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
  return `${base}/storage/v1/object/public/product-images/${stored}`
}
