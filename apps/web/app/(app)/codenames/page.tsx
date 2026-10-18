'use client'

import { useSyncExternalStore } from 'react'
import { useMutation, useQuery } from 'convex/react'
import type { FunctionReturnType } from 'convex/server'
import { QRCodeSVG } from 'qrcode.react'
import { api } from '@ella/backend/api'
import type { Id } from '@ella/backend/dataModel'
import {
  MIN_PLAYERS_PER_TEAM,
  TEAM_LABELS,
  otherTeam,
  type Team,
} from '@ella/backend/types'
import {
  YStack,
  XStack,
  Text,
  Button,
  ButtonText,
  neutralColors,
  useToast,
} from '@ella/ui'
import { ArrowLeftRight, Crown, Maximize, Play, X } from 'lucide-react'
import { LoadingState, PageHeader } from '@/components/common'
import { Board, TEAM_COLORS } from '@/components/codenames/Board'
import { getErrorMessage } from '@/lib/errorMessage'

type HostView = NonNullable<
  FunctionReturnType<typeof api.functions.codenames.hostSession>
>

/** Wrap a mutation so a failure shows as a toast. */
function useAction<A>(run: (args: A) => Promise<unknown>) {
  const { error } = useToast()
  return (args: A) =>
    run(args).catch(err => error(getErrorMessage(err, 'Dat is niet gelukt.')))
}

const noSubscription = () => () => {}

