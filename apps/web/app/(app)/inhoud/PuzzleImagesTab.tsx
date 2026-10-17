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
  useToast,
} from '@ella/ui'
import { Trash2 } from 'lucide-react'
import {
  ConfirmDialog,
  ImageUpload,
  LoadingState,
  type ImageUploadRef,
} from '@/components/common'
import { getErrorMessage } from '@/lib/errorMessage'
import { Field, fieldStyle, useContentUpload } from './shared'

/** The pictures that show through the multiplication grid. */
export function PuzzleImagesTab() {
  const images = useQuery(api.functions.contentAdmin.listPuzzleImages, {})
  const addImage = useMutation(api.functions.contentAdmin.addPuzzleImage)
  const setActive = useMutation(api.functions.contentAdmin.setPuzzleImageActive)
  const removeImage = useMutation(api.functions.contentAdmin.removePuzzleImage)
  const upload = useContentUpload()
  const { success, error: toastError } = useToast()
  const [name, setName] = useState('')
  const imageRef = useRef<ImageUploadRef>(null)
  const [hasFile, setHasFile] = useState(false)
  const [imageBusy, setImageBusy] = useState(false)
  const [busy, setBusy] = useState(false)
  const [formKey, setFormKey] = useState(0)
  const [removing, setRemoving] = useState<{
    _id: Id<'puzzleImages'>
    name: string
  } | null>(null)

  if (images === undefined) return <LoadingState />

  const add = async () => {
    const file = imageRef.current?.getPendingFile()
    if (!file) return
    setBusy(true)
    try {
      await addImage({ name, image: await upload(file) })
      success('Afbeelding toegevoegd.')
      setName('')
      setHasFile(false)
      setFormKey(k => k + 1)
    } catch (err) {
      toastError(getErrorMessage(err, 'Toevoegen is niet gelukt.'))
    }
    setBusy(false)
  }

  return (
    <YStack gap='$4'>
      <Text variant='muted'>
        Elke maaltafelpuzzel kiest één van de zichtbare afbeeldingen. Gebruik
        geen foto&apos;s van kinderen: andere gezinnen zien deze afbeeldingen
        ook.
      </Text>
      <XStack key={formKey} gap='$3' flexWrap='wrap' alignItems='flex-end'>
        <Field label='Naam'>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={80}
            style={fieldStyle}
          />
        </Field>
        <YStack gap={6} width={180}>
          <Text size='$3' weight='semibold'>
            Afbeelding
          </Text>
          <ImageUpload
            ref={imageRef}
            onFileChange={setHasFile}
            onProcessingChange={setImageBusy}
            preset='questCover'
            // The puzzle is a square grid.
            cropAspect='square'
            aspectRatio={1}
            placeholder='Kies een afbeelding'
          />
        </YStack>
        <Button
          disabled={busy || imageBusy || !hasFile || !name.trim()}
          onPress={() => void add()}
        >
          <ButtonText>{busy ? 'Opladen…' : 'Toevoegen'}</ButtonText>
        </Button>
      </XStack>
      <XStack gap='$3' flexWrap='wrap'>
        {images.map(image => (
          <YStack
            key={image._id}
            width={180}
            gap='$2'
            opacity={image.active ? 1 : 0.6}
          >
            {image.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element -- admin thumbnail from Convex storage
              <img
                src={image.imageUrl}
                alt={image.name}
                width={180}
                height={180}
                style={{ objectFit: 'cover', borderRadius: 8 }}
              />
            )}
            <XStack alignItems='center' gap='$2'>
              <Text flex={1} size='$3' weight='semibold' numberOfLines={1}>
                {image.name}
              </Text>
              <Button
                size='$3'
                chromeless
                aria-label={`${image.name} verwijderen`}
                onPress={() => setRemoving(image)}
                icon={<Trash2 size={16} color={brandColors.destructive} />}
              />
            </XStack>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type='checkbox'
                checked={image.active}
                onChange={e =>
                  setActive({ id: image._id, active: e.target.checked }).catch(
                    err =>
                      toastError(
                        getErrorMessage(err, 'Aanpassen is niet gelukt.'),
                      ),
                  )
                }
              />
              <Text size='$3'>Zichtbaar</Text>
            </label>
          </YStack>
        ))}
      </XStack>
      <ConfirmDialog
        open={removing !== null}
        onOpenChange={open => !open && setRemoving(null)}
        title='Afbeelding verwijderen'
        description={`"${removing?.name}" wordt verwijderd.`}
        confirmLabel='Verwijderen'
        variant='danger'
        onConfirm={async () => {
          if (!removing) return
          try {
            await removeImage({ id: removing._id })
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
