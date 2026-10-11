import React, { useEffect, useRef, useState } from 'react'
import { Pressable, ScrollView, useWindowDimensions } from 'react-native'
import { useQuery } from 'convex/react'
import { Image } from 'expo-image'
import { api } from '@ella/backend/api'
import {
  PLANET_EMOJI,
  PUZZLE_SIZES,
  isSolved,
  puzzleStars,
  shuffledBoard,
  swapTiles,
} from '@ella/backend/types'
import {
  YStack,
  XStack,
  Text,
  InfoCard,
  LoadingSpinner,
  brandColors,
  neutralColors,
} from '@ella/ui'
import { AppShell } from '../../../components/shell'
import { ChoiceTile } from '../components/ChoiceTile'
import { GameDone, formatTime } from '../components/GameDone'
import { playSound } from '../sounds'
import { useSaveScore } from '../useSaveScore'

const DEFAULT_SIZE = 4
const GAP = 2

type Planet = {
  _id: string
  number: number
  name: string
  scientificName: string
  description: string
  funFact: string
  imageUrl: string | null
}

function PuzzleGame({
  planet,
  size,
  onAgain,
  onPlanets,
}: {
  planet: Planet & { imageUrl: string }
  size: number
  onAgain: () => void
  onPlanets: () => void
}) {
  const saveScore = useSaveScore('planeten_puzzel')
  const { width } = useWindowDimensions()
  const [board, setBoard] = useState(() => shuffledBoard(size, Math.random))
  const [startedAt] = useState(() => Date.now())
  const [selected, setSelected] = useState<number | null>(null)
  const [moves, setMoves] = useState(0)
  const [doneAfter, setDoneAfter] = useState<number | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
    },
    [],
  )

  const boardSize = Math.min(width, 520) - 32
  const tile = (boardSize - GAP * (size - 1)) / size

  const tap = (place: number) => {
    if (doneAfter !== null) return
    if (selected === null) {
      setSelected(place)
      return
    }
    if (selected === place) {
      setSelected(null)
      return
    }
    const next = swapTiles(board, selected, place)
    const tries = moves + 1
    setBoard(next)
    setMoves(tries)
    setSelected(null)
    if (!isSolved(next)) return
    const seconds = Math.round((Date.now() - startedAt) / 1000)
    saveScore({
      timeSeconds: seconds,
      moves: tries,
      stars: puzzleStars(tries, size),
      difficulty: `${size}×${size}`,
      subject: planet.name,
    })
    // Let the whole planet show for a moment before the result.
    timer.current = setTimeout(() => {
      playSound('done')
      setDoneAfter(seconds)
    }, 600)
  }

  if (doneAfter !== null) {
    return (
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <GameDone
          title={`${planet.name} is af!`}
          emoji={PLANET_EMOJI[planet.number] ?? '🪐'}
          stars={puzzleStars(moves, size)}
          lines={[`Zetten: ${moves}`, `Tijd: ${formatTime(doneAfter)}`]}
          onAgain={onAgain}
          onBack={onPlanets}
          backLabel='Andere planeet'
        >
          <InfoCard variant='info' size='$3' alignSelf='stretch'>
            <Text weight='bold'>
              {planet.name} ({planet.scientificName})
            </Text>
            <Text>{planet.description}</Text>
            {planet.funFact ? <Text>💡 {planet.funFact}</Text> : null}
          </InfoCard>
        </GameDone>
      </ScrollView>
    )
  }

  return (
    <ScrollView
      contentContainerStyle={{ padding: 16, gap: 12, alignItems: 'center' }}
    >
      <Text color={neutralColors.text.secondary}>
        {PLANET_EMOJI[planet.number] ?? '🪐'} {planet.name} · {moves} zetten
      </Text>
      <Text size='$3' color={neutralColors.text.secondary} textAlign='center'>
        Tik op twee stukjes om ze van plaats te wisselen.
      </Text>
      <YStack gap={GAP}>
        {Array.from({ length: size }, (_, r) => (
          <XStack key={r} gap={GAP}>
            {Array.from({ length: size }, (_, c) => {
              const place = r * size + c
              const piece = board[place]
              const pr = Math.floor(piece / size)
              const pc = piece % size
              const isSelected = place === selected
              return (
                <Pressable
                  key={place}
                  onPress={() => tap(place)}
                  accessibilityRole='button'
                  accessibilityLabel={`Stukje ${place + 1}`}
                  accessibilityState={{ selected: isSelected }}
                >
                  <YStack
                    width={tile}
                    height={tile}
                    overflow='hidden'
                    borderRadius={4}
                    borderWidth={isSelected ? 3 : 0}
                    borderColor={brandColors.primary}
                  >
                    <Image
                      source={{ uri: planet.imageUrl }}
                      style={{
                        position: 'absolute',
                        width: tile * size + GAP * (size - 1),
                        height: tile * size + GAP * (size - 1),
                        left: -pc * (tile + GAP),
                        top: -pr * (tile + GAP),
                      }}
                      contentFit='cover'
                      accessibilityIgnoresInvertColors
                    />
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

/** Planetenpuzzel: swap the pieces until the planet is whole. */
export function PlanetPuzzleScreen() {
  const planets = useQuery(api.functions.content.listPlanets, {})
  const [planet, setPlanet] = useState<(Planet & { imageUrl: string }) | null>(
    null,
  )
  const [size, setSize] = useState(DEFAULT_SIZE)
  const [playing, setPlaying] = useState(false)
  const [game, setGame] = useState(0)

  let content: React.ReactNode
  if (planets === undefined) {
    content = <LoadingSpinner />
  } else if (planet && playing) {
    content = (
      <PuzzleGame
        key={game}
        planet={planet}
        size={size}
        onAgain={() => setGame(g => g + 1)}
        onPlanets={() => {
          setPlaying(false)
          setPlanet(null)
        }}
      />
    )
  } else if (planet) {
    content = (
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <Text size='$7' weight='bold' textAlign='center'>
          {PLANET_EMOJI[planet.number] ?? '🪐'} {planet.name}: hoeveel stukjes?
        </Text>
        <XStack flexWrap='wrap' gap='$3'>
          {PUZZLE_SIZES.map(s => (
            <ChoiceTile
              key={s}
              label={`${s}×${s}`}
              sublabel={`${s * s} stukjes`}
              selected={s === size}
              onPress={() => {
                setSize(s)
                setPlaying(true)
                setGame(g => g + 1)
              }}
            />
          ))}
        </XStack>
        <Text
          textAlign='center'
          color={neutralColors.text.secondary}
          onPress={() => setPlanet(null)}
        >
          ← Andere planeet
        </Text>
      </ScrollView>
    )
  } else {
    content = (
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <Text size='$7' weight='bold' textAlign='center'>
          Kies een planeet
        </Text>
        <XStack flexWrap='wrap' gap='$3'>
          {planets.map(p => {
            const imageUrl = p.imageUrl
            return (
              <ChoiceTile
                key={p._id}
                emoji={PLANET_EMOJI[p.number] ?? '🪐'}
                label={p.name}
                disabled={!imageUrl}
                onPress={() => imageUrl && setPlanet({ ...p, imageUrl })}
              />
            )
          })}
        </XStack>
      </ScrollView>
    )
  }

  return <AppShell title='Planetenpuzzel'>{content}</AppShell>
}

export default PlanetPuzzleScreen
