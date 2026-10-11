import React, { useState } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { useMutation } from 'convex/react'
import { useNavigation } from '@react-navigation/native'
import { api } from '@ella/backend/api'
import { CHILD_AVATARS } from '@ella/backend/types'
import {
  YStack,
  XStack,
  Text,
  Button,
  ButtonText,
  StyledInput,
  InfoCard,
  neutralColors,
} from '@ella/ui'
import { AppShell } from '../../../components/shell'
import { convexErrorData } from '../../../lib/convexErrors'
import { useActiveChild } from '../ActiveChild'
import { ChoiceTile } from '../components/ChoiceTile'

/** A new child profile: a first name or nickname and an emoji, nothing more. */
export function AddChildScreen() {
  const navigation = useNavigation()
  const { select } = useActiveChild()
  const addChild = useMutation(api.functions.family.addChild)
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState<string>(CHILD_AVATARS[0])
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const save = async () => {
    setBusy(true)
    setError(null)
    try {
      select(await addChild({ name, avatar }))
      navigation.goBack()
    } catch (err) {
      setError(
        convexErrorData(err)?.message ??
          'Opslaan is niet gelukt. Controleer je verbinding.',
      )
      setBusy(false)
    }
  }

  return (
    <AppShell title='Nieuw profiel'>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          keyboardShouldPersistTaps='handled'
        >
          <YStack gap='$4'>
            <Text color={neutralColors.text.secondary}>
              Gebruik een voornaam of bijnaam. We vragen geen foto, e-mail of
              geboortedatum.
            </Text>
            <StyledInput
              placeholder='Naam'
              value={name}
              onChangeText={setName}
              maxLength={30}
              accessibilityLabel='Naam'
            />
            <Text weight='bold'>Kies een figuurtje</Text>
            <XStack flexWrap='wrap' gap='$2'>
              {CHILD_AVATARS.map(a => (
                <YStack key={a} width='22%'>
                  <ChoiceTile
                    label={a}
                    selected={a === avatar}
                    onPress={() => setAvatar(a)}
                  />
                </YStack>
              ))}
            </XStack>
            {error && (
              <InfoCard variant='error' size='$3'>
                <Text variant='error'>{error}</Text>
              </InfoCard>
            )}
            <Button
              size='$5'
              disabled={busy || !name.trim()}
              onPress={() => void save()}
            >
              <ButtonText>{busy ? 'Even geduld…' : 'Opslaan'}</ButtonText>
            </Button>
          </YStack>
        </ScrollView>
      </KeyboardAvoidingView>
    </AppShell>
  )
}

export default AddChildScreen
