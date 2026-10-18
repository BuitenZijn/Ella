/**
 * Codenames: a signed-in host runs a session on a big screen (the website),
 * players join on their phones with the session's code and just a name.
 *
 * Players have no account: joining hands out a random token that the
 * player's browser keeps and sends with every call. The secret key (whose
 * card is whose) never leaves the server except to the two spymasters, and
 * to everyone once a game is over.
 */

import { v } from 'convex/values'
import { internalMutation, mutation, query } from '../_generated/server'
import type { MutationCtx, QueryCtx } from '../_generated/server'
import type { Doc, Id } from '../_generated/dataModel'
import { internal } from '../_generated/api'
import { getCurrentUser, getCurrentUserOrNull } from '../lib/auth'
import { permanentError } from '../lib/errors'
import { generateRandomString } from '../lib/random'
import {
  DEFAULT_CODENAMES_WORDS,
  MAX_PLAYERS,
  MIN_PLAYERS_PER_TEAM,
  PLAYER_NAME_MAX,
  buildBoard,
  cardsLeft,
  clueProblem,
  guessOutcome,
  normalizeWord,
  otherTeam,
  smallerTeam,
  type Team,
} from '../lib/codenames'

/** Sessions nobody touched for this long are removed by a cron */
export const IDLE_SESSION_MS = 12 * 60 * 60 * 1000
const CLEANUP_BATCH = 20
const TOKEN_ALPHABET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

type Session = Doc<'codenamesSessions'>
type Player = Doc<'codenamesPlayers'>
type Game = NonNullable<Session['game']>

// ============================================================================
// Helpers
// ============================================================================

async function playersOf(ctx: QueryCtx, sessionId: Id<'codenamesSessions'>) {
  return await ctx.db
    .query('codenamesPlayers')
    .withIndex('by_session', q => q.eq('sessionId', sessionId))
    .collect()
}

/**
 * Each team's spymaster: the one the host picked while they are still in
 * that team, else the team's first player.
 */
function spymasters(session: Session, players: Player[]) {
  const pick = (team: Team) => {
    const chosen = team === 'red' ? session.redSpymaster : session.blueSpymaster
    const inTeam = players.filter(p => p.team === team)
    return inTeam.find(p => p._id === chosen)?._id ?? inTeam[0]?._id
  }
  return { red: pick('red'), blue: pick('blue') }
}

/** The board as everyone may see it; with `key`, also the hidden colours. */
function boardView(game: Game, key: boolean) {
  return {
    cards: game.words.map((word, i) => ({
      word,
      revealed: game.revealed[i],
      color: game.revealed[i] || key ? game.key[i] : null,
    })),
    turn: game.turn,
    startingTeam: game.startingTeam,
    clue: game.clue ?? null,
    selected: game.selected ?? null,
    clues: game.clues,
    winner: game.winner ?? null,
    winReason: game.winReason ?? null,
    left: {
      red: cardsLeft(game.key, game.revealed, 'red'),
      blue: cardsLeft(game.key, game.revealed, 'blue'),
    },
  }
}

function rosterView(session: Session, players: Player[]) {
  const sm = spymasters(session, players)
  return players.map(p => ({
    _id: p._id,
    name: p.name,
    team: p.team,
    isSpymaster: sm[p.team] === p._id,
  }))
}

async function requireHostSession(
  ctx: MutationCtx,
  sessionId: Id<'codenamesSessions'>,
) {
  const user = await getCurrentUser(ctx)
  const session = await ctx.db.get(sessionId)
  if (!session || session.hostId !== user._id) {
    throw permanentError('NOT_FOUND', 'Dit spel bestaat niet (meer).')
  }
  return session
}

async function playerByToken(ctx: QueryCtx, token: string) {
  const player = await ctx.db
    .query('codenamesPlayers')
    .withIndex('by_token', q => q.eq('token', token))
    .unique()
  if (!player) return null
  const session = await ctx.db.get(player.sessionId)
  return session ? { player, session } : null
}

async function requirePlayer(ctx: MutationCtx, token: string) {
  const found = await playerByToken(ctx, token)
  if (!found) {
    throw permanentError('NOT_FOUND', 'Je bent niet (meer) in dit spel.')
  }
  return found
}

/** The running game, for a player of the team whose turn it is. */
async function requireTurn(
  ctx: MutationCtx,
  token: string,
  role: 'spymaster' | 'guesser',
) {
  const { player, session } = await requirePlayer(ctx, token)
  const game = session.game
  if (session.status !== 'playing' || !game || game.turn !== player.team) {
    throw permanentError('INVALID_ARGUMENT', 'Het is niet jullie beurt.')
  }
  const isSpymaster =
    spymasters(session, await playersOf(ctx, session._id))[player.team] ===
    player._id
  if ((role === 'spymaster') !== isSpymaster) {
    throw permanentError(
      'FORBIDDEN',
      role === 'spymaster'
        ? 'Enkel de spionnenmeester geeft een hint.'
        : 'De spionnenmeester mag niet raden.',
    )
  }
  return { player, session, game }
}

