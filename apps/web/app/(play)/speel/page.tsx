'use client'

import {
  Suspense,
  useCallback,
  useEffect,
  useState,
  useSyncExternalStore,
} from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useMutation, useQuery } from 'convex/react'
import type { FunctionReturnType } from 'convex/server'
import { api } from '@ella/backend/api'
import {
  CLUE_NUMBER_MAX,
  CLUE_WORD_MAX,
  PLAYER_NAME_MAX,
  TEAM_LABELS,
  clueProblem,
  otherTeam,
} from '@ella/backend/types'
import { Board, TEAM_COLORS } from '@/components/codenames/Board'
import { getErrorMessage } from '@/lib/errorMessage'

type View = NonNullable<
  FunctionReturnType<typeof api.functions.codenames.playerView>
>

const NEUTRAL_BG = '#4D4766'

// ============================================================================
// The player's token, kept in the browser per session code
// ============================================================================

const storageKey = (code: string) => `codenames:${code}`

function readToken(code: string): string | null {
  try {
    return localStorage.getItem(storageKey(code))
  } catch {
    return null
  }
}

const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  window.addEventListener('storage', listener)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', listener)
  }
}

/** Without storage, a reload asks for the name again. */
const memory = new Map<string, string>()

function writeToken(code: string, token: string | null) {
  if (token) memory.set(code, token)
  else memory.delete(code)
  try {
    if (token) localStorage.setItem(storageKey(code), token)
    else localStorage.removeItem(storageKey(code))
  } catch {
    // The in-memory copy keeps this visit going.
  }
  listeners.forEach(l => l())
}

/** The kept token; undefined while prerendering (no storage there). */
function useToken(code: string): string | null | undefined {
  return useSyncExternalStore(
    subscribe,
    () => (code ? (memory.get(code) ?? readToken(code)) : null),
    () => undefined,
  )
}

// ============================================================================
// Small pieces
// ============================================================================

function Screen({
  background,
  children,
}: {
  background: string
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        minHeight: '100dvh',
        background,
        color: '#FFFFFF',
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        fontFamily: 'inherit',
        transition: 'background 300ms',
      }}
    >
      {children}
    </div>
  )
}

function BigButton({
  children,
  onClick,
  disabled,
  tone = 'light',
}: {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
  tone?: 'light' | 'ghost'
}) {
  return (
    <button
      type='button'
      onClick={onClick}
      disabled={disabled}
      style={{
        minHeight: 52,
        padding: '12px 18px',
        borderRadius: 14,
        border: tone === 'ghost' ? '2px solid rgba(255,255,255,0.7)' : 'none',
        background: tone === 'ghost' ? 'transparent' : '#FFFFFF',
        color: tone === 'ghost' ? '#FFFFFF' : '#1F1B2E',
        fontSize: 18,
        fontWeight: 800,
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'default' : 'pointer',
      }}
    >
      {children}
    </button>
  )
}

const inputStyle: React.CSSProperties = {
  minHeight: 52,
  padding: '10px 14px',
  borderRadius: 14,
  border: 'none',
  fontSize: 22,
  fontWeight: 700,
  width: '100%',
  boxSizing: 'border-box',
}

function ErrorText({ text }: { text: string | null }) {
  if (!text) return null
  return (
    <p
      role='alert'
      style={{
        margin: 0,
        padding: '8px 12px',
        borderRadius: 10,
        background: 'rgba(0,0,0,0.25)',
        fontWeight: 700,
      }}
    >
      {text}
    </p>
  )
}

function Title({ children }: { children: React.ReactNode }) {
  return (
    <h1 style={{ margin: 0, fontSize: 28, lineHeight: 1.2, fontWeight: 900 }}>
      {children}
    </h1>
  )
}

// ============================================================================
// Joining
// ============================================================================

function CodeForm({ onCode }: { onCode: (code: string) => void }) {
  const [code, setCode] = useState('')
  const digits = code.replace(/\D/g, '').slice(0, 6)
  return (
    <Screen background={NEUTRAL_BG}>
      <Title>Codenames</Title>
      <p style={{ margin: 0 }}>Typ de code die op het grote scherm staat.</p>
      <form
        onSubmit={e => {
          e.preventDefault()
          if (digits.length === 6) onCode(digits)
        }}
        style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
      >
        <input
          value={digits}
          onChange={e => setCode(e.target.value)}
          inputMode='numeric'
          autoComplete='off'
          placeholder='123456'
          aria-label='Spelcode'
          style={{ ...inputStyle, letterSpacing: 8, textAlign: 'center' }}
        />
        <BigButton
          onClick={() => onCode(digits)}
          disabled={digits.length !== 6}
        >
          Verder
        </BigButton>
      </form>
    </Screen>
  )
}

