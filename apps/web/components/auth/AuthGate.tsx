'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useConvexAuth } from 'convex/react'
import { useAuthToken } from '@convex-dev/auth/react'
import { AppLoading } from '@/components/layout/AppLoading'
import { getSignInHref, isProtectedPath } from '@/lib/authRedirect'
import { isTokenFresh } from '@/lib/authStorage'

/**
 * Route protection for the static web app (this used to be the auth
 * middleware). Every page is protected unless `isProtectedPath` lists it as
 * public: signed-out visitors are sent to sign-in, and the page itself renders
 * once Convex has accepted the session.
 *
 * With an unexpired token the page renders without waiting for that
 * confirmation, which would only add a round trip: in the render where the
 * auth provider first holds the token, ConvexProviderWithAuth hands it to the
 * client before any child subscribes, and the client holds queries back until
 * the token is sent. Rendering any earlier (e.g. off localStorage) sends the
 * page's queries unauthenticated. Expired tokens wait for the refresh.
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { isLoading, isAuthenticated } = useConvexAuth()
  const token = useAuthToken()
  const isProtected = isProtectedPath(pathname)
  const isSignedOut = isProtected && !isLoading && !isAuthenticated
  const canRenderEarly = isLoading && token !== null && isTokenFresh(token)

  useEffect(() => {
    if (!isSignedOut) return
    const { pathname: path, search } = window.location
    router.replace(getSignInHref(`${path}${search}`))
  }, [isSignedOut, router])

  if (!isProtected || isAuthenticated || canRenderEarly) {
    return children
  }
  return <AppLoading />
}
