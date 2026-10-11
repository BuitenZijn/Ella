'use client'

import { useCallback, type ReactNode } from 'react'
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

/** The frame and buttons around an edit form. */
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
  return (
    <YStack
      gap='$3'
      padding='$4'
      borderRadius='$4'
      borderWidth={1}
      borderColor={neutralColors.border.subtle}
      backgroundColor={neutralColors.background.elevated}
    >
      <Text weight='semibold'>{title}</Text>
      {children}
      <XStack gap='$2'>
        <Button disabled={busy || !canSave} onPress={onSave}>
          <ButtonText>{busy ? 'Bewaren…' : 'Bewaren'}</ButtonText>
        </Button>
        <Button variant='outline' onPress={onCancel}>
          <ButtonText>Annuleren</ButtonText>
        </Button>
      </XStack>
    </YStack>
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
