'use client'

import { useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '@ella/backend/api'
import type { Doc } from '@ella/backend/dataModel'
import {
  WORD_LIST_MAX,
  WORD_LIST_MIN,
  type WordItem,
} from '@ella/backend/types'
import {
  YStack,
  XStack,
  Text,
  Button,
  ButtonText,
  InfoCard,
  brandColors,
  neutralColors,
  useToast,
} from '@ella/ui'
import { Download, Pencil, Plus, Trash2 } from 'lucide-react'
import { ConfirmDialog, LoadingState } from '@/components/common'
import { getErrorMessage } from '@/lib/errorMessage'
import { EditPanel, Field, Row, fieldStyle, textAreaStyle } from './shared'

type List = Doc<'wordLists'>

/** One word per line, its emoji first: "🐱 kat". */
function parseWords(text: string): WordItem[] {
  const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' })
  return text
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const first = segmenter.segment(line)[Symbol.iterator]().next().value
      const emoji = first?.segment ?? ''
      return { emoji, word: line.slice(emoji.length).trim() }
    })
    .filter(w => w.emoji && w.word)
}

function ListForm({ list, onDone }: { list: List | null; onDone: () => void }) {
  const saveList = useMutation(api.functions.contentAdmin.saveWordList)
  const { success, error: toastError } = useToast()
  const [name, setName] = useState(list?.name ?? '')
  const [emoji, setEmoji] = useState(list?.emoji ?? '')
  const [words, setWords] = useState(
    list?.words.map(w => `${w.emoji} ${w.word}`).join('\n') ?? '',
  )
  const [active, setActive] = useState(list?.active ?? true)
  const [busy, setBusy] = useState(false)
  const count = parseWords(words).length

  const save = async () => {
    setBusy(true)
    try {
      await saveList({
        id: list?._id,
        name,
        emoji,
        words: parseWords(words),
        active,
      })
      success('Bewaard.')
      onDone()
    } catch (err) {
      toastError(getErrorMessage(err, 'Bewaren is niet gelukt.'))
      setBusy(false)
    }
  }

  return (
    <EditPanel
      title={list ? `${list.name} aanpassen` : 'Nieuwe woordenlijst'}
      busy={busy}
      canSave={
        !!name.trim() &&
        !!emoji.trim() &&
        count >= WORD_LIST_MIN &&
        count <= WORD_LIST_MAX
      }
      onSave={() => void save()}
      onCancel={onDone}
    >
      <XStack gap='$3' flexWrap='wrap'>
        <Field label='Naam'>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={80}
            style={fieldStyle}
          />
        </Field>
        <Field label='Icoon'>
          <input
            value={emoji}
            onChange={e => setEmoji(e.target.value)}
            maxLength={16}
            style={fieldStyle}
          />
        </Field>
      </XStack>
      <Field
        label={`Woordjes (${count}; ${WORD_LIST_MIN} tot ${WORD_LIST_MAX}). Eén per regel, de emoji eerst: 🐱 kat`}
      >
        <textarea
          value={words}
          onChange={e => setWords(e.target.value)}
          rows={12}
          style={{ ...textAreaStyle, fontSize: 18 }}
        />
      </Field>
      <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          type='checkbox'
          checked={active}
          onChange={e => setActive(e.target.checked)}
        />
        <Text size='$3'>Zichtbaar in de app</Text>
      </label>
    </EditPanel>
  )
}

/** Word lists for Woordjes lezen: words with a picture. */
export function WordsTab() {
  const lists = useQuery(api.functions.contentAdmin.listWordLists, {})
  const removeList = useMutation(api.functions.contentAdmin.removeWordList)
  const importDefaults = useMutation(
    api.functions.contentAdmin.importDefaultWordLists,
  )
  const { success, error: toastError } = useToast()
  const [editing, setEditing] = useState<List | 'new' | null>(null)
  const [removing, setRemoving] = useState<List | null>(null)

  if (lists === undefined) return <LoadingState />

  return (
    <YStack gap='$3'>
      {lists.length === 0 && (
        <InfoCard variant='info' size='$3'>
          <Text size='$3'>
            Er zijn nog geen eigen lijsten: de app toont de standaardlijsten
            (Dieren, Eten, Thuis, Buiten). Neem ze over om ze aan te passen.
            Zodra er een eigen lijst is, toont de app enkel de eigen lijsten.
          </Text>
        </InfoCard>
      )}
      <XStack gap='$2' flexWrap='wrap'>
        <Button icon={<Plus size={16} />} onPress={() => setEditing('new')}>
          <ButtonText>Lijst toevoegen</ButtonText>
        </Button>
        {lists.length === 0 && (
          <Button
            variant='outline'
            icon={<Download size={16} />}
            onPress={async () => {
              try {
                await importDefaults({})
                success('Standaardlijsten overgenomen.')
              } catch (err) {
                toastError(getErrorMessage(err, 'Overnemen is niet gelukt.'))
              }
            }}
          >
            <ButtonText>Standaardlijsten overnemen</ButtonText>
          </Button>
        )}
      </XStack>
      {editing !== null && (
        <ListForm
          key={editing === 'new' ? 'new' : editing._id}
          list={editing === 'new' ? null : editing}
          onDone={() => setEditing(null)}
        />
      )}
      {lists.map(list => (
        <Row key={list._id}>
          <Text fontSize={28} lineHeight={36}>
            {list.emoji}
          </Text>
          <YStack flex={1} minWidth={200}>
            <Text weight='semibold'>
              {list.name}
              {!list.active && ' (verborgen)'}
            </Text>
            <Text size='$3' variant='muted' numberOfLines={1}>
              {list.words.map(w => `${w.emoji} ${w.word}`).join(' · ')}
            </Text>
          </YStack>
          <Button
            size='$3'
            chromeless
            aria-label={`${list.name} aanpassen`}
            onPress={() => setEditing(list)}
            icon={<Pencil size={16} color={neutralColors.text.secondary} />}
          />
          <Button
            size='$3'
            chromeless
            aria-label={`${list.name} verwijderen`}
            onPress={() => setRemoving(list)}
            icon={<Trash2 size={16} color={brandColors.destructive} />}
          />
        </Row>
      ))}
      <ConfirmDialog
        open={removing !== null}
        onOpenChange={open => !open && setRemoving(null)}
        title='Lijst verwijderen'
        description={`De lijst "${removing?.name}" wordt verwijderd.`}
        confirmLabel='Verwijderen'
        variant='danger'
        onConfirm={async () => {
          if (!removing) return
          try {
            await removeList({ id: removing._id })
            success('Verwijderd.')
          } catch (err) {
            toastError(getErrorMessage(err, 'Verwijderen is niet gelukt.'))
          }
          setRemoving(null)
        }}
      />
    </YStack>
  )
}
