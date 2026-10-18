import React, { useState } from 'react'
import { ScrollView } from 'react-native'
import { useQuery } from 'convex/react'
import { api } from '@ella/backend/api'
import {
  QUESTIONS_PER_ROUND,
  wordQuestions,
  type WordList,
} from '@ella/backend/types'
import { YStack, XStack, Text, LoadingSpinner, InfoCard } from '@ella/ui'
import { AppShell } from '../../../components/shell'
import { ChoiceTile } from '../components/ChoiceTile'
import { Emoji } from '../components/Emoji'
import { GameDone, formatTime } from '../components/GameDone'
import { LevelPicker, RoundProgress } from '../components/LevelPicker'
import { useRound } from '../useRound'

function ReadingGame({
  list,
  onAgain,
  onLists,
}: {
  list: WordList
  onAgain: () => void
  onLists: () => void
}) {
  const [questions] = useState(() =>
    wordQuestions(list.words, QUESTIONS_PER_ROUND, Math.random),
  )
  const round = useRound('woordjes_lezen', questions.length, {
    subject: list.name,
  })
  const [picked, setPicked] = useState<string | null>(null)

  if (questions.length === 0) {
    return (
      <InfoCard variant='info' size='$4' margin='$4'>
        <Text>Deze lijst heeft te weinig woorden.</Text>
      </InfoCard>
    )
  }

  if (round.done) {
    return (
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <GameDone
          title='Goed gelezen!'
          emoji='📖'
          stars={round.done.stars}
          lines={[
            `${round.right} van ${questions.length} juist`,
            `Tijd: ${formatTime(round.done.seconds)}`,
          ]}
          onAgain={onAgain}
          onBack={onLists}
          backLabel='Andere woordjes'
        />
      </ScrollView>
    )
  }

  const q = questions[round.index]
  const open = round.answered === null
  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
      <RoundProgress
        index={round.index}
        total={questions.length}
        right={round.right}
      />
      <Text size='$6' weight='bold' textAlign='center'>
        {q.showWord ? 'Welke prent past bij dit woord?' : 'Welk woord is dit?'}
      </Text>
      <YStack alignItems='center' paddingVertical='$2'>
        {q.showWord ? (
          <Text
            fontSize={52}
            lineHeight={64}
            weight='bold'
            textAlign='center'
            alignSelf='stretch'
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {q.item.word}
          </Text>
        ) : (
          <Emoji size={96}>{q.item.emoji}</Emoji>
        )}
      </YStack>
      <XStack flexWrap='wrap' gap='$3'>
        {q.choices.map((choice, i) => (
          <ChoiceTile
            key={`${round.index}-${choice.word}`}
            label={q.showWord ? `Prent ${i + 1}` : choice.word}
            hideLabel={q.showWord}
            emoji={q.showWord ? choice.emoji : undefined}
            emojiSize={48}
            disabled={!open}
            onPress={() => {
              setPicked(choice.word)
              round.answer(choice.word === q.item.word)
            }}
            tone={
              open
                ? undefined
                : choice.word === q.item.word
                  ? 'right'
                  : choice.word === picked
                    ? 'wrong'
                    : undefined
            }
          />
        ))}
      </XStack>
    </ScrollView>
  )
}

/** Woordjes lezen: read a word and find its picture, or the other way round. */
export function ReadingScreen() {
  const lists = useQuery(api.functions.content.listWordLists, {})
  const [list, setList] = useState<WordList | null>(null)
  const [game, setGame] = useState(0)
  return (
    <AppShell title='Woordjes lezen'>
      {lists === undefined ? (
        <LoadingSpinner />
      ) : list ? (
        <ReadingGame
          key={game}
          list={list}
          onAgain={() => setGame(g => g + 1)}
          onLists={() => setList(null)}
        />
      ) : (
        <LevelPicker
          title='Kies je woordjes'
          options={lists.map(l => ({
            key: l._id,
            emoji: l.emoji,
            label: l.name,
            sublabel: `${l.words.length} woordjes`,
            onPress: () => setList(l),
          }))}
        />
      )}
    </AppShell>
  )
}

export default ReadingScreen
