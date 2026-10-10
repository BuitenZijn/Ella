'use client'

import { useEffect, useRef } from 'react'
import { useAuthActions } from '@convex-dev/auth/react'
import { neutralColors } from '@ella/ui/colors'
import { getSignInHref } from '@/lib/authRedirect'

/**
 * Dedicated sign-out route. The navbar hard-navigates here so the page the
 * user was on (and its authenticated queries) is fully unloaded before the
 * session is torn down — signing out in place made live useQuery hooks
 * throw auth errors. Lives in the (app) group because signOut() needs the
 * Convex auth provider, which also clears the session from localStorage.
 *
 * With `?returnTo=` it continues to sign-in for that page (switching account
 * on an invite), otherwise to the home page.
 */
export default function SignOutPage() {
  const { signOut } = useAuthActions()
  const startedRef = useRef(false)

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true
    const returnTo = new URLSearchParams(window.location.search).get('returnTo')
    void signOut().finally(() => {
      window.location.replace(returnTo ? getSignInHref(returnTo) : '/')
    })
  }, [signOut])

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: neutralColors.text.secondary,
        fontFamily: 'var(--font-body)',
      }}
    >
      Afmelden…
    </div>
  )
}
