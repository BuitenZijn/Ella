'use client'

import { useState } from 'react'
import {
  YStack,
  FormCard,
  FormFieldContainer,
  FormLabel,
  FormInput,
  InfoCard,
  InfoCardText,
  Button,
  ButtonText,
  neutralColors,
} from '@ella/ui'
import { Eye, EyeOff } from 'lucide-react'

interface SignInFormProps {
  /** The address to start with, e.g. the one sign-up found registered. */
  defaultEmail?: string
  error: string | null
  submitting: boolean
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
}

export function SignInForm({
  defaultEmail,
  error,
  submitting,
  onSubmit,
}: SignInFormProps) {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <FormCard>
      <form onSubmit={onSubmit}>
        <YStack gap='$5'>
          <FormFieldContainer>
            <FormLabel htmlFor='email'>E-mailadres</FormLabel>
            <FormInput
              id='email'
              name='email'
              type='email'
              placeholder='Vul je e-mailadres in'
              autoComplete='email'
              defaultValue={defaultEmail}
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
                placeholder='Vul je wachtwoord in'
                autoComplete='current-password'
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
          </FormFieldContainer>

          {error && (
            <InfoCard variant='error' size='$3'>
              <InfoCardText variant='error'>{error}</InfoCardText>
            </InfoCard>
          )}

          <input name='flow' value='signIn' type='hidden' />

          {/* A real submit button, so Enter (and a phone's Go key) signs in. */}
          <Button type='submit' disabled={submitting} marginTop='$1'>
            <ButtonText>{submitting ? 'Even geduld…' : 'Aanmelden'}</ButtonText>
          </Button>
        </YStack>
      </form>
    </FormCard>
  )
}
