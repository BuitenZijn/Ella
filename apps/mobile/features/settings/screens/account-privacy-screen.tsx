import React, { useState } from 'react'
import { ScrollView, Linking } from 'react-native'
import { useAuthActions } from '@convex-dev/auth/react'
import { useMutation } from 'convex/react'
import { api } from '@ella/backend/api'
import {
  Button,
  ButtonText,
  InfoCard,
  MicroLabel,
  neutralColors,
  semanticColors,
  Text,
  XStack,
  YStack,
} from '@ella/ui'
import { ShieldCheck, Trash2 } from 'lucide-react-native'
import { AppShell, ScreenHeader } from '../../../components/shell'
import { ActionConfirmModal } from '../../../components/kit'
import { SUPPORT_EMAIL } from '@ella/shared'

type ConfirmationStep = 'warning' | 'final' | null

export function AccountPrivacyScreen() {
  const { signOut } = useAuthActions()
  const deleteAccount = useMutation(api.functions.users.deleteAccount)
  const [confirmationStep, setConfirmationStep] =
    useState<ConfirmationStep>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(false)

  const handleConfirm = async () => {
    if (confirmationStep === 'warning') {
      setConfirmationStep('final')
      return
    }
    if (confirmationStep !== 'final' || isDeleting) return

    setConfirmationStep(null)
    setDeleteError(false)
    setIsDeleting(true)
    try {
      await deleteAccount()
      // The server has already ended every session; this clears the token
      // stored on this phone.
      await signOut().catch(() => {})
    } catch {
      setDeleteError(true)
      setIsDeleting(false)
    }
  }

  const isFinalStep = confirmationStep === 'final'

  return (
    <AppShell showHeader={false}>
      <ScreenHeader title='Account & privacy' />
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <YStack flex={1} padding='$4' paddingBottom='$8' gap='$6'>
          <YStack gap='$3'>
            <MicroLabel paddingHorizontal='$1'>JOUW ACCOUNT</MicroLabel>
            <InfoCard variant='info' size='$4'>
              <XStack gap='$3' alignItems='flex-start'>
                <ShieldCheck size={22} color={semanticColors.info.main} />
                <YStack flex={1} gap='$1'>
                  <Text weight='semibold' selectable>
                    Jouw gegevens zijn van jou
                  </Text>
                </YStack>
              </XStack>
            </InfoCard>
            <Button
              variant='ghost'
              onPress={() => {
                void Linking.openURL(`mailto:${SUPPORT_EMAIL}`)
              }}
            >
              <ButtonText>Contacteer ons</ButtonText>
            </Button>
          </YStack>

          <YStack marginTop='auto' gap='$3'>
            <MicroLabel paddingHorizontal='$1'>ACCOUNT VERWIJDEREN</MicroLabel>
            <YStack gap='$1' paddingHorizontal='$1'>
              <Text weight='semibold' selectable>
                Account definitief verwijderen
              </Text>
              <Text size='$2' variant='muted' selectable>
                Verwijdert je profiel en alle gegevens die bij je account horen.
                Dit is meestal binnen enkele minuten gebeurd en kan niet
                ongedaan gemaakt worden.
              </Text>
            </YStack>

            {deleteError && (
              <InfoCard
                variant='error'
                size='$3'
                accessibilityRole='alert'
                accessibilityLiveRegion='polite'
              >
                <Text size='$2' variant='error' selectable>
                  We konden je account niet verwijderen. Probeer opnieuw of mail
                  naar {SUPPORT_EMAIL}.
                </Text>
              </InfoCard>
            )}

            <Button
              variant='outline-danger'
              onPress={() => setConfirmationStep('warning')}
              disabled={isDeleting}
              icon={<Trash2 size={18} color={semanticColors.error.main} />}
              accessibilityHint='Vraagt eerst bevestiging voor je account definitief verwijderd wordt'
            >
              <ButtonText>
                {isDeleting ? 'Account verwijderen…' : 'Account verwijderen'}
              </ButtonText>
            </Button>

            <Text
              size='$1'
              color={neutralColors.text.muted}
              textAlign='center'
              selectable
            >
              Je wordt daarna op al je toestellen afgemeld.
            </Text>
          </YStack>
        </YStack>
      </ScrollView>

      <ActionConfirmModal
        visible={confirmationStep !== null}
        onClose={() => setConfirmationStep(null)}
        onConfirm={handleConfirm}
        icon={<Trash2 size={24} color={semanticColors.error.main} />}
        title={isFinalStep ? 'Alles verwijderen?' : 'Account verwijderen?'}
        description={
          isFinalStep
            ? 'Dit is de laatste bevestiging. Je gegevens worden definitief verwijderd en je wordt op al je toestellen afgemeld.'
            : 'Je profiel en al je gegevens worden definitief verwijderd. Dit kan niet ongedaan gemaakt worden.'
        }
        confirmLabel={isFinalStep ? 'Alles verwijderen' : 'Verder'}
        cancelLabel={isFinalStep ? 'Terug' : 'Annuleren'}
      />
    </AppShell>
  )
}
