'use client'

import { useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '@ella/backend/api'
import type { Doc } from '@ella/backend/dataModel'
import { youtubeVideoId } from '@ella/backend/types'
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
import { ExternalLink, Pencil, Plus, Trash2 } from 'lucide-react'
import { ConfirmDialog, LoadingState } from '@/components/common'
import { getErrorMessage } from '@/lib/errorMessage'
import { EditPanel, Field, Row, fieldStyle, textAreaStyle } from './shared'

type Craft = Doc<'crafts'>
type Category = Craft['category']

const CATEGORIES: Category[] = [
  'tekenen',
  'vouwen',
  'schilderen',
  'verven',
  'slijm maken',
  'boetseren',
  'stempelen',
]

function CraftForm({
  craft,
  onDone,
}: {
  craft: Craft | null
  onDone: () => void
}) {
  const saveCraft = useMutation(api.functions.contentAdmin.saveCraft)
  const { success, error: toastError } = useToast()
  const [category, setCategory] = useState<Category>(
    craft?.category ?? 'tekenen',
  )
  const [title, setTitle] = useState(craft?.title ?? '')
  const [youtubeUrl, setYoutubeUrl] = useState(craft?.youtubeUrl ?? '')
  const [description, setDescription] = useState(craft?.description ?? '')
  const [busy, setBusy] = useState(false)
  const validLink = !!youtubeVideoId(youtubeUrl.trim())

  const save = async () => {
    setBusy(true)
    try {
      await saveCraft({
        id: craft?._id,
        category,
        title,
        youtubeUrl,
        description: description || undefined,
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
      title={craft ? 'Video aanpassen' : 'Nieuwe video'}
      busy={busy}
      canSave={!!title.trim() && validLink}
      onSave={() => void save()}
      onCancel={onDone}
    >
      <XStack gap='$3' flexWrap='wrap'>
        <Field label='Soort'>
          <select
            value={category}
            onChange={e => setCategory(e.target.value as Category)}
            style={fieldStyle}
          >
            {CATEGORIES.map(c => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>
        <Field label='Titel'>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            maxLength={80}
            style={fieldStyle}
          />
        </Field>
      </XStack>
      <Field label='YouTube-link'>
        <input
          value={youtubeUrl}
          onChange={e => setYoutubeUrl(e.target.value)}
          placeholder='https://www.youtube.com/watch?v=…'
          style={fieldStyle}
        />
      </Field>
      {youtubeUrl.trim() && !validLink && (
        <Text size='$3' color={brandColors.destructive}>
          Dit is geen geldige YouTube-link.
        </Text>
      )}
      <Field label='Beschrijving (optioneel)'>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          style={textAreaStyle}
        />
      </Field>
    </EditPanel>
  )
}

/** Craft videos per category. */
export function CraftsTab() {
  const crafts = useQuery(api.functions.content.listCrafts, {})
  const removeCraft = useMutation(api.functions.contentAdmin.removeCraft)
  const { success, error: toastError } = useToast()
  const [editing, setEditing] = useState<Craft | 'new' | null>(null)
  const [removing, setRemoving] = useState<Craft | null>(null)

  if (crafts === undefined) return <LoadingState />

  return (
    <YStack gap='$4'>
      <XStack>
        <Button icon={<Plus size={16} />} onPress={() => setEditing('new')}>
          <ButtonText>Video toevoegen</ButtonText>
        </Button>
      </XStack>
      {editing !== null && (
        <CraftForm
          key={editing === 'new' ? 'new' : editing._id}
          craft={editing === 'new' ? null : editing}
          onDone={() => setEditing(null)}
        />
      )}
      {CATEGORIES.map(category => {
        const inCategory = crafts.filter(c => c.category === category)
        return (
          <YStack key={category} gap='$2'>
            <Text weight='semibold' textTransform='capitalize'>
              {category} ({inCategory.length})
            </Text>
            {inCategory.map(craft => (
              <Row key={craft._id}>
                <Text flex={1} minWidth={200}>
                  {craft.title}
                </Text>
                <a
                  href={craft.youtubeUrl}
                  target='_blank'
                  rel='noreferrer'
                  aria-label={`${craft.title} openen op YouTube`}
                >
                  <ExternalLink
                    size={16}
                    color={neutralColors.text.secondary}
                  />
                </a>
                <Button
                  size='$3'
                  chromeless
                  aria-label={`${craft.title} aanpassen`}
                  onPress={() => setEditing(craft)}
                  icon={
                    <Pencil size={16} color={neutralColors.text.secondary} />
                  }
                />
                <Button
                  size='$3'
                  chromeless
                  aria-label={`${craft.title} verwijderen`}
                  onPress={() => setRemoving(craft)}
                  icon={<Trash2 size={16} color={brandColors.destructive} />}
                />
              </Row>
            ))}
          </YStack>
        )
      })}
      <ConfirmDialog
        open={removing !== null}
        onOpenChange={open => !open && setRemoving(null)}
        title='Video verwijderen'
        description={`"${removing?.title}" wordt verwijderd.`}
        confirmLabel='Verwijderen'
        variant='danger'
        onConfirm={async () => {
          if (!removing) return
          try {
            await removeCraft({ id: removing._id })
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