async function saveGame(ctx: MutationCtx, session: Session, game: Game) {
  await ctx.db.patch(session._id, { game, lastActivityAt: Date.now() })
}

function switchTurn(game: Game): Game {
  return {
    ...game,
    turn: otherTeam(game.turn),
    clue: undefined,
    selected: undefined,
  }
}

async function deleteSession(ctx: MutationCtx, session: Session) {
  for (const p of await playersOf(ctx, session._id)) await ctx.db.delete(p._id)
  await ctx.db.delete(session._id)
}

async function uniqueCode(ctx: MutationCtx) {
  for (;;) {
    const code = generateRandomString(6, '0123456789')
    const taken = await ctx.db
      .query('codenamesSessions')
      .withIndex('by_code', q => q.eq('code', code))
      .first()
    if (!taken) return code
  }
}

// ============================================================================
// Host (signed in, on the big screen)
// ============================================================================

/**
 * The host's session as the big screen shows it: the board without the
 * secret colours (players look at it), all players and their teams.
 */
export const hostSession = query({
  args: {},
  handler: async ctx => {
    const user = await getCurrentUserOrNull(ctx)
    if (!user) return null
    const session = await ctx.db
      .query('codenamesSessions')
      .withIndex('by_host', q => q.eq('hostId', user._id))
      .order('desc')
      .first()
    if (!session) return null
    const players = await playersOf(ctx, session._id)
    return {
      _id: session._id,
      code: session.code,
      status: session.status,
      players: rosterView(session, players),
      game: session.game
        ? boardView(session.game, session.status === 'finished')
        : null,
    }
  },
})

/** A new session in the lobby; the host's earlier sessions end. */
export const createSession = mutation({
  args: {},
  returns: v.id('codenamesSessions'),
  handler: async ctx => {
    const user = await getCurrentUser(ctx)
    const earlier = await ctx.db
      .query('codenamesSessions')
      .withIndex('by_host', q => q.eq('hostId', user._id))
      .collect()
    for (const s of earlier) await deleteSession(ctx, s)
    const now = Date.now()
    return await ctx.db.insert('codenamesSessions', {
      hostId: user._id,
      code: await uniqueCode(ctx),
      status: 'lobby',
      lastActivityAt: now,
      createdAt: now,
    })
  },
})

export const endSession = mutation({
  args: { sessionId: v.id('codenamesSessions') },
  returns: v.null(),
  handler: async (ctx, { sessionId }) => {
    await deleteSession(ctx, await requireHostSession(ctx, sessionId))
    return null
  },
})

/** Move a player to the other team, between games. */
export const movePlayer = mutation({
  args: {
    sessionId: v.id('codenamesSessions'),
    playerId: v.id('codenamesPlayers'),
  },
  returns: v.null(),
  handler: async (ctx, { sessionId, playerId }) => {
    const session = await requireHostSession(ctx, sessionId)
    if (session.status === 'playing') {
      throw permanentError(
        'INVALID_ARGUMENT',
        'Tijdens een spel wisselt niemand van team.',
      )
    }
    const player = await ctx.db.get(playerId)
    if (!player || player.sessionId !== sessionId) {
      throw permanentError('NOT_FOUND', 'Deze speler is er niet meer.')
    }
    await ctx.db.patch(playerId, { team: otherTeam(player.team) })
    await ctx.db.patch(sessionId, { lastActivityAt: Date.now() })
    return null
  },
})

/** Make a player their team's spymaster; also during a game. */
export const setSpymaster = mutation({
  args: {
    sessionId: v.id('codenamesSessions'),
    playerId: v.id('codenamesPlayers'),
  },
  returns: v.null(),
  handler: async (ctx, { sessionId, playerId }) => {
    await requireHostSession(ctx, sessionId)
    const player = await ctx.db.get(playerId)
    if (!player || player.sessionId !== sessionId) {
      throw permanentError('NOT_FOUND', 'Deze speler is er niet meer.')
    }
    await ctx.db.patch(sessionId, {
      [player.team === 'red' ? 'redSpymaster' : 'blueSpymaster']: playerId,
      lastActivityAt: Date.now(),
    })
    return null
  },
})

export const removePlayer = mutation({
  args: {
    sessionId: v.id('codenamesSessions'),
    playerId: v.id('codenamesPlayers'),
  },
  returns: v.null(),
  handler: async (ctx, { sessionId, playerId }) => {
    await requireHostSession(ctx, sessionId)
    const player = await ctx.db.get(playerId)
    if (player && player.sessionId === sessionId) await ctx.db.delete(playerId)
    return null
  },
})