function NameForm({
  code,
  message,
  onJoined,
  onOtherCode,
}: {
  code: string
  message?: string
  onJoined: (token: string) => void
  onOtherCode: () => void
}) {
  const join = useMutation(api.functions.codenames.join)
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    setBusy(true)
    setError(null)
    try {
      const { token } = await join({ code, name })
      onJoined(token)
    } catch (err) {
      setError(getErrorMessage(err, 'Meedoen is niet gelukt.'))
      setBusy(false)
    }
  }

  return (
    <Screen background={NEUTRAL_BG}>
      <Title>Codenames</Title>
      {message && <ErrorText text={message} />}
      <p style={{ margin: 0 }}>
        Spel {code.slice(0, 3)} {code.slice(3)}. Hoe heet je?
      </p>
      <form
        onSubmit={e => {
          e.preventDefault()
          if (name.trim()) void submit()
        }}
        style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
      >
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          maxLength={PLAYER_NAME_MAX}
          autoComplete='nickname'
          placeholder='Je naam'
          aria-label='Je naam'
          style={inputStyle}
        />
        <ErrorText text={error} />
        <BigButton
          onClick={() => void submit()}
          disabled={busy || !name.trim()}
        >
          {busy ? 'Even geduld…' : 'Meedoen'}
        </BigButton>
      </form>
      <BigButton tone='ghost' onClick={onOtherCode}>
        Andere code
      </BigButton>
    </Screen>
  )
}

// ============================================================================
// In the game
// ============================================================================

function ClueForm({ token, view }: { token: string; view: View }) {
  const giveClue = useMutation(api.functions.codenames.giveClue)
  const [word, setWord] = useState('')
  const [number, setNumber] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const words = view.game!.cards.map(c => c.word)

  const submit = async () => {
    const problem = clueProblem(word, number, words)
    if (problem) return setError(problem)
    setError(null)
    try {
      await giveClue({ token, word, number })
    } catch (err) {
      setError(getErrorMessage(err, 'De hint is niet doorgegeven.'))
    }
  }

  return (
    <form
      onSubmit={e => {
        e.preventDefault()
        void submit()
      }}
      style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
    >
      <strong style={{ fontSize: 20 }}>
        Jouw hint: één woord en een getal
      </strong>
      <input
        value={word}
        onChange={e => setWord(e.target.value)}
        maxLength={CLUE_WORD_MAX}
        autoComplete='off'
        autoCapitalize='characters'
        placeholder='Hint'
        aria-label='Hint'
        style={inputStyle}
      />
      <div
        role='radiogroup'
        aria-label='Aantal kaarten'
        style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}
      >
        {Array.from({ length: CLUE_NUMBER_MAX }, (_, i) => i + 1).map(n => (
          <button
            key={n}
            type='button'
            role='radio'
            aria-checked={n === number}
            onClick={() => setNumber(n)}
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              border: '2px solid #FFFFFF',
              background: n === number ? '#FFFFFF' : 'transparent',
              color: n === number ? '#1F1B2E' : '#FFFFFF',
              fontSize: 20,
              fontWeight: 800,
            }}
          >
            {n}
          </button>
        ))}
      </div>
      <ErrorText text={error} />
      <BigButton onClick={() => void submit()} disabled={!word.trim()}>
        Geef hint: {word.trim().toUpperCase() || '…'} · {number}
      </BigButton>
    </form>
  )
}

function Playing({ token, view }: { token: string; view: View }) {
  const select = useMutation(api.functions.codenames.selectCard)
  const confirm = useMutation(api.functions.codenames.confirmCard)
  const endTurn = useMutation(api.functions.codenames.endTurn)
  const [error, setError] = useState<string | null>(null)
  const game = view.game!
  const { me } = view
  const myTurn = game.turn === me.team
  const guessing = myTurn && !me.isSpymaster && !!game.clue
  const selectedWord =
    game.selected !== null ? game.cards[game.selected]?.word : null

  const run = async (call: () => Promise<unknown>) => {
    setError(null)
    try {
      await call()
    } catch (err) {
      setError(getErrorMessage(err, 'Dat is niet gelukt.'))
    }
  }

  let status: string
  if (!myTurn) {
    status = game.clue
      ? `${TEAM_LABELS[game.turn]} raadt: ${game.clue.word} · ${game.clue.number}`
      : `${TEAM_LABELS[game.turn]} is aan de beurt.`
  } else if (!game.clue) {
    status = me.isSpymaster
      ? 'Jullie beurt! Bedenk een hint.'
      : 'Jullie beurt! Wacht op de hint van je spionnenmeester.'
  } else {
    status = `Hint: ${game.clue.word} · ${game.clue.number} — nog ${game.clue.guessesLeft} ${
      game.clue.guessesLeft === 1 ? 'gok' : 'gokken'
    }`
  }

  return (
    <>
      <div
        style={{
          padding: '10px 12px',
          borderRadius: 12,
          background: myTurn ? 'rgba(255,255,255,0.2)' : TEAM_COLORS[game.turn],
          border: myTurn ? 'none' : '2px solid rgba(255,255,255,0.6)',
          fontSize: 18,
          fontWeight: 800,
        }}
      >
        {status}
      </div>
      {me.isSpymaster && myTurn && !game.clue && (
        <ClueForm token={token} view={view} />
      )}
      <Board
        size='small'
        cards={game.cards}
        selected={game.selected}
        onPick={
          guessing
            ? index => void run(() => select({ token, index }))
            : undefined
        }
      />
      {me.isSpymaster && (
        <p style={{ margin: 0, fontSize: 14, opacity: 0.85 }}>
          Jij ziet de kleuren. Toon je scherm aan niemand!
        </p>
      )}
      <ErrorText text={error} />
      {guessing && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <BigButton
            disabled={game.selected === null}
            onClick={() =>
              game.selected !== null &&
              void run(() => confirm({ token, index: game.selected! }))
            }
          >
            {selectedWord ? `Kies ${selectedWord}` : 'Tik op een kaart'}
          </BigButton>
          <BigButton
            tone='ghost'
            onClick={() => void run(() => endTurn({ token }))}
          >
            Beurt stoppen
          </BigButton>
        </div>
      )}
    </>
  )
}

