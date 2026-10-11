import React, { useState } from 'react'
import { ScrollView } from 'react-native'
import { useQuery } from 'convex/react'
import { useNavigation } from '@react-navigation/native'
import { Image } from 'expo-image'
import { api } from '@ella/backend/api'
import { dinoQuestions, starsFor } from '@ella/backend/types'
import {
  YStack,
  XStack,
  Text,
  Button,
  ButtonText,
  LoadingSpinner,
  InfoCard,
  neutralColors,
} from '@ella/ui'
import { AppShell } from '../../../components/shell'
import { ChoiceTile } from '../components/ChoiceTile'
import { GameDone, formatTime } from '../components/GameDone'
import { playSound } from '../sounds'
import { useSaveScore } from '../useSaveScore'

const STAR_THRESHOLDS: [number, number, number] = [50, 75, 90]

type Dino = {
  _id: string
  name: string
  scientificName: string
  funFact: string
  imageUrl: string | null
}

function DinoGame({ dinos, onAgain }: { dinos: Dino[]; onAgain: () => void }) {
  const navigation = useNavigation()
  const saveScore = useSaveScore('dino_quiz')
  const [questions] = useState(() => dinoQuestions(dinos, Math.random))
  const [startedAt] = useState(() => Date.now())
  const [index, setIndex] = useState(0)
  const [right, setRight] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  const [doneAfter, setDoneAfter] = useState<number | null>(null)

  const question = questions[index]

  const pick = (name: string) => {
    if (picked) return
    const ok = name === question.dino.name
    playSound(ok ? 'right' : 'wrong')
    setPicked(name)
    if (ok) setRight(r => r + 1)
  }

  const next = () => {
    setPicked(null)
    if (index + 1 < questions.length) {
      setIndex(index + 1)
      return
    }
    playSound('done')
    const seconds = Math.round((Date.now() - startedAt) / 1000)
    setDoneAfter(seconds)
    saveScore({
      timeSeconds: seconds,
      correct: right,
      total: questions.length,
      stars: starsFor(right, questions.length, STAR_THRESHOLDS),
    })
  }

  if (questions.length === 0) {
    return (
      <InfoCard variant='info' size='$4' margin='$4'>
        <Text>Er zijn nog geen dinosaurussen met een prent.</Text>
      </InfoCard>
    )
  }

  if (doneAfter !== null) {
    return (
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <GameDone
          title='Dinokenner!'
          emoji='🦖'
          stars={starsFor(right, questions.length, STAR_THRESHOLDS)}
          lines={[
            `${right} van ${questions.length} juist`,
            `Tijd: ${formatTime(doneAfter)}`,
          ]}
          onAgain={onAgain}
          onBack={() => navigation.goBack()}
        />
      </ScrollView>
    )
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
      <XStack justifyContent='space-between'>
        <Text color={neutralColors.text.secondary}>
          Dino {index + 1} van {questions.length}
        </Text>
        <Text color={neutralColors.text.secondary}>{right} juist</Text>
      </XStack>
      <Text size='$7' weight='bold' textAlign='center'>
        Welke dino is dit?
      </Text>
      <YStack
        height={240}
        borderRadius={16}
        overflow='hidden'
        backgroundColor={neutralColors.background.elevated}
      >
        <Image
          source={{ uri: question.dino.imageUrl ?? undefined }}
          style={{ width: '100%', height: '100%' }}
          contentFit='contain'
          accessibilityLabel='Een dinosaurus'
        />
      </YStack>
      <YStack gap='$2'>
        {question.choices.map(name => (
          <ChoiceTile
            key={name}
            label={name}
            disabled={!!picked}
            onPress={() => pick(name)}
            tone={
              picked && name === question.dino.name
                ? 'right'
                : picked === name
                  ? 'wrong'
                  : undefined
            }
          />
        ))}
      </YStack>
      {picked && (
        <YStack gap='$3'>
          <InfoCard variant='info' size='$3'>
            <Text weight='bold'>
              {question.dino.name} ({question.dino.scientificName})
            </Text>
            {question.dino.funFact ? (
              <Text>💡 {question.dino.funFact}</Text>
            ) : null}
          </InfoCard>
          <Button size='$5' onPress={next}>
            <ButtonText>
              {index + 1 < questions.length ? 'Volgende' : 'Klaar!'}
            </ButtonText>
          </Button>
        </YStack>
      )}
    </ScrollView>
  )
}

/** Dinoquiz: see a dinosaur, pick its name out of three. */
export function DinoQuizScreen() {
  const dinos = useQuery(api.functions.content.listDinosaurs, {})
  const [game, setGame] = useState(0)
  return (
    <AppShell title='Dinoquiz'>
      {dinos === undefined ? (
        <LoadingSpinner />
      ) : (
        <DinoGame
          key={game}
          dinos={dinos}
          onAgain={() => setGame(g => g + 1)}
        />
      )}
    </AppShell>
  )
}

export default DinoQuizScreen
