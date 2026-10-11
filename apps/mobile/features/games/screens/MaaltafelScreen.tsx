import React, { useState } from 'react'
import { ScrollView, Pressable, useWindowDimensions } from 'react-native'
import { useQuery } from 'convex/react'
import { useNavigation } from '@react-navigation/native'
import { Image } from 'expo-image'
import { api } from '@ella/backend/api'
import {
  cellKey,
  cellValue,
  neighbours,
  pickBlanks,
  type MaaltafelSettings,
} from '@ella/backend/types'
import {
  YStack,
  XStack,
  Text,
  LoadingSpinner,
  brandColors,
  neutralColors,
  semanticColors,
} from '@ella/ui'
import { AppShell } from '../../../components/shell'
import { NumberPad } from '../components/NumberPad'
import { GameDone, formatTime } from '../components/GameDone'
import { playSound } from '../sounds'
import { useSaveScore } from '../useSaveScore'

interface Round {
  solved: Set<string>
  blanks: string[]
  /** Cells opened by a bomb, shown in red */
  bombed: Set<string>
}

function newBlanks(settings: MaaltafelSettings, solved: Set<string>) {
  return pickBlanks(
    settings.gridSize,
    settings.blanksPerRound,
    solved,
    Math.random,
  ).map(([r, c]) => cellKey(r, c))
}

