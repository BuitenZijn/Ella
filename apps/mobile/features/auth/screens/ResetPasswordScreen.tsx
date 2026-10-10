import React, { useRef, useState } from 'react'
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native'
import type { TamaguiTextElement } from '@ella/ui'
import {
  Button,
  ButtonText,
  Card,
  InfoCard,
  LoadingSpinner,
  MicroLabel,
  StyledInput,
  Text,
  XStack,
  YStack,
  brandColors,
  neutralColors,
  semanticColors,
} from '@ella/ui'
import { useAuthActions } from '@convex-dev/auth/react'
import type { StackScreenProps } from '@react-navigation/stack'
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Mail,
} from 'lucide-react-native'
import type { AuthStackParamList } from '../../../navigation/types'

type ScreenProps = StackScreenProps<AuthStackParamList, 'ResetPassword'>

interface Props extends ScreenProps {
  onComplete: () => void
}

export function ResetPasswordScreen({ route, onComplete }: Props) {
  const { code, email, preview } = route.params
  const { signIn } = useAuthActions()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [completed, setCompleted] = useState(preview === 'success')
  const confirmPasswordRef = useRef<TamaguiTextElement>(null)

  const hasMinimumLength = newPassword.length >= 8
  const passwordsMatch =
    confirmPassword.length > 0 && newPassword === confirmPassword
  const canSubmit = hasMinimumLength && passwordsMatch && !isSubmitting

  const handleReset = async () => {
    if (!hasMinimumLength) {
      setError('Gebruik minstens 8 tekens voor je nieuwe wachtwoord.')
      return
    }
    if (!passwordsMatch) {
      setError('De wachtwoorden komen nog niet overeen.')
      return
    }

    setError(null)
    setIsSubmitting(true)
    try {
      await signIn('password', {
        flow: 'reset-verification',
        email,
        code,
        newPassword,
      })
      Keyboard.dismiss()
      setCompleted(true)
    } catch (resetError: unknown) {
      const message =
        resetError instanceof Error ? resetError.message : String(resetError)
      setError(
        message.includes('Invalid') || message.toLowerCase().includes('expired')
          ? 'Deze resetlink is ongeldig of verlopen. Vraag een nieuwe aan via het aanmeldscherm.'
          : 'Je wachtwoord kon niet opnieuw ingesteld worden. Controleer je verbinding en probeer opnieuw.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
        contentInsetAdjustmentBehavior='automatic'
        automaticallyAdjustKeyboardInsets
        keyboardShouldPersistTaps='handled'
        keyboardDismissMode='interactive'
        bounces={false}
      >
        <YStack
          flex={1}
          backgroundColor='$background'
          padding='$4'
          justifyContent='center'
          gap='$6'
        >
          <YStack gap='$3' alignItems='center'>
            <YStack
              width={64}
              height={64}
              borderRadius={32}
              borderWidth={1}
              borderColor={
                completed
                  ? semanticColors.success.border
                  : neutralColors.border.default
              }
              alignItems='center'
              justifyContent='center'
            >
              {completed ? (
                <CheckCircle2 size={28} color={semanticColors.success.main} />
              ) : (
                <KeyRound size={28} color={brandColors.primary} />
              )}
            </YStack>
            <Text weight='bold' size='$8' textAlign='center' selectable>
              {completed ? 'Wachtwoord gewijzigd' : 'Kies een nieuw wachtwoord'}
            </Text>
            <Text
              size='$4'
              variant='muted'
              textAlign='center'
              maxWidth={330}
              selectable
            >
              {completed
                ? 'Je account is beveiligd en klaar voor gebruik.'
                : 'Kies een wachtwoord dat je nergens anders gebruikt.'}
            </Text>
          </YStack>

          {completed ? (
            <YStack gap='$4'>
              <InfoCard variant='success' size='$4'>
                <XStack gap='$3' alignItems='center'>
                  <CheckCircle2 size={22} color={semanticColors.success.main} />
                  <Text flex={1} size='$3' variant='success' selectable>
                    Je wachtwoord is gewijzigd. Je bent op je andere toestellen
                    afgemeld om je account te beschermen.
                  </Text>
                </XStack>
              </InfoCard>
              <Button
                size='$5'
                onPress={onComplete}
                accessibilityLabel='Verder naar Ella'
              >
                <ButtonText variant='cta'>Verder naar Ella</ButtonText>
              </Button>
            </YStack>
          ) : (
            <YStack gap='$4'>
              <Card variant='outlined' size='$3'>
                <XStack gap='$2' alignItems='center'>
                  <Mail size={16} color={neutralColors.text.muted} />
                  <Text size='$2' variant='muted' flex={1} selectable>
                    Nieuw wachtwoord voor {email}
                  </Text>
                </XStack>
              </Card>

              <YStack gap='$3'>
                <YStack gap='$2'>
                  <MicroLabel>Nieuw wachtwoord</MicroLabel>
                  <YStack position='relative'>
                    <StyledInput
                      id='new-password'
                      size='$5'
                      value={newPassword}
                      onChangeText={value => {
                        setNewPassword(value)
                        setError(null)
                      }}
                      placeholder='Minstens 8 tekens'
                      secureTextEntry={!showNewPassword}
                      autoCapitalize='none'
                      autoCorrect={false}
                      autoComplete='new-password'
                      returnKeyType='next'
                      blurOnSubmit={false}
                      onSubmitEditing={() =>
                        confirmPasswordRef.current?.focus()
                      }
                      accessibilityLabel='Nieuw wachtwoord'
                      paddingRight='$8'
                    />
                    <YStack
                      position='absolute'
                      right={12}
                      top={0}
                      bottom={0}
                      justifyContent='center'
                      onPress={() => setShowNewPassword(value => !value)}
                      pressStyle={{ opacity: 0.7 }}
                      accessibilityRole='button'
                      accessibilityLabel={
                        showNewPassword
                          ? 'Nieuw wachtwoord verbergen'
                          : 'Nieuw wachtwoord tonen'
                      }
                    >
                      {showNewPassword ? (
                        <EyeOff size={20} color={neutralColors.text.muted} />
                      ) : (
                        <Eye size={20} color={neutralColors.text.muted} />
                      )}
                    </YStack>
                  </YStack>
                </YStack>

                <YStack gap='$2'>
                  <MicroLabel>Bevestig wachtwoord</MicroLabel>
                  <YStack position='relative'>
                    <StyledInput
                      id='confirm-new-password'
                      ref={confirmPasswordRef}
                      size='$5'
                      value={confirmPassword}
                      onChangeText={value => {
                        setConfirmPassword(value)
                        setError(null)
                      }}
                      placeholder='Vul het opnieuw in'
                      secureTextEntry={!showConfirmPassword}
                      autoCapitalize='none'
                      autoCorrect={false}
                      autoComplete='new-password'
                      returnKeyType='done'
                      onSubmitEditing={handleReset}
                      accessibilityLabel='Bevestig nieuw wachtwoord'
                      paddingRight='$8'
                    />
                    <YStack
                      position='absolute'
                      right={12}
                      top={0}
                      bottom={0}
                      justifyContent='center'
                      onPress={() => setShowConfirmPassword(value => !value)}
                      pressStyle={{ opacity: 0.7 }}
                      accessibilityRole='button'
                      accessibilityLabel={
                        showConfirmPassword
                          ? 'Bevestigd wachtwoord verbergen'
                          : 'Bevestigd wachtwoord tonen'
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={20} color={neutralColors.text.muted} />
                      ) : (
                        <Eye size={20} color={neutralColors.text.muted} />
                      )}
                    </YStack>
                  </YStack>
                </YStack>
              </YStack>

              <YStack gap='$2'>
                <XStack gap='$2' alignItems='center'>
                  <Check
                    size={15}
                    color={
                      hasMinimumLength
                        ? semanticColors.success.main
                        : neutralColors.text.muted
                    }
                  />
                  <Text
                    size='$2'
                    variant={hasMinimumLength ? 'success' : 'subtle'}
                  >
                    Minstens 8 tekens
                  </Text>
                </XStack>
                <XStack gap='$2' alignItems='center'>
                  <Check
                    size={15}
                    color={
                      passwordsMatch
                        ? semanticColors.success.main
                        : neutralColors.text.muted
                    }
                  />
                  <Text
                    size='$2'
                    variant={passwordsMatch ? 'success' : 'subtle'}
                  >
                    Wachtwoorden komen overeen
                  </Text>
                </XStack>
              </YStack>

              {error && (
                <InfoCard
                  variant='error'
                  size='$3'
                  accessibilityRole='alert'
                  accessibilityLiveRegion='polite'
                >
                  <XStack gap='$2' alignItems='flex-start'>
                    <AlertCircle size={17} color={semanticColors.error.main} />
                    <Text flex={1} size='$2' variant='error' selectable>
                      {error}
                    </Text>
                  </XStack>
                </InfoCard>
              )}

              <Button
                size='$5'
                onPress={handleReset}
                disabled={!canSubmit}
                accessibilityLabel='Wachtwoord wijzigen'
              >
                {isSubmitting ? (
                  <LoadingSpinner size='$3' />
                ) : (
                  <ButtonText variant='cta'>Wachtwoord wijzigen</ButtonText>
                )}
              </Button>

              <Button variant='ghost' onPress={onComplete}>
                <ButtonText variant='muted'>Annuleren</ButtonText>
              </Button>
            </YStack>
          )}
        </YStack>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
