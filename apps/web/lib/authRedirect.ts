export const DEFAULT_APP_RETURN_PATH = '/user'

/**
 * Pages anyone may open signed out. Everything else needs a signed-in user,
 * so a new route is protected unless it is added here.
 */
const PUBLIC_PATHS = [
  '/',
  '/privacy',
  '/delete-account',
  '/sign-in',
  '/sign-up',
  '/sign-out',
  '/reset-password',
  '/verify-email',
  // Codenames players join with a code, without an account.
  '/speel',
]

/** Public sections, including everything under them. */
const PUBLIC_PATH_PREFIXES: string[] = []

export function isProtectedPath(pathname: string): boolean {
  const path =
    pathname.length > 1 && pathname.endsWith('/')
      ? pathname.slice(0, -1)
      : pathname
  if (PUBLIC_PATHS.includes(path)) return false
  return !PUBLIC_PATH_PREFIXES.some(
    prefix => path === prefix || path.startsWith(`${prefix}/`),
  )
}

/**
 * Only allow same-site paths to be used after authentication. Keeping this
 * logic shared between middleware and the client prevents an untrusted query
 * string from becoming an open redirect.
 */
export function getSafeAppReturnPath(
  value: string | null | undefined,
  fallback = DEFAULT_APP_RETURN_PATH,
): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return fallback
  }

  try {
    const base = new URL('https://xplorer.local')
    const target = new URL(value, base)
    if (target.origin !== base.origin) return fallback

    return `${target.pathname}${target.search}${target.hash}`
  } catch {
    return fallback
  }
}

export function getSignInHref(returnPath: string): string {
  const safeReturnPath = getSafeAppReturnPath(returnPath)
  return `/sign-in?returnTo=${encodeURIComponent(safeReturnPath)}`
}

/**
 * A link between the auth pages (sign-in, sign-up, verify-email,
 * reset-password) that keeps where the visitor is headed, e.g. the invite
 * they opened before they had an account. The default destination is left
 * out of the URL.
 */
export function getAuthPageHref(
  page: string,
  returnPath: string,
  params: Record<string, string> = {},
): string {
  const search = new URLSearchParams(params)
  const safeReturnPath = getSafeAppReturnPath(returnPath)
  if (safeReturnPath !== DEFAULT_APP_RETURN_PATH) {
    search.set('returnTo', safeReturnPath)
  }
  const query = search.toString()
  return query ? `${page}?${query}` : page
}
