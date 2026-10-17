'use client'

import { useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '@ella/backend/api'
import type { Doc } from '@ella/backend/dataModel'
import {
  YStack,
  XStack,
  Text,
  Button,
  ButtonText,
  brandColors,
  neutralColors,
  useToast,
} from '@ella/ui'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { ConfirmDialog, LoadingState } from '@/components/common'
import { getErrorMessage } from '@/lib/errorMessage'
import { EditPanel, Field, Row, fieldStyle, textAreaStyle } from './shared'

type Theme = Doc<'memoryThemes'>

/** Emoji typed with spaces between them; also splits a run of emoji. */
function splitEmojis(text: string): string[] {
  const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' })
  return [...segmenter.segment(text)].map(s => s.segment.trim()).filter(Boolean)
}

function ThemeForm({
  theme,
  onDone,
}: {
  theme: Theme | null
  onDone: () => void
}) {
  const saveTheme = useMutation(api.functions.contentAdmin.saveMemoryTheme)
  const { success, error: toastError } = useToast()
  const [name, setName] = useState(theme?.name ?? '')
  const [emoji, setEmoji] = useState(theme?.emoji ?? '')
  const [emojis, setEmojis] = useState(theme?.emojis.join(' ') ?? '')
  const [active, setActive] = useState(theme?.active ?? true)
  const [busy, setBusy] = useState(false)
  const count = new Set(splitEmojis(emojis)).size

  const save = async () => {
    setBusy(true)
    try {
      await saveTheme({
        id: theme?._id,
        name,
        emoji,
        emojis: splitEmojis(emojis),
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
      title={theme ? `${theme.name} aanpassen` : 'Nieuw thema'}
      busy={busy}
      canSave={!!name.trim() && !!emoji.trim() && count >= 9}
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
        label={`Figuurtjes (${count}; minstens 9, het grootste bord gebruikt er 18)`}
      >
        <textarea
          value={emojis}
          onChange={e => setEmojis(e.target.value)}
          style={{ ...textAreaStyle, fontSize: 22 }}
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

/** Memory themes: sets of emoji. */
export function MemoryTab() {
  const themes = useQuery(api.functions.contentAdmin.listMemoryThemes, {})
  const removeTheme = useMutation(api.functions.contentAdmin.removeMemoryTheme)
  const { success, error: toastError } = useToast()
  const [editing, setEditing] = useState<Theme | 'new' | null>(null)
  const [removing, setRemoving] = useState<Theme | null>(null)

  if (themes === undefined) return <LoadingState />

  return (
    <YStack gap='$3'>
      <XStack>
        <Button icon={<Plus size={16} />} onPress={() => setEditing('new')}>
          <ButtonText>Thema toevoegen</ButtonText>
        </Button>
      </XStack>
      {editing !== null && (
        <ThemeForm
          key={editing === 'new' ? 'new' : editing._id}
          theme={editing === 'new' ? null : editing}
          onDone={() => setEditing(null)}
        />
      )}
      {themes.map(theme => (
        <Row key={theme._id}>
          <Text fontSize={28}>{theme.emoji}</Text>
          <YStack flex={1} minWidth={200}>
            <Text weight='semibold'>
              {theme.name}
              {!theme.active && ' (verborgen)'}
            </Text>
            <Text size='$3' variant='muted' numberOfLines={1}>
              {theme.emojis.join(' ')}
            </Text>
          </YStack>
          <Button
            size='$3'
            chromeless
            aria-label={`${theme.name} aanpassen`}
            onPress={() => setEditing(theme)}
            icon={<Pencil size={16} color={neutralColors.text.secondary} />}
          />
          <Button
            size='$3'
            chromeless
            aria-label={`${theme.name} verwijderen`}
            onPress={() => setRemoving(theme)}
            icon={<Trash2 size={16} color={brandColors.destructive} />}
          />
        </Row>
      ))}
      <ConfirmDialog
        open={removing !== null}
        onOpenChange={open => !open && setRemoving(null)}
        title='Thema verwijderen'
        description={`Het thema "${removing?.name}" wordt verwijderd.`}
        confirmLabel='Verwijderen'
        variant='danger'
        onConfirm={async () => {
          if (!removing) return
          try {
            await removeTheme({ id: removing._id })
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
