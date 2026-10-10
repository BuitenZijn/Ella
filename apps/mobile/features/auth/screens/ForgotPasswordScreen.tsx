import React, { useState } from 'react'
import { Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import {
  YStack,
  Text,
  Button,
  ButtonText,
  StyledInput,
  MicroLabel,
  Card,
  brandColors,
  neutralColors,
  Spinner,
  LinkText,
} from '@ella/ui'
import { useAuthActions } from '@convex-dev/auth/react'
import type { StackScreenProps } from '@react-navigation/stack'
import type { AuthStackParamList } from '../../../navigation/types'
import { convexErrorData } from '../../../lib/convexErrors'
import { KeyRound, Mail } from 'lucide-react-native'

type Props = StackScreenProps<AuthStackParamList, 'ForgotPassword'>

export function ForgotPasswordScreen({ navigation }: Props) {
  const { signIn } = useAuthActions()
  const [email, setEmail] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [sent, setSent] = useState(false)

  const handleRequestReset = async () => {
    // As typed: the backend matches the address whatever its case.
    const trimmed = email.trim()
    if (!trimmed) {
      Alert.alert('E-mailadres ontbreekt', 'Vul je e-mailadres in.')
      return
    }

    setIsSending(true)
    try {
      await signIn('password', {
        flow: 'reset',
        email: trimmed,
        redirectTo: `ella://reset-password?email=${encodeURIComponent(trimmed)}`,
      })
      setSent(true)
    } catch (error: unknown) {
      const coded = convexErrorData(error)
      const message = error instanceof Error ? error.message : String(error)
      if (coded?.code === 'TOO_MANY_REQUESTS') {
        // A link went out moments ago: nothing was sent now.
        Alert.alert(
          'Even geduld',
          coded.message ??
            'Er werd net een resetlink naar dit adres gestuurd. Probeer opnieuw over een minuut.',
        )
      } else if (!coded && /connection lost|network/i.test(message)) {
        Alert.alert(
          'Geen verbinding',
          'We konden Ella niet bereiken. Controleer je verbinding en probeer opnieuw.',
        )
      } else {
        // Anything else (a failed send, say) would only happen for an
        // existing account; showing it would give that away.
        setSent(true)
      }
    } finally {
      setIsSending(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
        keyboardShouldPersistTaps='handled'
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
            {/* Hairline tile, not a tinted disc */}
            <YStack
              width={64}
              height={64}
              borderRadius={32}
              borderWidth={1}
              borderColor={neutralColors.border.default}
              alignItems='center'
              justifyContent='center'
            >
              <KeyRound size={28} color={brandColors.primary} />
            </YStack>
            <Text weight='bold' size='$8' textAlign='center'>
              Wachtwoord opnieuw instellen
            </Text>
            <Text size='$5' variant='muted' textAlign='center' maxWidth={320}>
              {sent
                ? 'Kijk in je e-mail'
                : 'Vul je e-mailadres in om een resetlink te krijgen'}
            </Text>
          </YStack>

          {sent ? (
            <YStack gap='$4'>
              <Card padding='$4' variant='outlined' borderRadius={10}>
                <YStack gap='$3' alignItems='center'>
                  <Mail size={24} color={brandColors.primary} />
                  <Text
                    size='$4'
                    variant='muted'
                    textAlign='center'
                    paddingHorizontal='$2'
                  >
                    Als er een account bestaat voor{' '}
                    <Text size='$4' weight='semibold'>
                      {email.trim()}
                    </Text>
                    , hebben we een link gestuurd om je wachtwoord opnieuw in te
                    stellen. Open die om een nieuw wachtwoord te kiezen.
                  </Text>
                </YStack>
              </Card>

              <Button size='$5' onPress={() => navigation.navigate('SignIn')}>
                <ButtonText variant='cta'>Terug naar aanmelden</ButtonText>
              </Button>
            </YStack>
          ) : (
            <YStack gap='$3'>
              <YStack gap='$2'>
                <MicroLabel accessibilityLabel='E-mailadres'>
                  E-mailadres
                </MicroLabel>
                <StyledInput
                  id='reset-email'
                  size='$5'
                  value={email}
                  onChangeText={setEmail}
                  placeholder='you@example.com'
                  autoCapitalize='none'
                  keyboardType='email-address'
                  returnKeyType='go'
                  onSubmitEditing={handleRequestReset}
                  accessibilityLabel='E-mailadres'
                />
              </YStack>

              <Button
                size='$5'
                onPress={handleRequestReset}
                marginTop='$2'
                disabled={isSending}
                icon={
                  isSending ? (
                    <Spinner
                      size='small'
                      color={neutralColors.background.page}
                    />
                  ) : undefined
                }
                accessibilityRole='button'
                accessibilityLabel='Resetlink versturen'
              >
                <ButtonText variant='cta'>
                  {isSending ? 'Versturen…' : 'Resetlink versturen'}
                </ButtonText>
              </Button>

              <LinkText
                textAlign='center'
                paddingTop='$2'
                onPress={() => navigation.goBack()}
                accessibilityRole='button'
              >
                Terug naar aanmelden
              </LinkText>
            </YStack>
          )}
        </YStack>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
