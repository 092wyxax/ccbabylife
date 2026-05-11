/**
 * Helpers to render JSON-LD structured data for search engines.
 */

interface OrgInfo {
  name: string
  url: string
}

const ORG: OrgInfo = {
  name: '熙熙初日｜日系選物店',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ccbabylife.com',
}

export function organizationLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: ORG.name,
    url: ORG.url,
    logo: `${ORG.url}/favicon.ico`,
    description: '1 歲寶寶的媽媽親身試用、嚴選日系好物、不賣需查驗登記商品',
  }
}

export function websiteLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: ORG.name,
    url: ORG.url,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${ORG.url}/shop?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  }
}

interface ProductLdInput {
  slug: string
  nameZh: string
  nameJp?: string | null
  description?: string | null
  priceTwd: number
  brand?: string | null
  imageUrls: string[]
  inStock: boolean
  /** Optional aggregate rating from approved reviews */
  rating?: {
    avg: number // 1–5 (decimal allowed)
    count: number
  } | null
  /** Optional sample reviews to embed (max 3 recommended) */
  reviews?: Array<{
    rating: number // 1–5
    title?: string | null
    body: string
    author?: string | null
    createdAt: Date
  }>
}

export function productLd(p: ProductLdInput) {
  const out: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.nameZh,
    alternateName: p.nameJp ?? undefined,
    description: p.description ?? undefined,
    brand: p.brand
      ? { '@type': 'Brand', name: p.brand }
      : undefined,
    image: p.imageUrls.length > 0 ? p.imageUrls : undefined,
    url: `${ORG.url}/shop/${p.slug}`,
    offers: {
      '@type': 'Offer',
      url: `${ORG.url}/shop/${p.slug}`,
      priceCurrency: 'TWD',
      price: p.priceTwd,
      availability: p.inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/PreOrder',
      seller: { '@type': 'Organization', name: ORG.name },
    },
  }

  if (p.rating && p.rating.count > 0) {
    out.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: p.rating.avg.toFixed(2),
      reviewCount: p.rating.count,
      bestRating: 5,
      worstRating: 1,
    }
  }

  if (p.reviews && p.reviews.length > 0) {
    out.review = p.reviews.slice(0, 3).map((r) => ({
      '@type': 'Review',
      reviewRating: {
        '@type': 'Rating',
        ratingValue: r.rating,
        bestRating: 5,
        worstRating: 1,
      },
      name: r.title || undefined,
      reviewBody: r.body,
      datePublished: r.createdAt.toISOString(),
      author: { '@type': 'Person', name: r.author ?? '匿名' },
    }))
  }

  return out
}

interface ArticleLdInput {
  slug: string
  title: string
  excerpt?: string | null
  publishedAt: Date | null
  heroImageUrl?: string | null
}

export function articleLd(p: ArticleLdInput) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: p.title,
    description: p.excerpt ?? undefined,
    url: `${ORG.url}/journal/${p.slug}`,
    image: p.heroImageUrl ? [p.heroImageUrl] : undefined,
    datePublished: p.publishedAt?.toISOString(),
    author: { '@type': 'Organization', name: ORG.name },
    publisher: {
      '@type': 'Organization',
      name: ORG.name,
      logo: { '@type': 'ImageObject', url: `${ORG.url}/favicon.ico` },
    },
  }
}

/**
 * FAQPage schema — helps Google show rich results with collapsible Q/A
 * and helps AI engines (Perplexity / ChatGPT / Claude) cite the page.
 */
export function faqPageLd(items: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((it) => ({
      '@type': 'Question',
      name: it.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: it.answer,
      },
    })),
  }
}

export function breadcrumbLd(items: Array<{ name: string; href: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: `${ORG.url}${it.href}`,
    })),
  }
}

export function jsonLdScript(data: object): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}
