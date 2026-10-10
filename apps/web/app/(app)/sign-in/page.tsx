'use client'

import { useAuthActions } from '@convex-dev/auth/react'
import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useConvexAuth } from 'convex/react'
import {
  AuthHeader,
  AuthPageLayout,
  SignInForm,
  AuthFlowToggle,
} from '@/components/auth'
import { getAuthPageHref, getSafeAppReturnPath } from '@/lib/authRedirect'
import { getAuthErrorMessage, trimEmail } from '@/lib/authForms'

function SignInContent() {
  const { signIn } = useAuthActions()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated } = useConvexAuth()
  const returnPath = getSafeAppReturnPath(searchParams.get('returnTo'))
  // Filled in when sign-up sent the visitor here (address already registered).
  const defaultEmail = searchParams.get('email') ?? undefined

  useEffect(() => {
    if (isAuthenticated) {
      router.replace(returnPath)
    }
  }, [isAuthenticated, returnPath, router])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    const formData = new FormData(event.currentTarget)
    const email = trimEmail(String(formData.get('email') ?? ''))
    formData.set('email', email)

    signIn('password', formData)
      .then(result => {
        if (!result.signingIn && email) {
          // User's email is not yet verified — redirect to code verification
          router.push(getAuthPageHref('/verify-email', returnPath, { email }))
          setSubmitting(false)
        }
        // Otherwise let the useEffect handle it when isAuthenticated becomes true
      })
      .catch(err => {
        setError(getAuthErrorMessage(err, 'signIn'))
        setSubmitting(false)
      })
  }

  return (
    <AuthPageLayout>
      <AuthHeader
        title='Aanmelden'
        description='Welkom terug! Vul je gegevens in'
      />
      <SignInForm
        defaultEmail={defaultEmail}
        error={error}
        submitting={submitting}
        onSubmit={handleSubmit}
      />
      <AuthFlowToggle
        message='Nog geen account?'
        linkText='Registreren'
        linkHref={getAuthPageHref('/sign-up', returnPath)}
        showForgotPassword={true}
        forgotPasswordHref={getAuthPageHref('/reset-password', returnPath)}
      />
    </AuthPageLayout>
  )
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <AuthPageLayout>
          <AuthHeader title='Aanmelden' description='Aanmelden voorbereiden…' />
        </AuthPageLayout>
      }
    >
      <SignInContent />
    </Suspense>
  )
}
