import React, { useState } from 'react'
import { ScrollView } from 'react-native'
import {
  QUESTIONS_PER_ROUND,
  SEQUENCE_LEVELS,
  sequenceQuestions,
  type SequenceLevel,
} from '@ella/backend/types'
import { YStack, XStack, Text, cardColors, semanticColors } from '@ella/ui'
import { AppShell } from '../../../components/shell'
import { ChoiceTile } from '../components/ChoiceTile'
import { Emoji } from '../components/Emoji'
import { GameDone, formatTime } from '../components/GameDone'
import { LevelPicker, RoundProgress } from '../components/LevelPicker'
import { NumberPad } from '../components/NumberPad'
import { useRound } from '../useRound'

/** One item of the row; the last box is the one to fill in. */
function Cell({
  value,
  picture,
  blank,
}: {
  value: string
  picture: boolean
  blank?: boolean
}) {
  return (
    <YStack
      minWidth={56}
      height={56}
      paddingHorizontal='$1'
      borderRadius={12}
      alignItems='center'
      justifyContent='center'
      backgroundColor={blank ? cardColors.text : cardColors.background}
      borderWidth={blank ? 3 : 0}
      borderStyle={blank ? 'dashed' : 'solid'}
      borderColor={cardColors.background}
    >
      {picture && value !== '?' ? (
        <Emoji size={30}>{value}</Emoji>
      ) : (
        <Text
          fontSize={24}
          lineHeight={30}
          weight='bold'
          color={blank ? cardColors.background : cardColors.text}
          allowFontScaling={false}
        >
          {value}
        </Text>
      )}
    </YStack>
  )
}

function SequencesGame({
  level,
  onAgain,
  onLevels,
}: {
  level: SequenceLevel
  onAgain: () => void
  onLevels: () => void
}) {
  const [questions] = useState(() =>
    sequenceQuestions(level, QUESTIONS_PER_ROUND, Math.random),
  )
  const round = useRound('reeksen', questions.length, {
    difficulty: level.label,
  })
  const [input, setInput] = useState('')
  const [picked, setPicked] = useState<string | null>(null)

  if (round.done) {
    return (
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <GameDone
          title='Slim gezien!'
          emoji='🔁'
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

  const q = questions[round.index]
  const open = round.answered === null
  const pictures = q.choices !== null
  // The blank box shows the answer once it is given.
  const blank = open ? (pictures ? '?' : input || '?') : q.answer
  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
      <RoundProgress
        index={round.index}
        total={questions.length}
        right={round.right}
      />
      <Text size='$6' weight='bold' textAlign='center'>
        Wat komt erna?
      </Text>
      <XStack flexWrap='wrap' gap='$2' justifyContent='center'>
        {q.items.map((item, i) => (
          <Cell key={i} value={item} picture={pictures} />
        ))}
        <Cell value={blank} picture={pictures} blank />
      </XStack>
      <Text
        size='$6'
        weight='bold'
        textAlign='center'
        color={
          round.answered
            ? semanticColors.success.text
            : semanticColors.error.text
        }
        opacity={open ? 0 : 1}
      >
        {round.answered ? 'Juist! 🎉' : `Het was ${q.answer}`}
      </Text>
      {q.choices ? (
        <XStack flexWrap='wrap' gap='$3'>
          {q.choices.map((choice, i) => (
            <ChoiceTile
              key={`${round.index}-${choice}`}
              label={`Keuze ${i + 1}`}
              hideLabel
              emoji={choice}
              emojiSize={44}
              disabled={!open}
              onPress={() => {
                setPicked(choice)
                round.answer(choice === q.answer)
              }}
              tone={
                open
                  ? undefined
                  : choice === q.answer
                    ? 'right'
                    : choice === picked
                      ? 'wrong'
                      : undefined
              }
            />
          ))}
        </XStack>
      ) : (
        <NumberPad
          value={input}
          maxLength={4}
          onChange={setInput}
          onSubmit={() => {
            round.answer(Number(input) === Number(q.answer))
            setInput('')
          }}
          disabled={!open}
        />
      )}
    </ScrollView>
  )
}

/** Reeksen: see the pattern or the number row, find what comes next. */
export function SequencesScreen() {
  const [level, setLevel] = useState<SequenceLevel | null>(null)
  const [game, setGame] = useState(0)
  return (
    <AppShell title='Reeksen'>
      {level ? (
        <SequencesGame
          key={game}
          level={level}
          onAgain={() => setGame(g => g + 1)}
          onLevels={() => setLevel(null)}
        />
      ) : (
        <LevelPicker
          options={SEQUENCE_LEVELS.map(l => ({
            key: l.id,
            emoji: l.emoji,
            label: l.label,
            sublabel: l.description,
            onPress: () => setLevel(l),
          }))}
        />
      )}
    </AppShell>
  )
}

export default SequencesScreen
