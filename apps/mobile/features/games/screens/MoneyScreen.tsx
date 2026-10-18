import React, { useState } from 'react'
import { Pressable, ScrollView } from 'react-native'
import {
  MONEY_LEVELS,
  QUESTIONS_PER_ROUND,
  formatEuro,
  moneyQuestions,
  type MoneyLevel,
} from '@ella/backend/types'
import {
  YStack,
  XStack,
  Text,
  Button,
  ButtonText,
  cardColors,
  neutralColors,
  semanticColors,
} from '@ella/ui'
import { AppShell } from '../../../components/shell'
import { Emoji } from '../components/Emoji'
import { GameDone, formatTime } from '../components/GameDone'
import { LevelPicker, RoundProgress } from '../components/LevelPicker'
import { playSound } from '../sounds'
import { useRound } from '../useRound'

/** More pieces than this in the wallet is never needed */
const WALLET_MAX = 30

/** Coins are round; notes (from €5) are rectangles in their own colour. */
const NOTE_COLORS: Record<number, string> = {
  500: '#8E9196',
  1000: '#C4423B',
  2000: '#3D6FC4',
}

function Piece({
  cents,
  onPress,
  small,
}: {
  cents: number
  onPress: () => void
  small?: boolean
}) {
  const note = cents >= 500
  const coin = small ? 44 : 60
  const label = cents < 100 ? `${cents}c` : `€${cents / 100}`
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole='button'
      accessibilityLabel={formatEuro(cents, true)}
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
    >
      <YStack
        width={note ? coin * 1.6 : coin}
        height={note ? coin * 0.85 : coin}
        borderRadius={note ? 6 : coin / 2}
        alignItems='center'
        justifyContent='center'
        backgroundColor={
          note ? NOTE_COLORS[cents] : cents >= 100 ? '#C9CDD3' : '#E2B53E'
        }
        borderWidth={cents >= 100 && !note ? 4 : 2}
        borderColor={note ? 'rgba(0,0,0,0.25)' : '#B08A23'}
      >
        <Text
          fontSize={small ? 13 : 17}
          lineHeight={small ? 16 : 21}
          weight='bold'
          color={note ? '#FFFFFF' : '#3B2F0B'}
          allowFontScaling={false}
        >
          {label}
        </Text>
      </YStack>
    </Pressable>
  )
}

function MoneyGame({
  level,
  onAgain,
  onLevels,
}: {
  level: MoneyLevel
  onAgain: () => void
  onLevels: () => void
}) {
  const [questions] = useState(() =>
    moneyQuestions(level, QUESTIONS_PER_ROUND, Math.random),
  )
  const round = useRound('geld_tellen', questions.length, {
    difficulty: level.label,
  })
  const [wallet, setWallet] = useState<number[]>([])
  const [hint, setHint] = useState<string | null>(null)
  const [triedWrong, setTriedWrong] = useState(false)
  const [mistakes, setMistakes] = useState(0)
  const q = questions[round.index]
  const paid = wallet.reduce((sum, c) => sum + c, 0)
  const open = round.answered === null

  const pay = () => {
    if (paid === q.cents) {
      // Paid right after a try counts as wrong, but still sounds right.
      round.answer(!triedWrong, { mistakes }, 'right')
      setWallet([])
      setHint(null)
      setTriedWrong(false)
      return
    }
    playSound('wrong')
    setTriedWrong(true)
    setMistakes(m => m + 1)
    setHint(
      paid < q.cents
        ? `Nog ${formatEuro(q.cents - paid)} te weinig`
        : `${formatEuro(paid - q.cents)} te veel`,
    )
  }

  if (round.done) {
    return (
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <GameDone
          title='Alles betaald!'
          emoji='💶'
          stars={round.done.stars}
          lines={[
            `${round.right} van ${questions.length} in één keer juist`,
            `Tijd: ${formatTime(round.done.seconds)}`,
          ]}
          onAgain={onAgain}
          onBack={onLevels}
          backLabel='Ander niveau'
        />
      </ScrollView>
    )
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
      <RoundProgress
        index={round.index}
        total={questions.length}
        right={round.right}
      />
      <YStack alignItems='center' gap='$1'>
        <Emoji size={72}>{q.item}</Emoji>
        <Text size='$7' weight='bold' textAlign='center'>
          Dit kost {formatEuro(q.cents)}
        </Text>
      </YStack>
      <YStack
        gap='$2'
        padding='$3'
        minHeight={110}
        borderRadius={16}
        borderWidth={2}
        borderStyle='dashed'
        borderColor={cardColors.background}
      >
        <Text weight='bold' color={cardColors.background}>
          Jij betaalt: {formatEuro(paid)}
        </Text>
        <XStack flexWrap='wrap' gap='$2'>
          {wallet.map((cents, i) => (
            <Piece
              key={i}
              small
              cents={cents}
              onPress={() =>
                open && setWallet(w => w.filter((_, j) => j !== i))
              }
            />
          ))}
        </XStack>
        {wallet.length > 0 && open && (
          <Text size='$2' color={neutralColors.text.secondary}>
            Tik op een munt om ze terug te nemen.
          </Text>
        )}
      </YStack>
      <Text
        size='$5'
        weight='bold'
        textAlign='center'
        color={open ? semanticColors.error.text : semanticColors.success.text}
        opacity={hint || !open ? 1 : 0}
      >
        {round.answered === true
          ? 'Juist betaald! 🎉'
          : round.answered === false
            ? 'Gelukt, de volgende keer in één keer!'
            : (hint ?? ' ')}
      </Text>
      <XStack flexWrap='wrap' gap='$3' justifyContent='center'>
        {level.pieces.map(cents => (
          <Piece
            key={cents}
            cents={cents}
            onPress={() => {
              if (!open || wallet.length >= WALLET_MAX) return
              setHint(null)
              setWallet(w => [...w, cents].sort((a, b) => b - a))
            }}
          />
        ))}
      </XStack>
      <XStack gap='$2'>
        <Button
          flex={1}
          size='$5'
          variant='outline'
          disabled={!open || wallet.length === 0}
          onPress={() => {
            setWallet([])
            setHint(null)
          }}
        >
          <ButtonText>Leeg</ButtonText>
        </Button>
        <Button
          flex={2}
          size='$5'
          disabled={!open || wallet.length === 0}
          onPress={pay}
        >
          <ButtonText>Betaal</ButtonText>
        </Button>
      </XStack>
    </ScrollView>
  )
}

/** Geld tellen: pay the exact price with euro coins and notes. */
export function MoneyScreen() {
  const [level, setLevel] = useState<MoneyLevel | null>(null)
  const [game, setGame] = useState(0)
  return (
    <AppShell title='Geld tellen'>
      {level ? (
        <MoneyGame
          key={game}
          level={level}
          onAgain={() => setGame(g => g + 1)}
          onLevels={() => setLevel(null)}
        />
      ) : (
        <LevelPicker
          options={MONEY_LEVELS.map(l => ({
            key: l.id,
            emoji: l.emoji,
            label: l.label,
            sublabel: `Tot ${formatEuro(l.maxCents)}`,
            onPress: () => setLevel(l),
          }))}
        />
      )}
    </AppShell>
  )
}

export default MoneyScreen