function PlayerScreen({
  token,
  view,
  onLeave,
}: {
  token: string
  view: View
  onLeave: () => void
}) {
  const leave = useMutation(api.functions.codenames.leave)
  const { me, game } = view
  const mates = view.players.filter(p => p.team === me.team)

  return (
    <Screen background={TEAM_COLORS[me.team]}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <span style={{ fontSize: 36, fontWeight: 900, letterSpacing: 2 }}>
          {TEAM_LABELS[me.team].toUpperCase()}
        </span>
        <span style={{ fontSize: 18, fontWeight: 700, opacity: 0.9 }}>
          {me.name}
          {me.isSpymaster ? ' · 👑 spionnenmeester' : ''}
        </span>
      </div>

      {view.status === 'lobby' && (
        <>
          <Title>Wacht tot het spel begint…</Title>
          <p style={{ margin: 0, fontSize: 18 }}>
            Jouw team: {mates.map(p => p.name).join(', ')}
          </p>
          {me.isSpymaster && (
            <p style={{ margin: 0, fontSize: 18 }}>
              Jij bent de spionnenmeester: jij ziet straks welke kaarten van
              jullie zijn en geeft de hints.
            </p>
          )}
        </>
      )}

      {view.status === 'playing' && game && (
        <Playing token={token} view={view} />
      )}

      {view.status === 'finished' && game?.winner && (
        <>
          <Title>
            {game.winner === me.team
              ? 'Jullie winnen! 🎉'
              : `${TEAM_LABELS[game.winner]} wint.`}
          </Title>
          {game.winReason === 'assassin' && (
            <p style={{ margin: 0, fontSize: 18 }}>
              {TEAM_LABELS[otherTeam(game.winner)]} vond de moordenaar.
            </p>
          )}
          <Board size='small' cards={game.cards} selected={null} />
          <p style={{ margin: 0 }}>Wacht op een nieuw spel…</p>
        </>
      )}

      <div style={{ marginTop: 'auto' }}>
        <BigButton
          tone='ghost'
          onClick={() => {
            void leave({ token })
            onLeave()
          }}
        >
          Spel verlaten
        </BigButton>
      </div>
    </Screen>
  )
}

/** Follows the player's view; when the player is gone, asks the name again. */
function InGame({
  code,
  token,
  onGone,
}: {
  code: string
  token: string
  onGone: (message: string) => void
}) {
  const view = useQuery(api.functions.codenames.playerView, { token })
  useEffect(() => {
    if (view === null) onGone('Je bent niet meer in het spel. Doe opnieuw mee.')
  }, [view, onGone])
  if (!view) return <Screen background={NEUTRAL_BG}>Laden…</Screen>
  if (view.code !== code) {
    return <Screen background={NEUTRAL_BG}>Dit is een ander spel.</Screen>
  }
  return <PlayerScreen token={token} view={view} onLeave={() => onGone('')} />
}

function PlayContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const code = (searchParams.get('code') ?? '').replace(/\D/g, '').slice(0, 6)
  const token = useToken(code)
  const [message, setMessage] = useState<string | undefined>()

  const onGone = useCallback(
    (text: string) => {
      writeToken(code, null)
      setMessage(text || undefined)
    },
    [code],
  )

  if (code.length !== 6) {
    return <CodeForm onCode={c => router.replace(`/speel?code=${c}`)} />
  }
  if (token === undefined)
    return <Screen background={NEUTRAL_BG}>Laden…</Screen>
  if (!token) {
    return (
      <NameForm
        code={code}
        message={message}
        onJoined={t => {
          writeToken(code, t)
          setMessage(undefined)
        }}
        onOtherCode={() => router.replace('/speel')}
      />
    )
  }
  return <InGame code={code} token={token} onGone={onGone} />
}

/** A player's phone in a Codenames game: join, then the team's screen. */
export default function PlayPage() {
  return (
    <Suspense fallback={<Screen background={NEUTRAL_BG}>Laden…</Screen>}>
      <PlayContent />
    </Suspense>
  )
}
