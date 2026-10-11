import React from 'react'
import { XStack, YStack, Text, cardColors } from '@ella/ui'
import { Pressable } from 'react-native'

const ROWS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
]

interface NumberPadProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  /** Allow a decimal comma and a minus sign (sums with fractions) */
  decimals?: boolean
  maxLength?: number
  disabled?: boolean
}

function Key({
  label,
  onPress,
  tone = 'plain',
  disabled,
}: {
  label: string
  onPress: () => void
  tone?: 'plain' | 'action'
  disabled?: boolean
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole='button'
      accessibilityLabel={label === '⌫' ? 'Wissen' : label}
      style={({ pressed }) => ({
        flex: 1,
        opacity: disabled ? 0.4 : pressed ? 0.7 : 1,
      })}
    >
      <YStack
        height={56}
        borderRadius={12}
        alignItems='center'
        justifyContent='center'
        backgroundColor={
          tone === 'action' ? cardColors.button : cardColors.background
        }
        borderWidth={1}
        borderColor={cardColors.background}
      >
        <Text
          size='$7'
          weight='bold'
          color={tone === 'action' ? cardColors.onButton : cardColors.text}
        >
          {label}
        </Text>
      </YStack>
    </Pressable>
  )
}

/** Big keys for children, so the phone's keyboard never covers the game. */
export function NumberPad({
  value,
  onChange,
  onSubmit,
  decimals,
  maxLength = 6,
  disabled,
}: NumberPadProps) {
  const type = (key: string) => {
    if (value.length < maxLength) onChange(value + key)
  }
  const bottomLeft = decimals ? (value === '' ? '-' : ',') : '⌫'
  return (
    <YStack gap='$2'>
      {ROWS.map(row => (
        <XStack key={row[0]} gap='$2'>
          {row.map(k => (
            <Key
              key={k}
              label={k}
              onPress={() => type(k)}
              disabled={disabled}
            />
          ))}
        </XStack>
      ))}
      <XStack gap='$2'>
        <Key
          label={bottomLeft}
          disabled={disabled || (bottomLeft === ',' && value.includes(','))}
          onPress={() =>
            bottomLeft === '⌫' ? onChange(value.slice(0, -1)) : type(bottomLeft)
          }
        />
        <Key label='0' onPress={() => type('0')} disabled={disabled} />
        {decimals ? (
          <Key
            label='⌫'
            onPress={() => onChange(value.slice(0, -1))}
            disabled={disabled}
          />
        ) : (
          <Key
            label='OK'
            tone='action'
            onPress={onSubmit}
            disabled={disabled || !value}
          />
        )}
      </XStack>
      {decimals && (
        <Key
          label='OK'
          tone='action'
          onPress={onSubmit}
          disabled={disabled || !value}
        />
      )}
    </YStack>
  )
}