function JoinPanel({ code, small }: { code: string; small?: boolean }) {
  // window is only there in the browser; the page is prerendered.
  const origin = useSyncExternalStore(
    noSubscription,
    () => window.location.origin,
    () => '',
  )
  const url = origin && `${origin}/speel?code=${code}`
  return (
    <YStack alignItems='center' gap='$2'>
      {url && (
        <div
          style={{
            background: '#FFFFFF',
            padding: small ? 6 : 14,
            borderRadius: 12,
          }}
        >
          <QRCodeSVG value={url} size={small ? 96 : 260} marginSize={0} />
        </div>
      )}
      <Text size={small ? '$3' : '$5'} variant='muted'>
        {small ? 'Meedoen:' : 'Scan de code of ga naar'}
      </Text>
      {!small && url && (
        <Text size='$4' weight='semibold'>
          {url.replace(/^https?:\/\//, '').replace(/\?.*$/, '')}
        </Text>
      )}
      <Text
        fontSize={small ? 22 : 56}
        lineHeight={small ? 28 : 64}
        weight='bold'
        letterSpacing={small ? 2 : 6}
      >
        {code.slice(0, 3)} {code.slice(3)}
      </Text>
    </YStack>
  )
}

function TeamColumn({ team, session }: { team: Team; session: HostView }) {
  const move = useAction(useMutation(api.functions.codenames.movePlayer))
  const spymaster = useAction(useMutation(api.functions.codenames.setSpymaster))
  const remove = useAction(useMutation(api.functions.codenames.removePlayer))
  const players = session.players.filter(p => p.team === team)
  const args = (playerId: Id<'codenamesPlayers'>) => ({
    sessionId: session._id,
    playerId,
  })
  return (
    <YStack
      flex={1}
      minWidth={260}
      gap='$2'
      padding='$4'
      borderRadius={16}
      backgroundColor={TEAM_COLORS[team]}
    >
      <Text size='$7' weight='bold' color='#FFFFFF'>
        {TEAM_LABELS[team]} ({players.length})
      </Text>
      {players.length === 0 && (
        <Text color='rgba(255,255,255,0.8)'>Nog niemand.</Text>
      )}
      {players.map(p => (
        <XStack
          key={p._id}
          alignItems='center'
          gap='$2'
          padding='$2'
          borderRadius={10}
          backgroundColor='rgba(255,255,255,0.15)'
        >
          {p.isSpymaster && <Crown size={18} color='#FFC531' />}
          <Text flex={1} weight='semibold' color='#FFFFFF' numberOfLines={1}>
            {p.name}
            {p.isSpymaster ? ' · spionnenmeester' : ''}
          </Text>
          {!p.isSpymaster && (
            <Button
              size='$2'
              chromeless
              aria-label={`${p.name} spionnenmeester maken`}
              onPress={() => void spymaster(args(p._id))}
              icon={<Crown size={16} color='#FFFFFF' />}
            />
          )}
          {session.status !== 'playing' && (
            <Button
              size='$2'
              chromeless
              aria-label={`${p.name} naar ${TEAM_LABELS[otherTeam(team)]}`}
              onPress={() => void move(args(p._id))}
              icon={<ArrowLeftRight size={16} color='#FFFFFF' />}
            />
          )}
          <Button
            size='$2'
            chromeless
            aria-label={`${p.name} verwijderen`}
            onPress={() => void remove(args(p._id))}
            icon={<X size={16} color='#FFFFFF' />}
          />
        </XStack>
      ))}
    </YStack>
  )
}

function Lobby({ session }: { session: HostView }) {
  const start = useAction(useMutation(api.functions.codenames.startGame))
  const count = (team: Team) =>
    session.players.filter(p => p.team === team).length
  const missing = (['red', 'blue'] as const)
    .filter(t => count(t) < MIN_PLAYERS_PER_TEAM)
    .map(t => TEAM_LABELS[t])
  return (
    <YStack gap='$5'>
      <XStack gap='$5' flexWrap='wrap' alignItems='flex-start'>
        <YStack
          padding='$5'
          borderRadius={16}
          borderWidth={2}
          borderColor={neutralColors.border.default}
          alignItems='center'
        >
          <JoinPanel code={session.code} />
        </YStack>
        <XStack flex={1} gap='$4' flexWrap='wrap' minWidth={300}>
          <TeamColumn team='red' session={session} />
          <TeamColumn team='blue' session={session} />
        </XStack>
      </XStack>
      <XStack gap='$3' alignItems='center' flexWrap='wrap'>
        <Button
          size='$5'
          icon={<Play size={18} />}
          disabled={missing.length > 0}
          onPress={() => void start({ sessionId: session._id })}
        >
          <ButtonText>Start het spel</ButtonText>
        </Button>
        <Text variant='muted'>
          {missing.length > 0
            ? `${missing.join(' en ')} heeft nog spelers nodig (minstens ${MIN_PLAYERS_PER_TEAM} per team).`
            : 'De kroon is de spionnenmeester; tik op een kroon om te wisselen.'}
        </Text>
      </XStack>
    </YStack>
  )
}

function Game({ session }: { session: HostView }) {
  const lobby = useAction(useMutation(api.functions.codenames.backToLobby))
  const game = session.game!
  const turnColor = TEAM_COLORS[game.turn]
  const banner = game.winner
    ? `${TEAM_LABELS[game.winner]} wint! 🎉${
        game.winReason === 'assassin'
          ? ` (${TEAM_LABELS[otherTeam(game.winner)]} vond de moordenaar)`
          : ''
      }`
    : game.clue
      ? `${TEAM_LABELS[game.turn]} raadt — hint: ${game.clue.word} · ${game.clue.number}`
      : `${TEAM_LABELS[game.turn]} is aan de beurt — wacht op de hint`
  return (
    <YStack gap='$4'>
      <XStack gap='$4' alignItems='center' flexWrap='wrap'>
        <YStack
          flex={1}
          minWidth={280}
          padding='$4'
          borderRadius={16}
          backgroundColor={game.winner ? TEAM_COLORS[game.winner] : turnColor}
        >
          <Text size='$8' weight='bold' color='#FFFFFF'>
            {banner}
          </Text>
          {game.clue && !game.winner && (
            <Text size='$5' color='rgba(255,255,255,0.85)'>
              Nog {game.clue.guessesLeft}{' '}
              {game.clue.guessesLeft === 1 ? 'gok' : 'gokken'}
            </Text>
          )}
        </YStack>
        {(['red', 'blue'] as const).map(team => (
          <YStack
            key={team}
            padding='$3'
            borderRadius={16}
            alignItems='center'
            backgroundColor={TEAM_COLORS[team]}
            minWidth={110}
          >
            <Text fontSize={44} lineHeight={52} weight='bold' color='#FFFFFF'>
              {game.left[team]}
            </Text>
            <Text color='#FFFFFF'>{TEAM_LABELS[team]} nog</Text>
          </YStack>
        ))}
        <JoinPanel code={session.code} small />
      </XStack>
      <Board cards={game.cards} selected={game.selected} />
      <XStack gap='$3' flexWrap='wrap' alignItems='center'>
        {game.winner ? (
          <Button
            size='$5'
            onPress={() => void lobby({ sessionId: session._id })}
          >
            <ButtonText>Nieuw spel</ButtonText>
          </Button>
        ) : (
          <Button
            variant='outline'
            onPress={() => void lobby({ sessionId: session._id })}
          >
            <ButtonText>Spel stoppen (terug naar de teams)</ButtonText>
          </Button>
        )}
        {game.clues.length > 0 && (
          <Text variant='muted'>
            Hints:{' '}
            {game.clues
              .map(c => `${TEAM_LABELS[c.team]} ${c.word} ${c.number}`)
              .join(' · ')}
          </Text>
        )}
      </XStack>
      {/* To replace a spymaster or remove a player who left. */}
      <XStack gap='$4' flexWrap='wrap'>
        <TeamColumn team='red' session={session} />
        <TeamColumn team='blue' session={session} />
      </XStack>
    </YStack>
  )
}

/** Codenames on the big screen: the host's lobby and board. */
export default function CodenamesHostPage() {
  const session = useQuery(api.functions.codenames.hostSession, {})
  const create = useAction(useMutation(api.functions.codenames.createSession))
  const end = useAction(useMutation(api.functions.codenames.endSession))

  return (
    <YStack flex={1} alignItems='center' padding='$5'>
      <YStack width='100%' maxWidth={1400} gap='$5'>
        <XStack alignItems='center' gap='$3' flexWrap='wrap'>
          <YStack flex={1}>
            <PageHeader
              title='Codenames'
              description='Zet dit scherm op een tv of laptop. Spelers doen mee met hun gsm.'
            />
          </YStack>
          {session && (
            <>
              <Button
                variant='outline'
                icon={<Maximize size={16} />}
                onPress={() =>
                  void document.documentElement.requestFullscreen?.()
                }
              >
                <ButtonText>Volledig scherm</ButtonText>
              </Button>
              <Button
                variant='outline'
                onPress={() => void end({ sessionId: session._id })}
              >
                <ButtonText>Sessie stoppen</ButtonText>
              </Button>
            </>
          )}
        </XStack>
        {session === undefined ? (
          <LoadingState />
        ) : session === null ? (
          <YStack gap='$3' alignItems='flex-start'>
            <Text>
              Start een sessie: je krijgt een code en een QR-code. Spelers
              worden verdeeld in team Rood en team Blauw.
            </Text>
            <Button
              size='$5'
              icon={<Play size={18} />}
              onPress={() => void create({})}
            >
              <ButtonText>Nieuwe sessie starten</ButtonText>
            </Button>
          </YStack>
        ) : session.status === 'lobby' ? (
          <Lobby session={session} />
        ) : (
          <Game session={session} />
        )}
      </YStack>
    </YStack>
  )
}
