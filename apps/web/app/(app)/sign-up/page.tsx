'use client'

import { useAuthActions } from '@convex-dev/auth/react'
import { Suspense, useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useConvexAuth } from 'convex/react'
import {
  AuthHeader,
  AuthPageLayout,
  SignUpForm,
  AuthFlowToggle,
} from '@/components/auth'
import { getAuthPageHref, getSafeAppReturnPath } from '@/lib/authRedirect'
import {
  MIN_PASSWORD_LENGTH,
  getAuthErrorMessage,
  isEmailInUseError,
  trimEmail,
} from '@/lib/authForms'

function SignUpContent() {
  const { signIn } = useAuthActions()
  const [submitting, setSubmitting] = useState(false)
  const submittingRef = useRef(false)
  const [error, setError] = useState<string | null>(null)
  // Where to sign in when the address turned out to be registered already.
  const [signInHref, setSignInHref] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated } = useConvexAuth()
  // Where the visitor was headed, e.g. the invite they opened signed out.
  const returnPath = getSafeAppReturnPath(searchParams.get('returnTo'))

  // If already authenticated, go on to where they were headed
  useEffect(() => {
    if (isAuthenticated) {
      router.replace(returnPath)
    }
  }, [isAuthenticated, returnPath, router])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submittingRef.current) {
      return
    }

    const formData = new FormData(event.currentTarget)
    const fail = (message: string) => {
      setError(message)
      submittingRef.current = false
      setSubmitting(false)
    }

    submittingRef.current = true
    setSubmitting(true)
    setError(null)
    setSignInHref(null)

    // Validate that first and last name are provided
    const firstName = formData.get('firstName') as string
    const lastName = formData.get('lastName') as string
    if (!firstName?.trim() || !lastName?.trim()) {
      fail('Vul je voornaam en achternaam in.')
      return
    }
    const password = String(formData.get('password') ?? '')
    if (password.length < MIN_PASSWORD_LENGTH) {
      fail(
        `Je wachtwoord moet minstens ${MIN_PASSWORD_LENGTH} tekens lang zijn.`,
      )
      return
    }
    const email = trimEmail(String(formData.get('email') ?? ''))
    formData.set('email', email)

    try {
      const result = await signIn('password', formData)
      // Signed straight in: the effect above moves on.
      if (result.signingIn) return
      // Otherwise a code was emailed. Redirect to verify-email page with the
      // email pre-filled.
      router.push(getAuthPageHref('/verify-email', returnPath, { email }))
      return
    } catch (err) {
      // An address with a verified account is refused whatever the
      // password: offer to sign in with it instead.
      if (isEmailInUseError(err)) {
        setSignInHref(getAuthPageHref('/sign-in', returnPath, { email }))
      }
      fail(getAuthErrorMessage(err, 'signUp'))
    }
  }

  return (
    <AuthPageLayout>
      <AuthHeader
        title='Account aanmaken'
        description='Word lid van Ella en doe mee met onze activiteiten'
      />
      <SignUpForm
        error={error}
        signInHref={signInHref}
        submitting={submitting}
        onSubmit={handleSubmit}
      />
      <AuthFlowToggle
        message='Heb je al een account?'
        linkText='Aanmelden'
        linkHref={getAuthPageHref('/sign-in', returnPath)}
      />
    </AuthPageLayout>
  )
}

export default function SignUpPage() {
  return (
    <Suspense
      fallback={
        <AuthPageLayout>
          <AuthHeader
            title='Account aanmaken'
            description='Registratie voorbereiden…'
          />
        </AuthPageLayout>
      }
    >
      <SignUpContent />
    </Suspense>
  )
}
