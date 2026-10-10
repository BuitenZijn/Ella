import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/siteUrl'

/** The public, indexable pages. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { path: '/', priority: 1 },
    { path: '/privacy', priority: 0.3 },
    { path: '/delete-account', priority: 0.2 },
  ].map(({ path, priority }) => ({
    url: `${SITE_URL}${path === '/' ? '' : path}`,
    changeFrequency: 'monthly' as const,
    priority,
  }))
}
