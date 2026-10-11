'use client'

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
  Text,
} from '@ella/ui'
import { ArrowLeft } from 'lucide-react'
import { MIN_PASSWORD_LENGTH } from '@/lib/authForms'

type ResetStep = 'request' | 'newPassword'

interface ResetPasswordFormProps {
  step: ResetStep
  email?: string
  error: string | null
  success: string | null
  submitting: boolean
  onRequestReset: (event: React.FormEvent<HTMLFormElement>) => void
  onSetNewPassword: (event: React.FormEvent<HTMLFormElement>) => void
  onBack: () => void
}

export function ResetPasswordForm({
  step,
  email,
  error,
  success,
  submitting,
  onRequestReset,
  onSetNewPassword,
  onBack,
}: ResetPasswordFormProps) {
  if (step === 'request') {
    return (
      <FormCard>
        <form onSubmit={onRequestReset}>
          <YStack gap='$5'>
            <FormFieldContainer>
              <FormLabel htmlFor='email'>E-mailadres</FormLabel>
              <FormInput
                id='email'
                name='email'
                type='email'
                placeholder='Vul je e-mailadres in'
                autoComplete='email'
                required
              />
            </FormFieldContainer>

            <input name='flow' value='reset' type='hidden' />

            {error && (
              <InfoCard variant='error' size='$3'>
                <InfoCardText variant='error'>{error}</InfoCardText>
              </InfoCard>
            )}

            {success && (
              <InfoCard variant='success' size='$3'>
                <InfoCardText variant='success'>{success}</InfoCardText>
              </InfoCard>
            )}

            <Button type='submit' disabled={submitting}>
              <ButtonText>
                {submitting ? 'Versturen…' : 'Resetlink versturen'}
              </ButtonText>
            </Button>
          </YStack>
        </form>
      </FormCard>
    )
  }

  // Step: newPassword - user clicked the link and can set new password
  return (
    <FormCard>
      <form onSubmit={onSetNewPassword}>
        <YStack gap='$5'>
          <Text color='$color11' size='$3' textAlign='center'>
            Nieuw wachtwoord instellen voor {email}
          </Text>

          <FormFieldContainer>
            <FormLabel htmlFor='newPassword'>Nieuw wachtwoord</FormLabel>
            <FormInput
              id='newPassword'
              name='newPassword'
              type='password'
              placeholder={`Minstens ${MIN_PASSWORD_LENGTH} tekens`}
              autoComplete='new-password'
              minLength={MIN_PASSWORD_LENGTH}
              required
            />
          </FormFieldContainer>

          <FormFieldContainer>
            <FormLabel htmlFor='confirmPassword'>Bevestig wachtwoord</FormLabel>
            <FormInput
              id='confirmPassword'
              name='confirmPassword'
              type='password'
              placeholder='Bevestig je nieuwe wachtwoord'
              autoComplete='new-password'
              required
            />
          </FormFieldContainer>

          {/* Hidden fields for the flow */}
          <input name='flow' value='reset-verification' type='hidden' />
          <input name='email' value={email} type='hidden' />

          {error && (
            <InfoCard variant='error' size='$3'>
              <InfoCardText variant='error'>{error}</InfoCardText>
            </InfoCard>
          )}

          <Button type='submit' disabled={submitting}>
            <ButtonText>
              {submitting ? 'Bezig…' : 'Wachtwoord opnieuw instellen'}
            </ButtonText>
          </Button>

          <Button
            type='button'
            variant='ghost'
            onPress={(e: { preventDefault: () => void }) => {
              e.preventDefault()
              onBack()
            }}
          >
            <ArrowLeft size={16} />
            <ButtonText>Terug</ButtonText>
          </Button>
        </YStack>
      </form>
    </FormCard>
  )
}
