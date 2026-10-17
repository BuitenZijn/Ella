'use client'

import { useCallback, useEffect, useId, useRef, type ReactNode } from 'react'
import { useMutation } from 'convex/react'
import { api } from '@ella/backend/api'
import type { Id } from '@ella/backend/dataModel'
import {
  YStack,
  XStack,
  Text,
  Button,
  ButtonText,
  neutralColors,
} from '@ella/ui'
import { X } from 'lucide-react'

/** Upload a picture for the shared content (not tied to an account). */
export function useContentUpload() {
  const generateUploadUrl = useMutation(
    api.functions.contentAdmin.generateUploadUrl,
  )
  return useCallback(
    async (file: File): Promise<Id<'_storage'>> => {
      const url = await generateUploadUrl()
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': file.type },
        body: file,
      })
      if (!response.ok)
        throw new Error(`Opladen mislukt (status ${response.status})`)
      const { storageId } = (await response.json()) as {
        storageId: Id<'_storage'>
      }
      return storageId
    },
    [generateUploadUrl],
  )
}

export const fieldStyle = {
  height: 40,
  padding: '0 10px',
  borderRadius: 8,
  border: `1px solid ${neutralColors.border.default}`,
  backgroundColor: neutralColors.background.elevated,
  color: neutralColors.text.primary,
  fontSize: 14,
  fontFamily: 'inherit',
} as const

export const textAreaStyle = {
  ...fieldStyle,
  height: 'auto',
  minHeight: 80,
  padding: 10,
  resize: 'vertical',
} as const

/** A labelled field in the management forms. */
export function Field({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <label
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        flex: 1,
        minWidth: 160,
      }}
    >
      <Text size='$3' weight='semibold'>
        {label}
      </Text>
      {children}
    </label>
  )
}

/**
 * An edit form in a modal over the list.
 *
 * A plain fixed overlay rather than a Tamagui Dialog: the image crop modal
 * opens on top of it, and a Dialog's animated (transformed) content would
 * pin that crop overlay inside the card and close on clicks in it. Escape
 * listens on the document, so the crop modal's window listener gets it
 * first (see listenForCropKeys).
 */
export function EditPanel({
  title,
  busy,
  canSave,
  onSave,
  onCancel,
  children,
}: {
  title: string
  busy: boolean
  canSave: boolean
  onSave: () => void
  onCancel: () => void
  children: ReactNode
}) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const titleId = useId()

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) onCancel()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [busy, onCancel])

  // Focus moves into the modal and the page behind stops scrolling; both
  // go back as it closes.
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialogRef.current?.focus()
    return () => {
      document.body.style.overflow = overflow
      previous?.focus?.()
    }
  }, [])

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
      }}
    >
      <div
        ref={dialogRef}
        role='dialog'
        aria-modal='true'
        aria-labelledby={titleId}
        tabIndex={-1}
        style={{
          outline: 'none',
          width: '100%',
          maxWidth: 640,
          maxHeight: '100%',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 16,
          border: `1px solid ${neutralColors.border.subtle}`,
          backgroundColor: neutralColors.background.elevated,
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.25)',
        }}
      >
        <XStack
          alignItems='center'
          justifyContent='space-between'
          gap='$3'
          padding='$4'
          paddingBottom='$2'
        >
          <Text id={titleId} size='$5' weight='semibold'>
            {title}
          </Text>
          <Button
            size='$3'
            chromeless
            aria-label='Sluiten'
            disabled={busy}
            onPress={onCancel}
            icon={<X size={18} color={neutralColors.text.secondary} />}
          />
        </XStack>
        <div style={{ overflowY: 'auto', minHeight: 0 }}>
          <YStack gap='$3' padding='$4' paddingTop='$2'>
            {children}
          </YStack>
        </div>
        <XStack
          gap='$2'
          justifyContent='flex-end'
          padding='$4'
          borderTopWidth={1}
          borderColor={neutralColors.border.subtle}
        >
          <Button variant='outline' disabled={busy} onPress={onCancel}>
            <ButtonText>Annuleren</ButtonText>
          </Button>
          <Button disabled={busy || !canSave} onPress={onSave}>
            <ButtonText>{busy ? 'Bewaren…' : 'Bewaren'}</ButtonText>
          </Button>
        </XStack>
      </div>
    </div>
  )
}

/** One row in a management list. */
export function Row({ children }: { children: ReactNode }) {
  return (
    <XStack
      alignItems='center'
      gap='$3'
      padding='$3'
      borderRadius='$3'
      backgroundColor={neutralColors.background.elevated}
      flexWrap='wrap'
    >
      {children}
    </XStack>
  )
}
