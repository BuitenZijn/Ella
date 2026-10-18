import React from 'react'
import { ScrollView } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { XStack, Text, neutralColors } from '@ella/ui'
import { ChoiceTile } from './ChoiceTile'

export interface LevelOption {
  key: string
  emoji?: string
  label: string
  sublabel?: string
  onPress: () => void
}

/** The first step of a game: pick a level (or a list), or go back. */
export function LevelPicker({
  title = 'Kies je niveau',
  options,
}: {
  title?: string
  options: LevelOption[]
}) {
  const navigation = useNavigation()
  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text size='$7' weight='bold' textAlign='center'>
        {title}
      </Text>
      <XStack flexWrap='wrap' gap='$3'>
        {options.map(({ key, ...option }) => (
          <ChoiceTile key={key} {...option} />
        ))}
      </XStack>
      <Text
        textAlign='center'
        color={neutralColors.text.secondary}
        onPress={() => navigation.goBack()}
      >
        ← Terug
      </Text>
    </ScrollView>
  )
}

/** "Vraag 3 van 10 · 2 juist" above a question. */
export function RoundProgress({
  index,
  total,
  right,
}: {
  index: number
  total: number
  right: number
}) {
  return (
    <XStack justifyContent='space-between'>
      <Text color={neutralColors.text.secondary}>
        Vraag {index + 1} van {total}
      </Text>
      <Text color={neutralColors.text.secondary}>{right} juist</Text>
    </XStack>
  )
}
