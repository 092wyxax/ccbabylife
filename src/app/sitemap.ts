import type { MetadataRoute } from 'next'
import { listActiveProducts } from '@/server/services/ProductService'
import { listPublishedPosts } from '@/server/services/JournalService'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://nihon-select.tw'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, posts] = await Promise.all([
    listActiveProducts({ limit: 500 }),
    listPublishedPosts(),
  ])

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: 'daily', priority: 1.0 },
    { url: `${SITE_URL}/shop`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/recommend`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${SITE_URL}/gift-guide`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${SITE_URL}/journal`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${SITE_URL}/about`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/faq`, changeFrequency: 'monthly', priority: 0.4 },
  ]

  const productRoutes: MetadataRoute.Sitemap = products.map(({ product }) => ({
    url: `${SITE_URL}/shop/${product.slug}`,
    lastModified: product.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  const postRoutes: MetadataRoute.Sitemap = posts.map((p) => ({
    url: `${SITE_URL}/journal/${p.slug}`,
    lastModified: p.publishedAt ?? p.updatedAt,
    changeFrequency: 'monthly',
    priority: 0.6,
  }))

  return [...staticRoutes, ...productRoutes, ...postRoutes]
}