/** Deal a fresh board; each team needs a spymaster and a guesser. */
export const startGame = mutation({
  args: { sessionId: v.id('codenamesSessions') },
  returns: v.null(),
  handler: async (ctx, { sessionId }) => {
    const session = await requireHostSession(ctx, sessionId)
    if (session.status === 'playing') {
      throw permanentError('INVALID_ARGUMENT', 'Het spel is al bezig.')
    }
    const players = await playersOf(ctx, sessionId)
    for (const team of ['red', 'blue'] as const) {
      if (players.filter(p => p.team === team).length < MIN_PLAYERS_PER_TEAM) {
        throw permanentError(
          'INVALID_ARGUMENT',
          `Elk team heeft minstens ${MIN_PLAYERS_PER_TEAM} spelers nodig.`,
        )
      }
    }
    const saved = await ctx.db.query('codenamesWords').first()
    const board = buildBoard(
      saved?.words ?? DEFAULT_CODENAMES_WORDS,
      Math.random,
    )
    if (!board) {
      throw permanentError('INVALID_ARGUMENT', 'Er zijn te weinig woorden.')
    }
    const sm = spymasters(session, players)
    await ctx.db.patch(sessionId, {
      status: 'playing',
      redSpymaster: sm.red,
      blueSpymaster: sm.blue,
      game: {
        words: board.words,
        key: board.key,
        revealed: board.words.map(() => false),
        startingTeam: board.startingTeam,
        turn: board.startingTeam,
        clues: [],
      },
      lastActivityAt: Date.now(),
    })
    return null
  },
})

/** After a game (or to stop one): back to the lobby with the same teams. */
export const backToLobby = mutation({
  args: { sessionId: v.id('codenamesSessions') },
  returns: v.null(),
  handler: async (ctx, { sessionId }) => {
    await requireHostSession(ctx, sessionId)
    await ctx.db.patch(sessionId, {
      status: 'lobby',
      game: undefined,
      lastActivityAt: Date.now(),
    })
    return null
  },
})

// ============================================================================
// Players (no account; a token from `join`)
// ============================================================================

/**
 * Join with the session's code and a name, or come back with the token the
 * browser kept. New players go to the smaller team.
 */
export const join = mutation({
  args: {
    code: v.string(),
    name: v.string(),
    token: v.optional(v.string()),
  },
  returns: v.object({ token: v.string() }),
  handler: async (ctx, { code, name, token }) => {
    const session = await ctx.db
      .query('codenamesSessions')
      .withIndex('by_code', q => q.eq('code', code.trim()))
      .first()
    if (!session) {
      throw permanentError('NOT_FOUND', 'Er is geen spel met deze code.')
    }
    if (token) {
      const known = await playerByToken(ctx, token)
      if (known?.session._id === session._id) return { token }
    }
    const trimmed = name.trim().replace(/\s+/g, ' ')
    if (!trimmed || trimmed.length > PLAYER_NAME_MAX) {
      throw permanentError(
        'INVALID_ARGUMENT',
        `Typ een naam van 1 tot ${PLAYER_NAME_MAX} tekens.`,
      )
    }
    const players = await playersOf(ctx, session._id)
    const lower = trimmed.toLocaleLowerCase('nl-BE')
    if (players.some(p => p.name.toLocaleLowerCase('nl-BE') === lower)) {
      throw permanentError('INVALID_ARGUMENT', 'Die naam is al gekozen.')
    }
    if (players.length >= MAX_PLAYERS) {
      throw permanentError('INVALID_ARGUMENT', 'Dit spel is vol.')
    }
    const newToken = generateRandomString(32, TOKEN_ALPHABET)
    const now = Date.now()
    await ctx.db.insert('codenamesPlayers', {
      sessionId: session._id,
      name: trimmed,
      team: smallerTeam(players.map(p => p.team)),
      token: newToken,
      joinedAt: now,
    })
    await ctx.db.patch(session._id, { lastActivityAt: now })
    return { token: newToken }
  },
})

/**
 * What a player's phone shows; null once the player was removed or the
 * session ended. Spymasters also get the secret colours.
 */
export const playerView = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const found = await playerByToken(ctx, token)
    if (!found) return null
    const { player, session } = found
    const players = await playersOf(ctx, session._id)
    const isSpymaster = spymasters(session, players)[player.team] === player._id
    return {
      code: session.code,
      status: session.status,
      me: { name: player.name, team: player.team, isSpymaster },
      players: rosterView(session, players),
      game: session.game
        ? boardView(session.game, isSpymaster || session.status === 'finished')
        : null,
    }
  },
})

export const leave = mutation({
  args: { token: v.string() },
  returns: v.null(),
  handler: async (ctx, { token }) => {
    const found = await playerByToken(ctx, token)
    if (found) await ctx.db.delete(found.player._id)
    return null
  },
})

