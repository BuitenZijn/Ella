'use client'

import { YStack, XStack, H1, Text, neutralColors, brandColors } from '@ella/ui'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

export interface StatusPageProps {
  icon: LucideIcon
  title: string
  message: string
  /** Actions: links or buttons back into the app */
  children?: ReactNode
}

/**
 * Full-page message for the error and not-found pages: an icon, a title,
 * a sentence and a row of ways out.
 */
export function StatusPage({
  icon: Icon,
  title,
  message,
  children,
}: StatusPageProps) {
  return (
    <YStack
      flex={1}
      alignItems='center'
      justifyContent='center'
      gap='$4'
      paddingHorizontal='$5'
      paddingVertical='$8'
      minHeight='calc(100dvh - 75px)'
    >
      <YStack
        width={72}
        height={72}
        borderRadius={36}
        alignItems='center'
        justifyContent='center'
        backgroundColor={neutralColors.background.elevated}
        borderWidth={2}
        borderColor={brandColors.primary}
      >
        <Icon size={30} color={brandColors.primary} aria-hidden />
      </YStack>
      <H1
        fontSize={28}
        lineHeight={36}
        fontWeight='700'
        textAlign='center'
        color={neutralColors.text.primary}
        style={{ fontFamily: 'var(--font-heading)' }}
      >
        {title}
      </H1>
      <Text
        size='$4'
        textAlign='center'
        maxWidth={460}
        color={neutralColors.text.secondary}
      >
        {message}
      </Text>
      {children && (
        <XStack
          gap='$3'
          marginTop='$2'
          flexWrap='wrap'
          justifyContent='center'
          alignItems='center'
        >
          {children}
        </XStack>
      )}
    </YStack>
  )
}
