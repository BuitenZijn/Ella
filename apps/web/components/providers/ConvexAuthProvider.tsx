'use client'

import { ReactNode } from 'react'
import { ConvexReactClient } from 'convex/react'
import { ConvexAuthProvider as ConvexAuthBrowserProvider } from '@convex-dev/auth/react'
import { clearLegacySession, hasStoredAccessToken } from '@/lib/authStorage'
import { CONVEX_URL } from '@/lib/convexUrl'

function readStorage<T>(read: (storage: Storage) => T, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    return read(window.localStorage)
  } catch {
    // Storage blocked (private mode, site data disabled)
    return fallback
  }
}

readStorage(storage => clearLegacySession(storage, CONVEX_URL), undefined)

const convex = new ConvexReactClient(CONVEX_URL, {
  // The auth provider reads the stored session after the first render, but a
  // page's queries subscribe during it and would run signed out. With a
  // session in storage, hold every request until the token has been sent.
  // Only then: nothing but setAuth releases the hold, and the provider only
  // calls it when it finds a token.
  expectAuth: readStorage(
    storage => hasStoredAccessToken(storage, CONVEX_URL),
    false,
  ),
})

/**
 * Convex Auth in the browser only: the session lives in localStorage and no
 * page reads auth cookies on the server, which keeps every page static. Route
 * protection happens in AuthGate; the data itself is protected by Convex.
 */
export function ConvexAuthProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexAuthBrowserProvider
      client={convex}
      storageNamespace={CONVEX_URL}
      // Password is the only provider, so a `code` in the URL is always a
      // password-reset code for our own form, never a sign-in callback to
      // consume.
      shouldHandleCode={false}
    >
      {children}
    </ConvexAuthBrowserProvider>
  )
}
