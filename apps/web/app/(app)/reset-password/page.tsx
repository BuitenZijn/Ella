'use client'

import { useAuthActions } from '@convex-dev/auth/react'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useConvexAuth } from 'convex/react'
import {
  AuthHeader,
  AuthPageLayout,
  AuthFlowToggle,
  ResetPasswordForm,
} from '@/components/auth'
import { FormCard, InfoCard, InfoCardText, YStack } from '@ella/ui'
import { CheckCircle, KeyRound } from 'lucide-react'
import { getAuthPageHref, getSafeAppReturnPath } from '@/lib/authRedirect'
import {
  MIN_PASSWORD_LENGTH,
  getAuthErrorMessage,
  trimEmail,
} from '@/lib/authForms'
import { getErrorCode, getErrorMessage } from '@/lib/errorMessage'

function ResetPasswordContent() {
  const { signIn } = useAuthActions()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [resetComplete, setResetComplete] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated } = useConvexAuth()
  const token = searchParams.get('code') ?? searchParams.get('token')
  const emailParam = searchParams.get('email')
  const email = emailParam ? trimEmail(emailParam) : null
  const step = token && email ? 'newPassword' : 'request'
  const returnPath = getSafeAppReturnPath(searchParams.get('returnTo'))
  // Reset emails requested from the mobile app link here (see the backend's
  // passwordResetLinks): send those users back to the app, not into the site.
  const fromApp = searchParams.get('from') === 'app'

  // The new password signs the user in; then go on to where they were
  // headed. Someone already signed in may still request or complete a reset.
  useEffect(() => {
    if (resetComplete && isAuthenticated) {
      router.replace(returnPath)
    }
  }, [resetComplete, isAuthenticated, returnPath, router])

  const handleRequestReset = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    setSuccess(null)

    const formData = new FormData(event.currentTarget)
    const requestedEmail = trimEmail(String(formData.get('email') ?? ''))
    formData.set('email', requestedEmail)
    formData.set(
      'redirectTo',
      getAuthPageHref('/reset-password', returnPath, { email: requestedEmail }),
    )
    // The same answer whether or not the address has an account, so this
    // form can't be used to find out who has one.
    const sent = `Als er een account bestaat voor ${requestedEmail}, hebben we een link gestuurd om een nieuw wachtwoord in te stellen. De link is 1 uur geldig.`

    try {
      await signIn('password', formData)
      setSuccess(sent)
    } catch (err) {
      if (getErrorCode(err) === 'TOO_MANY_REQUESTS') {
        // Throttled per address, whether or not it has an account.
        setError(getAuthErrorMessage(err, 'requestReset'))
      } else if (/connection lost/i.test(getErrorMessage(err, ''))) {
        setError(
          'We konden Ella niet bereiken. Controleer je verbinding en probeer opnieuw.',
        )
      } else {
        // Anything else (a failed send, say) would only happen for an
        // existing account; showing it would give that away.
        console.error('Password reset request failed:', err)
        setSuccess(sent)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleSetNewPassword = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    const formData = new FormData(event.currentTarget)
    const newPassword = formData.get('newPassword') as string
    const confirmPassword = formData.get('confirmPassword') as string

    if (newPassword !== confirmPassword) {
      setError('De wachtwoorden komen niet overeen.')
      setSubmitting(false)
      return
    }

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setError(
        `Je wachtwoord moet minstens ${MIN_PASSWORD_LENGTH} tekens lang zijn.`,
      )
      setSubmitting(false)
      return
    }

    // Add the token from URL to the form data
    formData.set('code', token || '')
    formData.set('email', email ?? '')

    try {
      await signIn('password', formData)
      // On success the user is signed in; web users are redirected via
      // useEffect, app users get told to head back to the app.
      if (fromApp) {
        setDone(true)
        setSubmitting(false)
      } else {
        setResetComplete(true)
      }
    } catch (err) {
      setError(getAuthErrorMessage(err, 'resetPassword'))
      setSubmitting(false)
    }
  }

  const handleBack = () => {
    setError(null)
    setSuccess(null)
    // Clear the email and code from the URL
    router.push(getAuthPageHref('/reset-password', returnPath))
  }

  if (done) {
    return (
      <AuthPageLayout>
        <AuthHeader
          title='Wachtwoord gewijzigd'
          description='Je nieuwe wachtwoord is klaar voor gebruik'
          Icon={CheckCircle}
        />
        <FormCard>
          <YStack gap='$4' alignItems='center' padding='$4'>
            <InfoCard variant='success' size='$3'>
              <InfoCardText variant='success'>
                Open de Ella-app en meld je aan met je nieuwe wachtwoord.
              </InfoCardText>
            </InfoCard>
          </YStack>
        </FormCard>
      </AuthPageLayout>
    )
  }

  return (
    <AuthPageLayout>
      <AuthHeader
        title={
          step === 'request'
            ? 'Wachtwoord opnieuw instellen'
            : 'Kies een nieuw wachtwoord'
        }
        description={
          step === 'request'
            ? 'Vul je e-mailadres in om een resetlink te krijgen'
            : 'Vul hieronder je nieuwe wachtwoord in'
        }
        Icon={KeyRound}
      />
      <ResetPasswordForm
        step={step}
        email={email || undefined}
        error={error}
        success={success}
        submitting={submitting}
        onRequestReset={handleRequestReset}
        onSetNewPassword={handleSetNewPassword}
        onBack={handleBack}
      />
      <AuthFlowToggle
        message='Weet je je wachtwoord weer?'
        linkText='Aanmelden'
        linkHref={getAuthPageHref('/sign-in', returnPath)}
      />
    </AuthPageLayout>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <AuthPageLayout>
          <AuthHeader
            title='Wachtwoord opnieuw instellen'
            description='Laden…'
            Icon={KeyRound}
          />
        </AuthPageLayout>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  )
}
