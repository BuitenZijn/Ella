import React, { useState } from 'react'
import { ScrollView, useWindowDimensions } from 'react-native'
import {
  CLOCK_LEVELS,
  QUESTIONS_PER_ROUND,
  clockQuestions,
  clockText,
  type ClockLevel,
} from '@ella/backend/types'
import { YStack, XStack, Text } from '@ella/ui'
import { AppShell } from '../../../components/shell'
import { AnalogClock } from '../components/AnalogClock'
import { ChoiceTile } from '../components/ChoiceTile'
import { GameDone, formatTime } from '../components/GameDone'
import { LevelPicker, RoundProgress } from '../components/LevelPicker'
import { useRound } from '../useRound'

function ClockGame({
  level,
  onAgain,
  onLevels,
}: {
  level: ClockLevel
  onAgain: () => void
  onLevels: () => void
}) {
  const { width } = useWindowDimensions()
  const [questions] = useState(() =>
    clockQuestions(level, QUESTIONS_PER_ROUND, Math.random),
  )
  const round = useRound('klokkijken', questions.length, {
    difficulty: level.label,
  })
  const [picked, setPicked] = useState<string | null>(null)
  const q = questions[round.index]
  const right = clockText(q.time)

  if (round.done) {
    return (
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <GameDone
          title='Jij kan klokkijken!'
          emoji='⏰'
          stars={round.done.stars}
          lines={[
            `${round.right} van ${questions.length} juist`,
            `Tijd: ${formatTime(round.done.seconds)}`,
          ]}
          onAgain={onAgain}
          onBack={onLevels}
          backLabel='Ander niveau'
        />
      </ScrollView>
    )
  }

  const open = round.answered === null
  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
      <RoundProgress
        index={round.index}
        total={questions.length}
        right={round.right}
      />
      <Text size='$6' weight='bold' textAlign='center'>
        Hoe laat is het?
      </Text>
      <YStack alignItems='center'>
        <AnalogClock time={q.time} size={Math.min(width - 64, 260)} />
      </YStack>
      <XStack flexWrap='wrap' gap='$3'>
        {q.choices.map(choice => (
          <ChoiceTile
            key={`${round.index}-${choice}`}
            label={choice}
            disabled={!open}
            onPress={() => {
              setPicked(choice)
              round.answer(choice === right)
            }}
            tone={
              open
                ? undefined
                : choice === right
                  ? 'right'
                  : choice === picked
                    ? 'wrong'
                    : undefined
            }
          />
        ))}
      </XStack>
    </ScrollView>
  )
}

/** Klokkijken: read the clock, pick the time out of four. */
export function ClockScreen() {
  const [level, setLevel] = useState<ClockLevel | null>(null)
  const [game, setGame] = useState(0)
  return (
    <AppShell title='Klokkijken'>
      {level ? (
        <ClockGame
          key={game}
          level={level}
          onAgain={() => setGame(g => g + 1)}
          onLevels={() => setLevel(null)}
        />
      ) : (
        <LevelPicker
          options={CLOCK_LEVELS.map(l => ({
            key: l.id,
            emoji: l.emoji,
            label: l.label,
            onPress: () => setLevel(l),
          }))}
        />
      )}
    </AppShell>
  )
}

export default ClockScreen
