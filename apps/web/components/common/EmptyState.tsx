'use client'

import {
  CenteredContainer,
  IconText,
  BodyText,
  Button,
  ButtonText,
  neutralColors,
  XStack,
} from '@ella/ui'
import type { ReactNode } from 'react'
import { Inbox, type LucideIcon } from 'lucide-react'

export interface EmptyStateProps {
  /** @deprecated Use Icon prop instead */
  icon?: string
  /** Lucide icon component */
  Icon?: LucideIcon
  title: string
  description?: string
  /** Legacy prop - use action.label instead */
  actionLabel?: string
  /** Icon to show in action button */
  actionIcon?: LucideIcon
  /** Legacy prop - use action.onPress instead */
  onAction?: () => void
  action?: {
    label: string
    onPress: () => void
  }
  children?: ReactNode
}

export function EmptyState({
  icon,
  Icon = Inbox,
  title,
  description,
  actionLabel,
  actionIcon: ActionIcon,
  onAction,
  action,
  children,
}: EmptyStateProps) {
  // Support both legacy props and new action object
  const actionConfig =
    action ??
    (actionLabel && onAction ? { label: actionLabel, onPress: onAction } : null)

  return (
    <CenteredContainer padding='$6' gap='$3'>
      {icon ? (
        <IconText>{icon}</IconText>
      ) : (
        <Icon size={32} color={neutralColors.text.muted} aria-hidden />
      )}
      <BodyText size='$5' fontWeight='600' textAlign='center'>
        {title}
      </BodyText>
      {description && (
        <BodyText muted textAlign='center' maxWidth={300}>
          {description}
        </BodyText>
      )}
      {actionConfig && (
        <Button size='$3' marginTop='$2' onPress={actionConfig.onPress}>
          <XStack alignItems='center' gap='$2'>
            {ActionIcon && (
              <ActionIcon
                size={16}
                color={neutralColors.text.onFill}
                aria-hidden
              />
            )}
            <ButtonText>{actionConfig.label}</ButtonText>
          </XStack>
        </Button>
      )}
      {children}
    </CenteredContainer>
  )
}
