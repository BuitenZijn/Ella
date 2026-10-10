'use client'

import { YStack, XStack, Input, TextArea, Text, neutralColors } from '@ella/ui'
import type { LucideIcon } from 'lucide-react'

export interface EditableFieldProps {
  icon: LucideIcon
  label: string
  value: string | null | undefined
  editValue: string
  onEditChange: (value: string) => void
  isEditing: boolean
  placeholder: string
  emptyText?: string
  multiline?: boolean
  readOnly?: boolean
  hint?: string
}

export function EditableField({
  icon: Icon,
  label,
  value,
  editValue,
  onEditChange,
  isEditing,
  placeholder,
  emptyText = 'Niet ingevuld',
  multiline = false,
  readOnly = false,
  hint,
}: EditableFieldProps) {
  const displayValue = value || emptyText

  return (
    <YStack gap='$2'>
      <XStack gap='$2' alignItems='center'>
        <Icon size={16} color={neutralColors.text.secondary} />
        <Text size='$4' variant='muted' weight='semibold'>
          {label}
        </Text>
      </XStack>
      {isEditing && !readOnly ? (
        multiline ? (
          <TextArea
            value={editValue}
            onChangeText={onEditChange}
            placeholder={placeholder}
            size='$4'
            numberOfLines={3}
          />
        ) : (
          <Input
            value={editValue}
            onChangeText={onEditChange}
            placeholder={placeholder}
            size='$4'
          />
        )
      ) : (
        <>
          <Text
            size={value ? '$5' : '$4'}
            variant={value ? 'default' : 'muted'}
          >
            {displayValue}
          </Text>
          {hint && !isEditing && (
            <Text size='$3' variant='subtle'>
              {hint}
            </Text>
          )}
        </>
      )}
    </YStack>
  )
}
