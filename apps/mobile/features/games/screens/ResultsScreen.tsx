import React from 'react'
import { ScrollView } from 'react-native'
import { useQuery } from 'convex/react'
import { api } from '@ella/backend/api'
import { GAME_EMOJI, GAME_LABELS } from '@ella/backend/types'
import {
  YStack,
  XStack,
  Text,
  LoadingSpinner,
  Theme,
  cardColors,
} from '@ella/ui'
import { AppShell } from '../../../components/shell'
import { useActiveChild } from '../ActiveChild'
import { formatTime } from '../components/GameDone'

const SHOWN = 5

type Score = {
  _id: string
  timeSeconds: number
  moves?: number
  mistakes?: number
  correct?: number
  total?: number
  points?: number
  stars?: number
  difficulty?: string
  subject?: string
  completedAt: number
}

function scoreLine(s: Score) {
  const parts = [formatTime(s.timeSeconds)]
  if (s.correct !== undefined && s.total !== undefined)
    parts.push(`${s.correct}/${s.total} juist`)
  if (s.moves !== undefined) parts.push(`${s.moves} zetten`)
  if (s.mistakes !== undefined) parts.push(`${s.mistakes} foutjes`)
  if (s.points !== undefined) parts.push(`${s.points} punten`)
  return parts.join(' · ')
}

/** The playing child's own results; never other children's. */
export function ResultsScreen() {
  const { child } = useActiveChild()
  const results = useQuery(
    api.functions.family.childResults,
    child ? { childId: child._id } : 'skip',
  )

  return (
    <AppShell title='Mijn scores'>
      {!child ? (
        <Text padding='$4' textAlign='center'>
          Kies eerst wie er speelt.
        </Text>
      ) : results === undefined ? (
        <LoadingSpinner />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
          <XStack alignItems='center' gap='$3'>
            <Text fontSize={40}>{child.avatar}</Text>
            <Text size='$7' weight='bold'>
              {child.name}
            </Text>
          </XStack>
          {results.games.map(({ game, played, recent }) => (
            <Theme key={game} name='card'>
              <YStack
                gap='$2'
                padding='$3'
                borderRadius={12}
                backgroundColor={cardColors.background}
              >
                <Text size='$5' weight='bold'>
                  {GAME_EMOJI[game]} {GAME_LABELS[game]}
                </Text>
                {played === 0 ? (
                  <Text variant='muted'>Nog niet gespeeld.</Text>
                ) : (
                  recent.slice(0, SHOWN).map(s => (
                    <XStack key={s._id} justifyContent='space-between' gap='$2'>
                      <YStack flex={1}>
                        <Text size='$3'>{scoreLine(s)}</Text>
                        <Text size='$2' variant='muted'>
                          {new Date(s.completedAt).toLocaleDateString('nl-BE')}
                          {s.difficulty ? ` · ${s.difficulty}` : ''}
                          {s.subject ? ` · ${s.subject}` : ''}
                        </Text>
                      </YStack>
                      {s.stars !== undefined && (
                        <Text size='$3'>{'⭐'.repeat(s.stars) || '–'}</Text>
                      )}
                    </XStack>
                  ))
                )}
              </YStack>
            </Theme>
          ))}
        </ScrollView>
      )}
    </AppShell>
  )
}

export default ResultsScreen
