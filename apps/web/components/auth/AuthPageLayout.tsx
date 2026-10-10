'use client'

import { YStack, neutralColors } from '@ella/ui'
import type { ReactNode } from 'react'

interface AuthPageLayoutProps {
  children: ReactNode
}

export function AuthPageLayout({ children }: AuthPageLayoutProps) {
  return (
    <YStack
      flex={1}
      backgroundColor={neutralColors.background.page}
      alignItems='center'
      justifyContent='center'
      padding='$4'
      // The page sits under the 75px sticky navbar.
      minHeight='calc(100dvh - 75px)'
    >
      <YStack width='100%' maxWidth={420} gap='$6'>
        {children}
      </YStack>
    </YStack>
  )
}
