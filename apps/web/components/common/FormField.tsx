'use client'

import { YStack, BodyText, FormInput, StyledTextArea } from '@ella/ui'
import { useId, type ReactNode } from 'react'

export interface FormFieldProps {
  label: string
  description?: string
  required?: boolean
  children?: ReactNode
}

interface FieldLayoutProps extends FormFieldProps {
  labelId: string
  descriptionId: string
  /** Label the children as a group (set for anything but a single input) */
  group?: boolean
}

function FieldLayout({
  label,
  description,
  required,
  children,
  labelId,
  descriptionId,
  group,
}: FieldLayoutProps) {
  return (
    <YStack gap='$3'>
      <YStack gap='$2'>
        <BodyText id={labelId} size='$5' fontWeight='600'>
          {label}
          {required && <span aria-hidden> *</span>}
        </BodyText>
        {description && (
          <BodyText id={descriptionId} muted>
            {description}
          </BodyText>
        )}
      </YStack>
      {group ? (
        <YStack
          role='group'
          aria-labelledby={labelId}
          aria-describedby={description ? descriptionId : undefined}
        >
          {children}
        </YStack>
      ) : (
        children
      )}
    </YStack>
  )
}

/**
 * A labelled form section. The label names its children as a group, which
 * suits a set of option buttons; for a single text input use TextInputField,
 * which labels the input itself.
 */
export function FormField(props: FormFieldProps) {
  const labelId = useId()
  const descriptionId = useId()
  return (
    <FieldLayout
      {...props}
      labelId={labelId}
      descriptionId={descriptionId}
      group
    />
  )
}

export interface TextInputFieldProps extends FormFieldProps {
  value: string
  onChangeText: (value: string) => void
  placeholder?: string
  multiline?: boolean
  numberOfLines?: number
}

export function TextInputField({
  label,
  description,
  required,
  value,
  onChangeText,
  placeholder,
  multiline,
  numberOfLines,
}: TextInputFieldProps) {
  const labelId = useId()
  const descriptionId = useId()
  const a11y = {
    'aria-labelledby': labelId,
    'aria-describedby': description ? descriptionId : undefined,
    'aria-required': required || undefined,
  }

  return (
    <FieldLayout
      label={label}
      description={description}
      required={required}
      labelId={labelId}
      descriptionId={descriptionId}
    >
      {multiline ? (
        <StyledTextArea
          {...a11y}
          size='$5'
          placeholder={placeholder}
          value={value}
          onChangeText={onChangeText}
          numberOfLines={numberOfLines}
        />
      ) : (
        <FormInput
          {...a11y}
          inputSize='lg'
          placeholder={placeholder}
          value={value}
          onChange={e => onChangeText(e.target.value)}
        />
      )}
    </FieldLayout>
  )
}
