import React from 'react'
import {
  YStack,
  XStack,
  Text,
  Button,
  ButtonText,
  neutralColors,
} from '@ella/ui'

export function Stars({ count, size = 36 }: { count: number; size?: number }) {
  return (
    <XStack
      gap='$2'
      justifyContent='center'
      accessibilityLabel={`${count} van 3 sterren`}
    >
      {[1, 2, 3].map(i => (
        <Text key={i} fontSize={size} opacity={i <= count ? 1 : 0.25}>
          ⭐
        </Text>
      ))}
    </XStack>
  )
}

export function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return m > 0 ? `${m}:${String(s).padStart(2, '0')} min` : `${s} sec`
}

interface GameDoneProps {
  title: string
  emoji?: string
  stars?: number
  /** Lines such as "Tijd: 1:20 min" */
  lines: string[]
  onAgain: () => void
  againLabel?: string
  onBack?: () => void
  backLabel?: string
  children?: React.ReactNode
}

/** The end of a game: stars, the numbers, and play again. */
export function GameDone({
  title,
  emoji = '🎉',
  stars,
  lines,
  onAgain,
  againLabel = 'Nog eens',
  onBack,
  backLabel = 'Ander spel',
  children,
}: GameDoneProps) {
  return (
    <YStack gap='$4' alignItems='center' paddingVertical='$5'>
      <Text fontSize={64}>{emoji}</Text>
      <Text size='$8' weight='bold' textAlign='center'>
        {title}
      </Text>
      {stars !== undefined && <Stars count={stars} />}
      <YStack gap='$1' alignItems='center'>
        {lines.map(line => (
          <Text key={line} size='$5' color={neutralColors.text.secondary}>
            {line}
          </Text>
        ))}
      </YStack>
      {children}
      <YStack gap='$2' alignSelf='stretch'>
        <Button size='$5' onPress={onAgain}>
          <ButtonText>{againLabel}</ButtonText>
        </Button>
        {onBack && (
          <Button size='$5' variant='outline' onPress={onBack}>
            <ButtonText>{backLabel}</ButtonText>
          </Button>
        )}
      </YStack>
    </YStack>
  )
}
