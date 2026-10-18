import React, { useState } from 'react'
import { ScrollView, View } from 'react-native'
import {
  QUESTIONS_PER_ROUND,
  SPLIT_LEVELS,
  splitQuestions,
  type SplitLevel,
} from '@ella/backend/types'
import { YStack, XStack, Text, cardColors, semanticColors } from '@ella/ui'
import { AppShell } from '../../../components/shell'
import { GameDone, formatTime } from '../components/GameDone'
import { LevelPicker, RoundProgress } from '../components/LevelPicker'
import { NumberPad } from '../components/NumberPad'
import { useRound } from '../useRound'

const HOUSE = 240

function Room({
  value,
  filled,
  width,
}: {
  value: string
  /** The roof room is blue; the two rooms below are white */
  filled?: boolean
  width: number
}) {
  return (
    <YStack
      width={width}
      height={88}
      alignItems='center'
      justifyContent='center'
      backgroundColor={filled ? cardColors.background : cardColors.text}
      borderWidth={3}
      borderColor={cardColors.background}
    >
      <Text
        fontSize={44}
        lineHeight={54}
        weight='bold'
        color={filled ? cardColors.text : cardColors.background}
        allowFontScaling={false}
      >
        {value}
      </Text>
    </YStack>
  )
}

/** The "splitshuis": the number under the roof, its two parts below. */
function SplitHouse({
  total,
  left,
  right,
}: {
  total: number
  left: string
  right: string
}) {
  return (
    <YStack alignItems='center'>
      <View
        style={{
          width: 0,
          height: 0,
          borderLeftWidth: HOUSE / 2,
          borderRightWidth: HOUSE / 2,
          borderBottomWidth: 56,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderBottomColor: cardColors.background,
        }}
      />
      <Room value={String(total)} filled width={HOUSE} />
      <XStack marginTop={-3}>
        <Room value={left} width={HOUSE / 2} />
        <YStack marginLeft={-3}>
          <Room value={right} width={HOUSE / 2 + 3} />
        </YStack>
      </XStack>
    </YStack>
  )
}

function NumberBondsGame({
  level,
  onAgain,
  onLevels,
}: {
  level: SplitLevel
  onAgain: () => void
  onLevels: () => void
}) {
  const [questions] = useState(() =>
    splitQuestions(level, QUESTIONS_PER_ROUND, Math.random),
  )
  const round = useRound('splitsen', questions.length, {
    difficulty: level.label,
  })
  const [input, setInput] = useState('')
  const q = questions[round.index]

  if (round.done) {
    return (
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <GameDone
          title='Goed gesplitst!'
          emoji='🏠'
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

  // While the answer shows, the house shows the right part.
  const missing = round.answered === null ? input || '?' : String(q.answer)
  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
      <RoundProgress
        index={round.index}
        total={questions.length}
        right={round.right}
      />
      <Text size='$6' weight='bold' textAlign='center'>
        Hoeveel moet er nog bij?
      </Text>
      <SplitHouse
        total={q.total}
        left={q.knownLeft ? String(q.known) : missing}
        right={q.knownLeft ? missing : String(q.known)}
      />
      <Text
        size='$6'
        weight='bold'
        textAlign='center'
        color={
          round.answered
            ? semanticColors.success.text
            : semanticColors.error.text
        }
        opacity={round.answered === null ? 0 : 1}
      >
        {round.answered
          ? 'Juist! 🎉'
          : `${q.total} is ${q.known} en ${q.answer}`}
      </Text>
      <NumberPad
        value={input}
        maxLength={2}
        onChange={setInput}
        onSubmit={() => {
          round.answer(Number(input) === q.answer)
          setInput('')
        }}
        disabled={round.answered !== null}
      />
    </ScrollView>
  )
}

/** Splitsen: a number under the roof, one part given, find the other. */
export function NumberBondsScreen() {
  const [level, setLevel] = useState<SplitLevel | null>(null)
  const [game, setGame] = useState(0)
  return (
    <AppShell title='Splitsen'>
      {level ? (
        <NumberBondsGame
          key={game}
          level={level}
          onAgain={() => setGame(g => g + 1)}
          onLevels={() => setLevel(null)}
        />
      ) : (
        <LevelPicker
          options={SPLIT_LEVELS.map(l => ({
            key: l.id,
            emoji: l.emoji,
            label: l.label,
            sublabel: `Getallen van ${l.min} tot ${l.max}`,
            onPress: () => setLevel(l),
          }))}
        />
      )}
    </AppShell>
  )
}

export default NumberBondsScreen
