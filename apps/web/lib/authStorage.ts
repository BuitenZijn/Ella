/**
 * Convex Auth keeps the web session in localStorage, under keys namespaced by
 * the deployment URL. The landing page and the app's auth gate read those keys
 * directly so they can decide before the Convex client has connected.
 */

type ReadableStorage = Pick<Storage, 'getItem'>
type WritableStorage = Pick<Storage, 'getItem' | 'removeItem'>

/**
 * The old Next.js integration kept the real refresh token in an httpOnly
 * cookie and stored this placeholder in localStorage instead.
 */
const LEGACY_REFRESH_TOKEN = 'dummy'

/** Treat a token this close to expiry as expired: it needs a refresh first. */
const TOKEN_EXPIRY_MARGIN_MS = 60_000

export function convexAuthStorageKeys(convexUrl: string) {
  // Same escaping as @convex-dev/auth's useNamespacedStorage.
  const namespace = convexUrl.replace(/[^a-zA-Z0-9]/g, '')
  return {
    jwt: `__convexAuthJWT_${namespace}`,
    refreshToken: `__convexAuthRefreshToken_${namespace}`,
    serverStateFetchTime: `__convexAuthServerStateFetchTime_${namespace}`,
    verifier: `__convexAuthOAuthVerifier_${namespace}`,
  }
}

/** Whether this browser holds a session that can still be refreshed. */
export function hasStoredSession(
  storage: ReadableStorage,
  convexUrl: string,
): boolean {
  const refreshToken = storage.getItem(
    convexAuthStorageKeys(convexUrl).refreshToken,
  )
  return !!refreshToken && refreshToken !== LEGACY_REFRESH_TOKEN
}

/**
 * Whether the auth provider will find a token to hand to the Convex client on
 * its first render (it reads only the access token from storage).
 */
export function hasStoredAccessToken(
  storage: ReadableStorage,
  convexUrl: string,
): boolean {
  return (
    hasStoredSession(storage, convexUrl) &&
    storage.getItem(convexAuthStorageKeys(convexUrl).jwt) !== null
  )
}

/**
 * Whether an access token is still valid, so Convex will accept it without a
 * refresh round trip first.
 */
export function isTokenFresh(token: string, now = Date.now()): boolean {
  const expiresAt = tokenExpiry(token)
  return expiresAt !== null && expiresAt - now > TOKEN_EXPIRY_MARGIN_MS
}

/**
 * Sessions from the cookie-based setup can't be refreshed from the browser
 * (their refresh token lived in a cookie), so start those users signed out
 * instead of letting the session fail on its first refresh.
 */
export function clearLegacySession(
  storage: WritableStorage,
  convexUrl: string,
): void {
  const keys = convexAuthStorageKeys(convexUrl)
  if (storage.getItem(keys.refreshToken) !== LEGACY_REFRESH_TOKEN) return
  for (const key of Object.values(keys)) storage.removeItem(key)
}

/** The `exp` claim of a JWT in milliseconds, without verifying it. */
function tokenExpiry(token: string): number | null {
  const payload = token.split('.')[1]
  if (!payload) return null
  try {
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const { exp } = JSON.parse(atob(base64)) as { exp?: unknown }
    return typeof exp === 'number' ? exp * 1000 : null
  } catch {
    return null
  }
}
