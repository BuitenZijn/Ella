import React from 'react'
import { Pressable } from 'react-native'
import {
  Theme,
  YStack,
  Text,
  cardColors,
  neutralColors,
  semanticColors,
} from '@ella/ui'
import { Emoji } from './Emoji'

interface ChoiceTileProps {
  label: string
  emoji?: string
  emojiSize?: number
  /** Show only the emoji; the label is still read out by screen readers */
  hideLabel?: boolean
  sublabel?: string
  selected?: boolean
  onPress: () => void
  disabled?: boolean
  /** Fill colour for right/wrong feedback */
  tone?: 'right' | 'wrong'
}

/**
 * A big tappable tile: choosing a game, a level, an answer. Tiles are blue
 * with white text; a right or wrong answer turns green or red.
 */
export function ChoiceTile({
  label,
  emoji,
  emojiSize = 32,
  hideLabel,
  sublabel,
  selected,
  onPress,
  disabled,
  tone,
}: ChoiceTileProps) {
  const background =
    tone === 'right'
      ? semanticColors.success.main
      : tone === 'wrong'
        ? semanticColors.error.main
        : selected
          ? cardColors.hover
          : cardColors.background
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole='button'
      accessibilityLabel={label}
      accessibilityState={{ selected, disabled }}
      style={({ pressed }) => ({
        flexGrow: 1,
        flexBasis: '45%',
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <Theme name='card'>
        <YStack
          padding='$3'
          minHeight={72}
          borderRadius={16}
          borderWidth={2}
          borderColor={
            tone === 'right'
              ? semanticColors.success.border
              : tone === 'wrong'
                ? semanticColors.error.border
                : selected
                  ? neutralColors.text.primary
                  : cardColors.background
          }
          backgroundColor={background}
          alignItems='center'
          justifyContent='center'
          gap='$1'
        >
          {emoji && <Emoji size={emojiSize}>{emoji}</Emoji>}
          {!hideLabel && (
            <Text size='$5' weight='bold' textAlign='center'>
              {label}
            </Text>
          )}
          {sublabel && (
            <Text size='$3' variant='muted' textAlign='center'>
              {sublabel}
            </Text>
          )}
        </YStack>
      </Theme>
    </Pressable>
  )
}
