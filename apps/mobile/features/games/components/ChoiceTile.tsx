import React from 'react'
import { Pressable } from 'react-native'
import {
  YStack,
  Text,
  brandColors,
  neutralColors,
  semanticColors,
} from '@ella/ui'

interface ChoiceTileProps {
  label: string
  emoji?: string
  sublabel?: string
  selected?: boolean
  onPress: () => void
  disabled?: boolean
  /** Fill colour for right/wrong feedback */
  tone?: 'right' | 'wrong'
}

/** A big tappable tile: choosing a game, a level, an answer. */
export function ChoiceTile({
  label,
  emoji,
  sublabel,
  selected,
  onPress,
  disabled,
  tone,
}: ChoiceTileProps) {
  const background =
    tone === 'right'
      ? semanticColors.success.background
      : tone === 'wrong'
        ? semanticColors.error.background
        : selected
          ? brandColors.primaryLight
          : neutralColors.background.elevated
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
                ? brandColors.primary
                : neutralColors.border.subtle
        }
        backgroundColor={background}
        alignItems='center'
        justifyContent='center'
        gap='$1'
      >
        {emoji && <Text fontSize={32}>{emoji}</Text>}
        <Text size='$5' weight='bold' textAlign='center'>
          {label}
        </Text>
        {sublabel && (
          <Text
            size='$3'
            color={neutralColors.text.secondary}
            textAlign='center'
          >
            {sublabel}
          </Text>
        )}
      </YStack>
    </Pressable>
  )
}
