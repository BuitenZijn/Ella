/**
 * Public origin of the site, for absolute URLs in metadata, robots.txt and
 * the sitemap. Matches the backend's DEFAULT_SITE_URL (password-reset links).
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
