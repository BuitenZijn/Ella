'use client'

import {
  YStack,
  SectionTitle,
  BodyText,
  IconContainer,
  brandColors,
} from '@ella/ui'
import { Compass, type LucideIcon } from 'lucide-react'

interface AuthHeaderProps {
  title: string
  description: string
  Icon?: LucideIcon
}

export function AuthHeader({
  title,
  description,
  Icon = Compass,
}: AuthHeaderProps) {
  return (
    <YStack gap='$3' alignItems='center'>
      <IconContainer size='$6' variant='primary'>
        <Icon size={32} color={brandColors.primary} />
      </IconContainer>
      <SectionTitle textAlign='center'>{title}</SectionTitle>
      <BodyText muted textAlign='center'>
        {description}
      </BodyText>
    </YStack>
  )
}