function MaaltafelGame({
  settings,
  images,
  onAgain,
}: {
  settings: MaaltafelSettings
  images: string[]
  onAgain: () => void
}) {
  const navigation = useNavigation()
  const saveScore = useSaveScore('maaltafel_puzzel')
  const { width } = useWindowDimensions()
  const n = settings.gridSize
  const cell = Math.floor((Math.min(width, 520) - 32) / (n + 1))

  const [startedAt] = useState(() => Date.now())
  const [imageUrl] = useState(() =>
    images.length ? images[Math.floor(Math.random() * images.length)] : null,
  )
  const [round, setRound] = useState<Round>(() => ({
    solved: new Set(),
    blanks: newBlanks(settings, new Set()),
    bombed: new Set(),
  }))
  const [selected, setSelected] = useState<string | null>(
    () => round.blanks[0] ?? null,
  )
  const [input, setInput] = useState('')
  const [mistakes, setMistakes] = useState(0)
  const [hint, setHint] = useState<string | null>(null)
  const [doneAfter, setDoneAfter] = useState<number | null>(null)

  const [row, col] = selected ? selected.split('_').map(Number) : [0, 0]

  const answer = () => {
    if (!selected) return
    setInput('')
    if (Number(input) !== cellValue(row, col)) {
      playSound('wrong')
      setMistakes(m => m + 1)
      setHint(`Bijna! Probeer nog eens: ${row + 1} × ${col + 1}`)
      return
    }
    setHint(null)
    const solved = new Set(round.solved).add(selected)
    const bombed = new Set(round.bombed)
    if (Math.random() < settings.bombChance) {
      playSound('bomb')
      for (const [r, c] of neighbours(row, col, n)) {
        const key = cellKey(r, c)
        if (!solved.has(key)) bombed.add(key)
        solved.add(key)
      }
    } else {
      playSound('right')
    }
    let blanks = round.blanks.filter(k => !solved.has(k))
    if (blanks.length === 0) {
      if (solved.size === n * n) {
        playSound('done')
        const seconds = Math.round((Date.now() - startedAt) / 1000)
        setDoneAfter(seconds)
        saveScore({ timeSeconds: seconds, mistakes, difficulty: `${n}×${n}` })
      } else {
        blanks = newBlanks(settings, solved)
      }
    }
    setRound({ solved, blanks, bombed })
    setSelected(blanks[0] ?? null)
  }

  if (doneAfter !== null) {
    return (
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <GameDone
          title='Puzzel af!'
          lines={[`Tijd: ${formatTime(doneAfter)}`, `Foutjes: ${mistakes}`]}
          onAgain={onAgain}
          onBack={() => navigation.goBack()}
        >
          {imageUrl && (
            <Image
              source={{ uri: imageUrl }}
              style={{ width: cell * n, height: cell * n, borderRadius: 12 }}
              contentFit='cover'
              accessibilityIgnoresInvertColors
            />
          )}
        </GameDone>
      </ScrollView>
    )
  }

  const blankSet = new Set(round.blanks)
  const header = (label: string | number, key: string) => (
    <YStack
      key={key}
      width={cell}
      height={cell}
      alignItems='center'
      justifyContent='center'
    >
      <Text size='$2' weight='bold' color={brandColors.primary}>
        {label}
      </Text>
    </YStack>
  )

  return (
    <ScrollView
      contentContainerStyle={{ padding: 16, gap: 12, alignItems: 'center' }}
    >
      <Text color={neutralColors.text.secondary}>
        Nog {n * n - round.solved.size} vakjes · {mistakes} foutjes
      </Text>
      <YStack>
        <XStack>
          {header('×', 'corner')}
          {Array.from({ length: n }, (_, c) => header(c + 1, `h${c}`))}
        </XStack>
        <XStack>
          <YStack>
            {Array.from({ length: n }, (_, r) => header(r + 1, `v${r}`))}
          </YStack>
          <YStack
            width={cell * n}
            height={cell * n}
            borderRadius={8}
            overflow='hidden'
          >
            {imageUrl && (
              <Image
                source={{ uri: imageUrl }}
                style={{
                  position: 'absolute',
                  width: cell * n,
                  height: cell * n,
                }}
                contentFit='cover'
                accessibilityIgnoresInvertColors
              />
            )}
            {Array.from({ length: n }, (_, r) => (
              <XStack key={r}>
                {Array.from({ length: n }, (_, c) => {
                  const key = cellKey(r, c)
                  const isSolved = round.solved.has(key)
                  const isBlank = blankSet.has(key)
                  const isSelected = key === selected
                  return (
                    <Pressable
                      key={key}
                      disabled={!isBlank}
                      onPress={() => {
                        setSelected(key)
                        setInput('')
                        setHint(null)
                      }}
                      accessibilityLabel={
                        isBlank ? `${r + 1} keer ${c + 1}` : undefined
                      }
                    >
                      <YStack
                        width={cell}
                        height={cell}
                        alignItems='center'
                        justifyContent='center'
                        borderWidth={isSolved ? 0 : 0.5}
                        borderColor={neutralColors.border.subtle}
                        backgroundColor={
                          isSolved
                            ? round.bombed.has(key)
                              ? 'rgba(220, 80, 60, 0.25)'
                              : 'transparent'
                            : isSelected
                              ? brandColors.primary
                              : isBlank
                                ? 'white'
                                : brandColors.primaryLight
                        }
                      >
                        {!isSolved && (
                          <Text
                            size='$1'
                            weight={isBlank ? 'bold' : undefined}
                            color={
                              isSelected
                                ? 'white'
                                : isBlank
                                  ? brandColors.primary
                                  : neutralColors.text.muted
                            }
                          >
                            {isBlank
                              ? isSelected && input
                                ? input
                                : '?'
                              : cellValue(r, c)}
                          </Text>
                        )}
                      </YStack>
                    </Pressable>
                  )
                })}
              </XStack>
            ))}
          </YStack>
        </XStack>
      </YStack>
      {selected && (
        <YStack alignSelf='stretch' gap='$3' maxWidth={520} width='100%'>
          <Text size='$8' weight='bold' textAlign='center'>
            {row + 1} × {col + 1} = {input || '…'}
          </Text>
          {hint && (
            <Text textAlign='center' color={semanticColors.error.text}>
              {hint}
            </Text>
          )}
          <NumberPad
            value={input}
            onChange={setInput}
            onSubmit={answer}
            maxLength={3}
          />
        </YStack>
      )}
    </ScrollView>
  )
}

/**
 * Maaltafelpuzzel: answer the blanks of the multiplication grid; every right
 * answer uncovers a piece of the picture, and sometimes a bomb opens the
 * cells around it too.
 */
export function MaaltafelScreen() {
  const settings = useQuery(api.functions.content.gameSettings, {})
  const images = useQuery(api.functions.content.puzzleImageUrls, {})
  const [game, setGame] = useState(0)

  return (
    <AppShell title='Maaltafelpuzzel'>
      {settings === undefined || images === undefined ? (
        <LoadingSpinner />
      ) : (
        <MaaltafelGame
          key={game}
          settings={settings.maaltafel}
          images={images}
          onAgain={() => setGame(g => g + 1)}
        />
      )}
    </AppShell>
  )
}

export default MaaltafelScreen
