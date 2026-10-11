'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  XStack,
  YStack,
  FormCard,
  FormFieldContainer,
  FormLabel,
  FormInput,
  InfoCard,
  InfoCardText,
  Button,
  ButtonText,
  Text,
  neutralColors,
} from '@ella/ui'
import { Eye, EyeOff } from 'lucide-react'
import { MIN_PASSWORD_LENGTH } from '@/lib/authForms'

const inlineLinkStyle: React.CSSProperties = {
  color: 'var(--brand)',
  fontWeight: 600,
  textDecoration: 'none',
}

interface SignUpFormProps {
  error: string | null
  /** Set when the address is already registered: a link to sign in instead. */
  signInHref?: string | null
  submitting: boolean
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
}

export function SignUpForm({
  error,
  signInHref,
  submitting,
  onSubmit,
}: SignUpFormProps) {
  const [confirmPassword, setConfirmPassword] = useState('')
  const [mismatchError, setMismatchError] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const password = formData.get('password') as string
    if (password !== confirmPassword) {
      setMismatchError(true)
      return
    }
    setMismatchError(false)
    onSubmit(event)
  }

  const displayError = mismatchError
    ? 'De wachtwoorden komen niet overeen.'
    : error

  return (
    <FormCard>
      <form onSubmit={handleSubmit}>
        <YStack gap='$5'>
          <XStack gap='$4'>
            <FormFieldContainer flex={1}>
              <FormLabel htmlFor='firstName'>Voornaam</FormLabel>
              <FormInput
                id='firstName'
                name='firstName'
                type='text'
                placeholder='Jan'
                autoComplete='given-name'
                required
              />
            </FormFieldContainer>
            <FormFieldContainer flex={1}>
              <FormLabel htmlFor='lastName'>Achternaam</FormLabel>
              <FormInput
                id='lastName'
                name='lastName'
                type='text'
                placeholder='Peeters'
                autoComplete='family-name'
                required
              />
            </FormFieldContainer>
          </XStack>

          <FormFieldContainer>
            <FormLabel htmlFor='email'>E-mailadres</FormLabel>
            <FormInput
              id='email'
              name='email'
              type='email'
              placeholder='john.doe@example.com'
              autoComplete='email'
              required
            />
          </FormFieldContainer>

          <FormFieldContainer>
            <FormLabel htmlFor='password'>Wachtwoord</FormLabel>
            <div style={{ position: 'relative' }}>
              <FormInput
                id='password'
                name='password'
                type={showPassword ? 'text' : 'password'}
                placeholder='Kies een wachtwoord'
                autoComplete='new-password'
                minLength={MIN_PASSWORD_LENGTH}
                aria-describedby='password-hint'
                style={{ paddingRight: 44 }}
                required
              />
              <button
                type='button'
                onClick={() => setShowPassword(prev => !prev)}
                aria-label={
                  showPassword ? 'Wachtwoord verbergen' : 'Wachtwoord tonen'
                }
                style={{
                  position: 'absolute',
                  right: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 4,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {showPassword ? (
                  <EyeOff size={18} color={neutralColors.text.muted} />
                ) : (
                  <Eye size={18} color={neutralColors.text.muted} />
                )}
              </button>
            </div>
            <Text id='password-hint' size='$2' variant='subtle'>
              Minstens {MIN_PASSWORD_LENGTH} characters.
            </Text>
          </FormFieldContainer>

          <FormFieldContainer>
            <FormLabel htmlFor='confirmPassword'>Bevestig wachtwoord</FormLabel>
            <div style={{ position: 'relative' }}>
              <FormInput
                id='confirmPassword'
                type={showConfirm ? 'text' : 'password'}
                placeholder='Bevestig je wachtwoord'
                autoComplete='new-password'
                value={confirmPassword}
                onChange={e => {
                  setConfirmPassword(e.target.value)
                  setMismatchError(false)
                }}
                error={mismatchError}
                style={{ paddingRight: 44 }}
                required
              />
              <button
                type='button'
                onClick={() => setShowConfirm(prev => !prev)}
                aria-label={
                  showConfirm ? 'Wachtwoord verbergen' : 'Wachtwoord tonen'
                }
                style={{
                  position: 'absolute',
                  right: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 4,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {showConfirm ? (
                  <EyeOff size={18} color={neutralColors.text.muted} />
                ) : (
                  <Eye size={18} color={neutralColors.text.muted} />
                )}
              </button>
            </div>
          </FormFieldContainer>

          {displayError && (
            <InfoCard variant='error' size='$3'>
              <InfoCardText variant='error'>{displayError}</InfoCardText>
              {!mismatchError && signInHref && (
                <Link href={signInHref} style={inlineLinkStyle}>
                  Meld je aan
                </Link>
              )}
            </InfoCard>
          )}

          <input name='flow' value='signUp' type='hidden' />

          <Button type='submit' disabled={submitting} marginTop='$1'>
            <ButtonText>
              {submitting ? 'Even geduld…' : 'Registreren'}
            </ButtonText>
          </Button>

          <Text size='$2' variant='muted' textAlign='center'>
            Lees hoe we met je gegevens omgaan in ons{' '}
            <Link href='/privacy' style={inlineLinkStyle}>
              privacybeleid
            </Link>
            .
          </Text>
        </YStack>
      </form>
    </FormCard>
  )
}
