import React, { useEffect, useRef, useState } from 'react'
import { ScrollView } from 'react-native'
import { useQuery } from 'convex/react'
import { useNavigation } from '@react-navigation/native'
import { api } from '@ella/backend/api'
import {
  exercisePoints,
  generateExercise,
  isRightAnswer,
  starsFor,
  type MathLevel,
} from '@ella/backend/types'
import {
  YStack,
  XStack,
  Text,
  LoadingSpinner,
  neutralColors,
  semanticColors,
} from '@ella/ui'
import { AppShell } from '../../../components/shell'
import { ChoiceTile } from '../components/ChoiceTile'
import { NumberPad } from '../components/NumberPad'
import { GameDone, formatTime } from '../components/GameDone'
import { playSound } from '../sounds'
import { useSaveScore } from '../useSaveScore'

const FEEDBACK_MS = 1200

function levelSummary(level: MathLevel) {
  const ops = [
    level.addition && '+',
    level.subtraction && '−',
    level.multiplication && '×',
    level.division && '÷',
    level.fractions && 'breuken',
  ].filter(Boolean)
  return `${ops.join(' ')} · tot ${level.maxNumber}`
}

function MathGame({
  level,
  onAgain,
  onLevels,
}: {
  level: MathLevel
  onAgain: () => void
  onLevels: () => void
}) {
  const saveScore = useSaveScore('rekenoefeningen')
  const [exercises] = useState(() =>
    Array.from({ length: level.questionsPerRound }, () =>
      generateExercise(level, Math.random),
    ),
  )
  const [startedAt] = useState(() => Date.now())
  const [index, setIndex] = useState(0)
  const [askedAt, setAskedAt] = useState(startedAt)
  const [now, setNow] = useState(startedAt)
  const [input, setInput] = useState('')
  const [right, setRight] = useState(0)
  const [points, setPoints] = useState(0)
  const [feedback, setFeedback] = useState<{
    right: boolean
    answer: number
  } | null>(null)
  const [doneAfter, setDoneAfter] = useState<number | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const exercise = exercises[index]
  const timeLeft =
    level.timeLimitSeconds > 0
      ? Math.max(0, level.timeLimitSeconds - Math.floor((now - askedAt) / 1000))
      : null

  const answer = (typed: string) => {
    if (feedback || doneAfter !== null) return
    const answeredAt = Date.now()
    const ok = isRightAnswer(exercise, typed)
    const total = right + (ok ? 1 : 0)
    const earned =
      points + exercisePoints(level, ok, (answeredAt - askedAt) / 1000)
    playSound(ok ? 'right' : 'wrong')
    setRight(total)
    setPoints(earned)
    setFeedback({ right: ok, answer: exercise.answer })
    timer.current = setTimeout(() => {
      setFeedback(null)
      setInput('')
      if (index + 1 < exercises.length) {
        const next = Date.now()
        setIndex(index + 1)
        setAskedAt(next)
        setNow(next)
        return
      }
      playSound('done')
      const seconds = Math.round((Date.now() - startedAt) / 1000)
      setDoneAfter(seconds)
      saveScore({
        timeSeconds: seconds,
        correct: total,
        total: exercises.length,
        points: earned,
        stars: starsFor(total, exercises.length, level.starThresholds),
        difficulty: level.label,
      })
    }, FEEDBACK_MS)
  }

  // The countdown; running out of time counts as a wrong answer.
  const answerRef = useRef(answer)
  useEffect(() => {
    answerRef.current = answer
  })
  useEffect(() => {
    if (level.timeLimitSeconds <= 0 || feedback || doneAfter !== null) return
    const id = setInterval(() => {
      const t = Date.now()
      setNow(t)
      if (t - askedAt >= level.timeLimitSeconds * 1000) answerRef.current('')
    }, 250)
    return () => clearInterval(id)
  }, [askedAt, feedback, doneAfter, level.timeLimitSeconds])
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
    },
    [],
  )

  if (doneAfter !== null) {
    return (
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <GameDone
          title={right === exercises.length ? 'Alles juist!' : 'Goed gedaan!'}
          stars={starsFor(right, exercises.length, level.starThresholds)}
          lines={[
            `${right} van ${exercises.length} juist`,
            `${points} punten`,
            `Tijd: ${formatTime(doneAfter)}`,
          ]}
          onAgain={onAgain}
          onBack={onLevels}
          backLabel='Ander niveau'
        />
      </ScrollView>
    )
  }

  const shown = exercise.text.replace(' - ', ' − ')
  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
      <XStack justifyContent='space-between'>
        <Text color={neutralColors.text.secondary}>
          Vraag {index + 1} van {exercises.length}
        </Text>
        <Text color={neutralColors.text.secondary}>{points} punten</Text>
      </XStack>
      {timeLeft !== null && (
        <YStack
          height={8}
          borderRadius={4}
          backgroundColor={neutralColors.background.hover}
          overflow='hidden'
        >
          <YStack
            height={8}
            width={`${(timeLeft / level.timeLimitSeconds) * 100}%`}
            backgroundColor={
              timeLeft <= 5
                ? semanticColors.error.main
                : semanticColors.success.main
            }
          />
        </YStack>
      )}
      <YStack alignItems='center' gap='$2' paddingVertical='$4'>
        <Text
          fontSize={40}
          lineHeight={50}
          weight='bold'
          textAlign='center'
          alignSelf='stretch'
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {shown} = {input || '?'}
        </Text>
        {feedback && (
          <Text
            size='$6'
            weight='bold'
            color={
              feedback.right
                ? semanticColors.success.text
                : semanticColors.error.text
            }
          >
            {feedback.right
              ? 'Juist! 🎉'
              : `Het was ${String(feedback.answer).replace('.', ',')}`}
          </Text>
        )}
        {exercise.text.includes('/') && !feedback && (
          <Text size='$3' color={neutralColors.text.secondary}>
            Antwoord als kommagetal, bv. 0,75
          </Text>
        )}
      </YStack>
      <NumberPad
        value={input}
        onChange={setInput}
        onSubmit={() => answer(input)}
        decimals={level.fractions}
        disabled={!!feedback}
      />
    </ScrollView>
  )
}

/** Rekenoefeningen: sums at a chosen level, against the clock, with stars. */
export function MathScreen() {
  const navigation = useNavigation()
  const settings = useQuery(api.functions.content.gameSettings, {})
  const [level, setLevel] = useState<MathLevel | null>(null)
  const [game, setGame] = useState(0)

  return (
    <AppShell title='Rekenoefeningen'>
      {settings === undefined ? (
        <LoadingSpinner />
      ) : level ? (
        <MathGame
          key={game}
          level={level}
          onAgain={() => setGame(g => g + 1)}
          onLevels={() => setLevel(null)}
        />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
          <Text size='$7' weight='bold' textAlign='center'>
            Kies je niveau
          </Text>
          {settings.mathLevels.map(l => (
            <ChoiceTile
              key={l.id}
              emoji={l.emoji}
              label={l.label}
              sublabel={`${levelSummary(l)} · ${l.questionsPerRound} vragen`}
              onPress={() => setLevel(l)}
            />
          ))}
          <Text
            textAlign='center'
            color={neutralColors.text.secondary}
            onPress={() => navigation.goBack()}
          >
            ← Terug
          </Text>
        </ScrollView>
      )}
    </AppShell>
  )
}

export default MathScreen
