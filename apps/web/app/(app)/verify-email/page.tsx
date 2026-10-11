'use client'

import { useAuthActions } from '@convex-dev/auth/react'
import { useState, useEffect, useRef, Suspense, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAction, useConvexAuth } from 'convex/react'
import { api } from '@ella/backend/api'
import { AuthHeader, AuthPageLayout, AuthFlowToggle } from '@/components/auth'
import {
  YStack,
  XStack,
  FormCard,
  InfoCard,
  InfoCardText,
  Button,
  ButtonText,
  Text,
  brandColors,
  neutralColors,
} from '@ella/ui'
import { Mail, CheckCircle } from 'lucide-react'
import { getAuthPageHref, getSafeAppReturnPath } from '@/lib/authRedirect'
import {
  getAuthErrorMessage,
  resendCodeNotice,
  trimEmail,
} from '@/lib/authForms'

const CODE_LENGTH = 6

function VerifyEmailContent() {
  const { signIn } = useAuthActions()
  const resendVerificationCode = useAction(
    api.functions.users.resendVerificationCode,
  )
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''))
  const [verifying, setVerifying] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated } = useConvexAuth()
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const emailParam = searchParams.get('email')
  const email = emailParam ? trimEmail(emailParam) : null
  const returnPath = getSafeAppReturnPath(searchParams.get('returnTo'))
  const signUpHref = getAuthPageHref('/sign-up', returnPath)

  // Auto-focus first input
  useEffect(() => {
    if (email) {
      inputRefs.current[0]?.focus()
    }
  }, [email])

  // Redirect when authenticated
  useEffect(() => {
    if (isAuthenticated && success) {
      const timer = setTimeout(() => {
        router.replace(returnPath)
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [isAuthenticated, returnPath, success, router])

  const handleVerify = useCallback(
    async (codeOverride?: string) => {
      const code = codeOverride ?? digits.join('')
      if (!email) return
      if (code.length !== CODE_LENGTH) return

      setVerifying(true)
      setError(null)
      setNotice(null)

      try {
        const formData = new FormData()
        formData.set('code', code)
        formData.set('email', email)
        formData.set('flow', 'email-verification')

        await signIn('password', formData)
        setSuccess(true)
      } catch (err) {
        setError(getAuthErrorMessage(err, 'verifyEmail'))
      } finally {
        setVerifying(false)
      }
    },
    [digits, email, signIn],
  )

  const handleDigitChange = useCallback(
    (value: string, index: number) => {
      const cleaned = value.replace(/[^0-9]/g, '')

      if (cleaned.length <= 1) {
        const newDigits = [...digits]
        newDigits[index] = cleaned
        setDigits(newDigits)
        setError(null)

        if (cleaned.length === 1 && index < CODE_LENGTH - 1) {
          inputRefs.current[index + 1]?.focus()
        }

        if (cleaned.length === 1 && index === CODE_LENGTH - 1) {
          const code = newDigits.join('')
          if (code.length === CODE_LENGTH) {
            handleVerify(code)
          }
        }
      } else {
        // Handle paste
        const chars = cleaned.slice(0, CODE_LENGTH).split('')
        const newDigits = [...digits]
        chars.forEach((char, i) => {
          if (index + i < CODE_LENGTH) {
            newDigits[index + i] = char
          }
        })
        setDigits(newDigits)
        setError(null)

        const nextEmpty = newDigits.findIndex((d, i) => i >= index && d === '')
        const focusIndex =
          nextEmpty >= 0
            ? nextEmpty
            : Math.min(index + chars.length, CODE_LENGTH - 1)
        inputRefs.current[focusIndex]?.focus()

        const code = newDigits.join('')
        if (code.length === CODE_LENGTH) {
          handleVerify(code)
        }
      }
    },
    [digits, handleVerify],
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
      if (e.key === 'Backspace' && digits[index] === '' && index > 0) {
        const newDigits = [...digits]
        newDigits[index - 1] = ''
        setDigits(newDigits)
        inputRefs.current[index - 1]?.focus()
      }
    },
    [digits],
  )

  const handleResend = async () => {
    if (!email) return
    setResending(true)
    setError(null)
    setNotice(null)
    try {
      // Past the hourly limit the last code is kept (`reused`), not replaced.
      const result = await resendVerificationCode({ email })
      setNotice(resendCodeNotice(email, result?.status))
      setDigits(Array(CODE_LENGTH).fill(''))
      inputRefs.current[0]?.focus()
    } catch (err) {
      setError(getAuthErrorMessage(err, 'resendCode'))
    } finally {
      setResending(false)
    }
  }

  // Geen e-mailadres — show prompt
  if (!email) {
    return (
      <AuthPageLayout>
        <AuthHeader
          title='Bevestig je e-mailadres'
          description='Registreer eerst om een verificatiecode te krijgen'
          Icon={Mail}
        />
        <FormCard>
          <YStack gap='$4' alignItems='center' padding='$4'>
            <Text color='$color11' size='$4' textAlign='center'>
              Geen e-mailadres opgegeven. Registreer om een verificatiecode te
              krijgen.
            </Text>
          </YStack>
        </FormCard>
        <AuthFlowToggle
          message='Nog geen account?'
          linkText='Registreren'
          linkHref={signUpHref}
        />
      </AuthPageLayout>
    )
  }

  // Success state
  if (success) {
    return (
      <AuthPageLayout>
        <AuthHeader
          title='E-mailadres bevestigd!'
          description='Je account is actief'
          Icon={CheckCircle}
        />
        <FormCard>
          <YStack gap='$4' alignItems='center' padding='$4'>
            <InfoCard variant='success' size='$3'>
              <InfoCardText variant='success'>
                Je e-mailadres is bevestigd. Even geduld…
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
        title='Bevestig je e-mailadres'
        description={`Vul de 6-cijferige code in die we naar ${email} stuurden`}
        Icon={Mail}
      />
      <FormCard>
        <YStack gap='$5' alignItems='center' padding='$4'>
          <XStack gap='$2' justifyContent='center'>
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={el => {
                  inputRefs.current[index] = el
                }}
                type='text'
                inputMode='numeric'
                autoComplete='one-time-code'
                maxLength={CODE_LENGTH}
                value={digit}
                onChange={e => handleDigitChange(e.target.value, index)}
                onKeyDown={e => handleKeyDown(e, index)}
                style={{
                  width: 52,
                  height: 60,
                  border: `2px solid ${digit ? brandColors.primary : neutralColors.border.default}`,
                  borderRadius: 12,
                  textAlign: 'center',
                  fontSize: 28,
                  fontWeight: 700,
                  fontFamily: 'monospace',
                  backgroundColor: neutralColors.background.card,
                  color: neutralColors.text.primary,
                  outline: 'none',
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => {
                  e.target.style.borderColor = brandColors.primary
                }}
                onBlur={e => {
                  if (!digit)
                    e.target.style.borderColor = neutralColors.border.default
                }}
                aria-label={`Cijfer ${index + 1} van ${CODE_LENGTH}`}
              />
            ))}
          </XStack>

          {error && (
            <InfoCard variant='error' size='$3'>
              <InfoCardText variant='error'>{error}</InfoCardText>
            </InfoCard>
          )}

          {notice && (
            <InfoCard variant='success' size='$3'>
              <InfoCardText variant='success'>{notice}</InfoCardText>
            </InfoCard>
          )}

          <Button
            disabled={verifying || digits.join('').length !== CODE_LENGTH}
            onPress={() => handleVerify()}
          >
            <ButtonText>{verifying ? 'Controleren…' : 'Bevestigen'}</ButtonText>
          </Button>

          <YStack gap='$2' alignItems='center'>
            <Text color='$color11' size='$3' textAlign='center'>
              Geen code ontvangen?
            </Text>
            <Button
              variant='ghost'
              size='$3'
              onPress={handleResend}
              disabled={resending || verifying}
            >
              <ButtonText>
                {resending ? 'Versturen…' : 'Nieuwe code sturen'}
              </ButtonText>
            </Button>
          </YStack>
        </YStack>
      </FormCard>
      <AuthFlowToggle
        message='Verkeerd e-mailadres?'
        linkText='Opnieuw registreren'
        linkHref={signUpHref}
      />
    </AuthPageLayout>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <AuthPageLayout>
          <AuthHeader
            title='Bevestig je e-mailadres'
            description='Laden…'
            Icon={Mail}
          />
        </AuthPageLayout>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  )
}