/** The spymaster's clue: one word and how many cards it is about. */
export const giveClue = mutation({
  args: { token: v.string(), word: v.string(), number: v.number() },
  returns: v.null(),
  handler: async (ctx, { token, word, number }) => {
    const { session, game } = await requireTurn(ctx, token, 'spymaster')
    if (game.clue) {
      throw permanentError('INVALID_ARGUMENT', 'Je gaf al een hint.')
    }
    const problem = clueProblem(word, number, game.words)
    if (problem) throw permanentError('INVALID_ARGUMENT', problem)
    const clue = normalizeWord(word)
    await saveGame(ctx, session, {
      ...game,
      // One guess more than the number, as in the board game.
      clue: { word: clue, number, guessesLeft: number + 1 },
      clues: [...game.clues, { team: game.turn, word: clue, number }],
    })
    return null
  },
})

/** Point at a card (everyone sees it); tapping it again lets go. */
export const selectCard = mutation({
  args: { token: v.string(), index: v.number() },
  returns: v.null(),
  handler: async (ctx, { token, index }) => {
    const { session, game } = await requireTurn(ctx, token, 'guesser')
    if (!game.clue) {
      throw permanentError('INVALID_ARGUMENT', 'Wacht op de hint.')
    }
    if (!Number.isInteger(index) || game.revealed[index] !== false) {
      throw permanentError('INVALID_ARGUMENT', 'Kies een andere kaart.')
    }
    await saveGame(ctx, session, {
      ...game,
      selected: game.selected === index ? undefined : index,
    })
    return null
  },
})

/** Turn the selected card over. */
export const confirmCard = mutation({
  args: { token: v.string(), index: v.number() },
  returns: v.null(),
  handler: async (ctx, { token, index }) => {
    const { session, game } = await requireTurn(ctx, token, 'guesser')
    // The index guards against confirming a card someone else just chose.
    if (!game.clue || game.selected !== index || game.revealed[index]) {
      throw permanentError('INVALID_ARGUMENT', 'Kies eerst een kaart.')
    }
    const guessesLeft = game.clue.guessesLeft - 1
    const outcome = guessOutcome(
      game.key,
      game.revealed,
      index,
      game.turn,
      guessesLeft,
    )
    const revealed = game.revealed.map((r, i) => r || i === index)
    if (outcome.winner) {
      await ctx.db.patch(session._id, {
        status: 'finished',
        game: {
          ...game,
          revealed,
          clue: undefined,
          selected: undefined,
          winner: outcome.winner,
          winReason: outcome.color === 'assassin' ? 'assassin' : 'cards',
        },
        lastActivityAt: Date.now(),
      })
      return null
    }
    const next = { ...game, revealed, selected: undefined }
    await saveGame(
      ctx,
      session,
      outcome.keepTurn
        ? { ...next, clue: { ...game.clue, guessesLeft } }
        : switchTurn(next),
    )
    return null
  },
})

/** Stop guessing; the other team's turn. */
export const endTurn = mutation({
  args: { token: v.string() },
  returns: v.null(),
  handler: async (ctx, { token }) => {
    const { session, game } = await requireTurn(ctx, token, 'guesser')
    if (!game.clue) {
      throw permanentError('INVALID_ARGUMENT', 'Wacht op de hint.')
    }
    await saveGame(ctx, session, switchTurn(game))
    return null
  },
})

// ============================================================================
// Cleanup
// ============================================================================

/** Remove sessions nobody used for 12 hours (run from crons). */
export const removeIdleSessions = internalMutation({
  args: {},
  returns: v.null(),
  handler: async ctx => {
    const idle = await ctx.db
      .query('codenamesSessions')
      .withIndex('by_last_activity', q =>
        q.lt('lastActivityAt', Date.now() - IDLE_SESSION_MS),
      )
      .take(CLEANUP_BATCH)
    for (const session of idle) await deleteSession(ctx, session)
    if (idle.length === CLEANUP_BATCH) {
      await ctx.scheduler.runAfter(
        0,
        internal.functions.codenames.removeIdleSessions,
        {},
      )
    }
    return null
  },
})

/** Account deletion: a host's sessions with their players. */
export async function deleteHostedSessions(
  ctx: MutationCtx,
  userId: Id<'users'>,
  budget: number,
): Promise<number> {
  // A session is at most one row and MAX_PLAYERS players.
  const perSession = MAX_PLAYERS + 1
  const limit = Math.max(1, Math.floor(budget / perSession))
  const sessions = await ctx.db
    .query('codenamesSessions')
    .withIndex('by_host', q => q.eq('hostId', userId))
    .take(limit)
  for (const session of sessions) await deleteSession(ctx, session)
  // A full batch may not be all: report the whole budget so a pass follows.
  return sessions.length === limit ? budget : sessions.length * perSession
}
