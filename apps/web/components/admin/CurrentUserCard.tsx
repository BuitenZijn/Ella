'use client'

import {
  XStack,
  InfoCard,
  InfoCardTitle,
  InfoCardText,
  Avatar,
  AvatarText,
} from '@ella/ui'
import { RoleBadge } from '../common'

export interface CurrentUserCardProps {
  name?: string
  email: string
  role?: string
}

export function CurrentUserCard({
  name = 'Onbekend',
  email,
  role,
}: CurrentUserCardProps) {
  return (
    <InfoCard variant='success' borderWidth={2}>
      <InfoCardTitle variant='success'>Aangemeld als</InfoCardTitle>
      <XStack gap='$3' alignItems='center'>
        <Avatar variant='success' size='$5'>
          <AvatarText size='$5'>{name.charAt(0).toUpperCase()}</AvatarText>
        </Avatar>
        <InfoCard variant='success' padding={0} borderWidth={0} gap='$1'>
          <XStack gap='$2' alignItems='center'>
            <InfoCardTitle variant='success'>{name}</InfoCardTitle>
            <RoleBadge role={role} size='$3' />
          </XStack>
          <InfoCardText variant='success'>{email}</InfoCardText>
        </InfoCard>
      </XStack>
    </InfoCard>
  )
}
