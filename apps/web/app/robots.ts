import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/siteUrl'

/** Only the public pages are for search engines; the rest sits behind sign-in. */
const PRIVATE_PATHS = [
  '/admin',
  '/user',
  '/sign-in',
  '/sign-up',
  '/sign-out',
  '/reset-password',
  '/verify-email',
]

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: PRIVATE_PATHS },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
