'use client'

import { YStack, PageTitle, BodyText } from '@ella/ui'

export interface PageHeaderProps {
  title: string
  description?: string
}

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <YStack gap='$2'>
      <PageTitle>{title}</PageTitle>
      {description && (
        <BodyText size='$5' muted>
          {description}
        </BodyText>
      )}
    </YStack>
  )
}
