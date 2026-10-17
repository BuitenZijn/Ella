'use client'

import { useRef, useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '@ella/backend/api'
import type { Id } from '@ella/backend/dataModel'
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
import { ImageOff, Pencil, Plus, Trash2 } from 'lucide-react'
import {
  ConfirmDialog,
  ImageUpload,
  LoadingState,
  type ImageUploadRef,
} from '@/components/common'
import { getErrorMessage } from '@/lib/errorMessage'
import {
  EditPanel,
  Field,
  Row,
  fieldStyle,
  textAreaStyle,
  useContentUpload,
} from './shared'

type Table = 'dinosaurs' | 'planets'

type Entry = {
  _id: Id<'dinosaurs'> | Id<'planets'>
  number: number
  name: string
  scientificName: string
  description: string
  funFact: string
  image: Id<'_storage'> | null
  imageUrl: string | null
}

const NOUN: Record<Table, string> = {
  dinosaurs: 'dinosaurus',
  planets: 'planeet',
}

function EntryForm({
  table,
  entry,
  nextNumber,
  onDone,
}: {
  table: Table
  entry: Entry | null
  nextNumber: number
  onDone: () => void
}) {
  const saveEntry = useMutation(api.functions.contentAdmin.saveEntry)
  const upload = useContentUpload()
  const { success, error: toastError } = useToast()
  const [form, setForm] = useState({
    number: String(entry?.number ?? nextNumber),
    name: entry?.name ?? '',
    scientificName: entry?.scientificName ?? '',
    description: entry?.description ?? '',
    funFact: entry?.funFact ?? '',
  })
  const imageRef = useRef<ImageUploadRef>(null)
  const [imageBusy, setImageBusy] = useState(false)
  const [busy, setBusy] = useState(false)
  const set = (key: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm(f => ({ ...f, [key]: e.target.value }))

  const save = async () => {
    setBusy(true)
    try {
      const file = imageRef.current?.getPendingFile()
      const image = file
        ? await upload(file)
        : imageRef.current?.isRemoved
          ? null
          : undefined
      await saveEntry({
        table,
        id: entry?._id,
        ...form,
        number: Number(form.number),
        image,
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
      title={entry ? `${entry.name} aanpassen` : `Nieuwe ${NOUN[table]}`}
      busy={busy}
      canSave={!!form.name.trim() && !!form.description.trim() && !imageBusy}
      onSave={() => void save()}
      onCancel={onDone}
    >
      <XStack gap='$3' flexWrap='wrap'>
        <Field label='Nummer'>
          <input
            type='number'
            min={1}
            value={form.number}
            onChange={set('number')}
            style={fieldStyle}
          />
        </Field>
        <Field label='Naam'>
          <input
            value={form.name}
            onChange={set('name')}
            maxLength={80}
            style={fieldStyle}
          />
        </Field>
        <Field label='Wetenschappelijke naam'>
          <input
            value={form.scientificName}
            onChange={set('scientificName')}
            maxLength={80}
            style={fieldStyle}
          />
        </Field>
      </XStack>
      <Field label='Beschrijving'>
        <textarea
          value={form.description}
          onChange={set('description')}
          maxLength={2000}
          style={textAreaStyle}
        />
      </Field>
      <Field label='Leuk weetje'>
        <textarea
          value={form.funFact}
          onChange={set('funFact')}
          maxLength={2000}
          style={textAreaStyle}
        />
      </Field>
      <YStack gap={6}>
        <Text size='$3' weight='semibold'>
          Afbeelding
        </Text>
        <ImageUpload
          ref={imageRef}
          value={entry?.image}
          imageUrl={entry?.imageUrl}
          onProcessingChange={setImageBusy}
          preset='questCover'
          // Planets are cut into a square puzzle; dinosaurs show whole.
          cropAspect={table === 'planets' ? 'square' : 'free'}
          height={220}
        />
      </YStack>
    </EditPanel>
  )
}

/** Dinosaurs or planets: the cards of the dino quiz and planet puzzle. */
export function EntriesTab({ table }: { table: Table }) {
  const entries = useQuery(
    table === 'dinosaurs'
      ? api.functions.content.listDinosaurs
      : api.functions.content.listPlanets,
    {},
  ) as Entry[] | undefined
  const removeEntry = useMutation(api.functions.contentAdmin.removeEntry)
  const { success, error: toastError } = useToast()
  const [editing, setEditing] = useState<Entry | 'new' | null>(null)
  const [removing, setRemoving] = useState<Entry | null>(null)

  if (entries === undefined) return <LoadingState />

  return (
    <YStack gap='$3'>
      <XStack>
        <Button icon={<Plus size={16} />} onPress={() => setEditing('new')}>
          <ButtonText>
            {table === 'dinosaurs' ? 'Dinosaurus' : 'Planeet'} toevoegen
          </ButtonText>
        </Button>
      </XStack>
      {editing !== null && (
        <EntryForm
          key={editing === 'new' ? 'new' : editing._id}
          table={table}
          entry={editing === 'new' ? null : editing}
          nextNumber={Math.max(0, ...entries.map(e => e.number)) + 1}
          onDone={() => setEditing(null)}
        />
      )}
      {entries.map(entry => (
        <Row key={entry._id}>
          <Text weight='semibold' minWidth={28}>
            {entry.number}
          </Text>
          {entry.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- admin thumbnail from Convex storage
            <img
              src={entry.imageUrl}
              alt=''
              width={56}
              height={56}
              style={{ objectFit: 'cover', borderRadius: 8 }}
            />
          ) : (
            <YStack
              width={56}
              height={56}
              alignItems='center'
              justifyContent='center'
            >
              <ImageOff size={20} color={neutralColors.text.muted} />
            </YStack>
          )}
          <YStack flex={1} minWidth={160}>
            <Text weight='semibold'>{entry.name}</Text>
            <Text size='$3' variant='muted'>
              {entry.scientificName}
            </Text>
          </YStack>
          <Button
            size='$3'
            chromeless
            aria-label={`${entry.name} aanpassen`}
            onPress={() => setEditing(entry)}
            icon={<Pencil size={16} color={neutralColors.text.secondary} />}
          />
          <Button
            size='$3'
            chromeless
            aria-label={`${entry.name} verwijderen`}
            onPress={() => setRemoving(entry)}
            icon={<Trash2 size={16} color={brandColors.destructive} />}
          />
        </Row>
      ))}
      <ConfirmDialog
        open={removing !== null}
        onOpenChange={open => !open && setRemoving(null)}
        title='Verwijderen'
        description={`"${removing?.name}" en de afbeelding worden verwijderd.`}
        confirmLabel='Verwijderen'
        variant='danger'
        onConfirm={async () => {
          if (!removing) return
          try {
            await removeEntry({ table, id: removing._id })
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
