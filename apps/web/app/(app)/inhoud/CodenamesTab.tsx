'use client'

import { useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '@ella/backend/api'
import {
  CODENAMES_WORDS_MAX,
  CODENAMES_WORDS_MIN,
  normalizeWord,
} from '@ella/backend/types'
import {
  YStack,
  XStack,
  Text,
  Button,
  ButtonText,
  InfoCard,
  useToast,
} from '@ella/ui'
import { ConfirmDialog, LoadingState } from '@/components/common'
import { getErrorMessage } from '@/lib/errorMessage'
import { Field, textAreaStyle } from './shared'

/** Words typed one per line, or separated by commas or spaces. */
function parseWords(text: string): string[] {
  return [
    ...new Set(
      text
        .split(/[\s,;]+/)
        .map(normalizeWord)
        .filter(Boolean),
    ),
  ]
}

function WordsForm({
  words,
  isDefault,
}: {
  words: string[]
  isDefault: boolean
}) {
  const save = useMutation(api.functions.contentAdmin.saveCodenamesWords)
  const reset = useMutation(api.functions.contentAdmin.resetCodenamesWords)
  const { success, error: toastError } = useToast()
  const [text, setText] = useState(words.join('\n'))
  const [busy, setBusy] = useState(false)
  const [resetting, setResetting] = useState(false)
  const count = parseWords(text).length
  const valid = count >= CODENAMES_WORDS_MIN && count <= CODENAMES_WORDS_MAX

  const onSave = async () => {
    setBusy(true)
    try {
      await save({ words: parseWords(text) })
      success('Bewaard.')
    } catch (err) {
      toastError(getErrorMessage(err, 'Bewaren is niet gelukt.'))
    }
    setBusy(false)
  }

  return (
    <YStack gap='$3'>
      <InfoCard variant='info' size='$3'>
        <Text size='$3'>
          {isDefault
            ? 'De app gebruikt nu de ingebouwde lijst. Pas ze aan en bewaar om een eigen lijst te maken.'
            : 'Dit is jullie eigen lijst.'}{' '}
          Elk spel kiest 25 woorden uit deze lijst. Gebruik woorden van één
          stuk; hoofdletters maken niet uit.
        </Text>
      </InfoCard>
      <Field
        label={`Woorden (${count}; ${CODENAMES_WORDS_MIN} tot ${CODENAMES_WORDS_MAX}), één per regel`}
      >
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          rows={18}
          style={{ ...textAreaStyle, fontSize: 16 }}
        />
      </Field>
      <XStack gap='$2' flexWrap='wrap'>
        <Button disabled={busy || !valid} onPress={() => void onSave()}>
          <ButtonText>{busy ? 'Bewaren…' : 'Bewaren'}</ButtonText>
        </Button>
        {!isDefault && (
          <Button variant='outline' onPress={() => setResetting(true)}>
            <ButtonText>Terug naar de ingebouwde lijst</ButtonText>
          </Button>
        )}
      </XStack>
      <ConfirmDialog
        open={resetting}
        onOpenChange={setResetting}
        title='Ingebouwde lijst gebruiken'
        description='Jullie eigen lijst wordt verwijderd.'
        confirmLabel='Terugzetten'
        variant='danger'
        onConfirm={async () => {
          try {
            await reset({})
            success('De ingebouwde lijst wordt weer gebruikt.')
          } catch (err) {
            toastError(getErrorMessage(err, 'Terugzetten is niet gelukt.'))
          }
          setResetting(false)
        }}
      />
    </YStack>
  )
}

/** The words Codenames deals its boards from. */
export function CodenamesTab() {
  const list = useQuery(api.functions.contentAdmin.getCodenamesWords, {})
  if (list === undefined) return <LoadingState />
  // A new key after saving or resetting starts the form from the saved list.
  return (
    <WordsForm
      key={`${list.isDefault}-${list.words.length}-${list.words[0]}`}
      words={list.words}
      isDefault={list.isDefault}
    />
  )
}
