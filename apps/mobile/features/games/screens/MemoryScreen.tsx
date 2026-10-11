import React, { useEffect, useRef, useState } from 'react'
import { Pressable, ScrollView, useWindowDimensions } from 'react-native'
import { useQuery } from 'convex/react'
import { useNavigation } from '@react-navigation/native'
import { api } from '@ella/backend/api'
import {
  MEMORY_GRIDS,
  buildMemoryDeck,
  type MemoryGrid,
} from '@ella/backend/types'
import {
  YStack,
  XStack,
  Text,
  LoadingSpinner,
  brandColors,
  neutralColors,
} from '@ella/ui'
import { AppShell } from '../../../components/shell'
import { ChoiceTile } from '../components/ChoiceTile'
import { GameDone, formatTime } from '../components/GameDone'
import { playSound } from '../sounds'
import { useSaveScore } from '../useSaveScore'

const FLIP_BACK_MS = 900
const GAP = 6

type Theme = { _id: string; name: string; emoji: string; emojis: string[] }
type MatchSize = 2 | 3

interface Setup {
  theme: Theme
  match: MatchSize
  grid: MemoryGrid
}

function MemoryGame({
  setup,
  onAgain,
  onSetup,
}: {
  setup: Setup
  onAgain: () => void
  onSetup: () => void
}) {
  const saveScore = useSaveScore('memory')
  const { width } = useWindowDimensions()
  const { theme, match, grid } = setup
  const cards = grid.rows * grid.cols
  const [deck] = useState(() =>
    buildMemoryDeck(theme.emojis, match, cards, Math.random),
  )
  const [startedAt] = useState(() => Date.now())
  const [open, setOpen] = useState<number[]>([])
  const [found, setFound] = useState<Set<number>>(() => new Set())
  const [attempts, setAttempts] = useState(0)
  const [doneAfter, setDoneAfter] = useState<number | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
    },
    [],
  )

  const size = Math.floor(
    (Math.min(width, 560) - 32 - GAP * (grid.cols - 1)) / grid.cols,
  )

  if (!deck) {
    return (
      <Text padding='$4' textAlign='center'>
        Dit thema heeft te weinig figuurtjes voor dit bord. Kies een kleiner
        bord.
      </Text>
    )
  }

  const flip = (i: number) => {
    if (open.length >= match || open.includes(i) || found.has(i)) return
    const nowOpen = [...open, i]
    setOpen(nowOpen)
    if (nowOpen.length < match) return
    const tries = attempts + 1
    setAttempts(tries)
    if (nowOpen.every(j => deck[j] === deck[nowOpen[0]])) {
      const nowFound = new Set(found)
      for (const j of nowOpen) nowFound.add(j)
      setFound(nowFound)
      setOpen([])
      if (nowFound.size === deck.length) {
        playSound('done')
        const seconds = Math.round((Date.now() - startedAt) / 1000)
        setDoneAfter(seconds)
        saveScore({
          timeSeconds: seconds,
          moves: tries,
          difficulty: `${grid.label} ×${match}`,
          subject: theme.name,
        })
      } else {
        playSound('right')
      }
    } else {
      timer.current = setTimeout(() => setOpen([]), FLIP_BACK_MS)
    }
  }

  if (doneAfter !== null) {
    return (
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <GameDone
          title='Alles gevonden!'
          emoji={theme.emoji}
          lines={[`Beurten: ${attempts}`, `Tijd: ${formatTime(doneAfter)}`]}
          onAgain={onAgain}
          onBack={onSetup}
          backLabel='Ander bord'
        />
      </ScrollView>
    )
  }

  return (
    <ScrollView
      contentContainerStyle={{ padding: 16, gap: 12, alignItems: 'center' }}
    >
      <Text color={neutralColors.text.secondary}>
        {theme.emoji} {theme.name} · {attempts} beurten · zoek{' '}
        {match === 2 ? 'paren' : 'drietallen'}
      </Text>
      <YStack gap={GAP}>
        {Array.from({ length: grid.rows }, (_, r) => (
          <XStack key={r} gap={GAP}>
            {Array.from({ length: grid.cols }, (_, c) => {
              const i = r * grid.cols + c
              const shown = open.includes(i) || found.has(i)
              return (
                <Pressable
                  key={i}
                  onPress={() => flip(i)}
                  accessibilityRole='button'
                  accessibilityLabel={shown ? deck[i] : `Kaart ${i + 1}`}
                >
                  <YStack
                    width={size}
                    height={size}
                    borderRadius={10}
                    alignItems='center'
                    justifyContent='center'
                    backgroundColor={
                      shown
                        ? neutralColors.background.elevated
                        : brandColors.primary
                    }
                    borderWidth={2}
                    borderColor={
                      found.has(i)
                        ? brandColors.accent
                        : neutralColors.border.subtle
                    }
                    opacity={found.has(i) ? 0.6 : 1}
                  >
                    <Text fontSize={size * 0.5}>{shown ? deck[i] : '❔'}</Text>
                  </YStack>
                </Pressable>
              )
            })}
          </XStack>
        ))}
      </YStack>
    </ScrollView>
  )
}

/** Memory: find pairs or trios of emoji in a theme. */
export function MemoryScreen() {
  const navigation = useNavigation()
  const themes = useQuery(api.functions.content.listMemoryThemes, {})
  const [theme, setTheme] = useState<Theme | null>(null)
  const [match, setMatch] = useState<MatchSize | null>(null)
  const [setup, setSetup] = useState<Setup | null>(null)
  const [game, setGame] = useState(0)

  let content: React.ReactNode
  if (themes === undefined) {
    content = <LoadingSpinner />
  } else if (setup) {
    content = (
      <MemoryGame
        key={game}
        setup={setup}
        onAgain={() => setGame(g => g + 1)}
        onSetup={() => setSetup(null)}
      />
    )
  } else {
    const step = !theme
      ? 'Kies een thema'
      : !match
        ? 'Paren of drietallen?'
        : 'Hoe groot is het bord?'
    content = (
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <Text size='$7' weight='bold' textAlign='center'>
          {step}
        </Text>
        <XStack flexWrap='wrap' gap='$3'>
          {!theme
            ? themes.map(t => (
                <ChoiceTile
                  key={t._id}
                  emoji={t.emoji}
                  label={t.name}
                  onPress={() => setTheme(t)}
                />
              ))
            : !match
              ? ([2, 3] as const).map(m => (
                  <ChoiceTile
                    key={m}
                    emoji={m === 2 ? '✌️' : '🤟'}
                    label={m === 2 ? 'Paren' : 'Drietallen'}
                    sublabel={
                      m === 2 ? '2 dezelfde zoeken' : '3 dezelfde zoeken'
                    }
                    onPress={() => setMatch(m)}
                  />
                ))
              : MEMORY_GRIDS[match].map(g => (
                  <ChoiceTile
                    key={g.label}
                    label={g.label}
                    sublabel={`${g.rows * g.cols} kaarten`}
                    disabled={
                      new Set(theme.emojis).size < (g.rows * g.cols) / match
                    }
                    onPress={() => {
                      setSetup({ theme, match, grid: g })
                      setGame(n => n + 1)
                    }}
                  />
                ))}
        </XStack>
        <Text
          textAlign='center'
          color={neutralColors.text.secondary}
          onPress={() =>
            match
              ? setMatch(null)
              : theme
                ? setTheme(null)
                : navigation.goBack()
          }
        >
          ← Terug
        </Text>
      </ScrollView>
    )
  }

  return <AppShell title='Memory'>{content}</AppShell>
}

export default MemoryScreen
