/// <reference types="vite/client" />
import { describe, expect, it } from 'vitest'
import { api, internal } from '../convex/_generated/api'
import {
  DEFAULT_CODENAMES_WORDS,
  buildBoard,
  clueProblem,
  guessOutcome,
  smallerTeam,
  type CardColor,
} from '../convex/lib/codenames'
import { IDLE_SESSION_MS } from '../convex/functions/codenames'
import { expectPermanentError, userFixture } from './fixtures'

function seeded(seed = 1) {
  let state = seed
  return () => {
    state = (state * 1664525 + 1013904223) % 2 ** 32
    return state / 2 ** 32
  }
}

describe('codenames rules', () => {
  it('deals 25 different words with 9, 8, 7 neutral and 1 assassin', () => {
    expect(DEFAULT_CODENAMES_WORDS.length).toBeGreaterThan(300)
    const board = buildBoard(DEFAULT_CODENAMES_WORDS, seeded(3))!
    expect(new Set(board.words).size).toBe(25)
    const count = (c: CardColor) => board.key.filter(k => k === c).length
    const other = board.startingTeam === 'red' ? 'blue' : 'red'
    expect(count(board.startingTeam)).toBe(9)
    expect(count(other)).toBe(8)
    expect(count('neutral')).toBe(7)
    expect(count('assassin')).toBe(1)
    expect(buildBoard(['KAT', 'kat '], seeded())).toBeNull()
  })

  it('checks clues', () => {
    expect(clueProblem('dier', 2, ['KAT'])).toBeNull()
    expect(clueProblem('kat', 2, ['KAT'])).toMatch(/op het bord/)
    expect(clueProblem('twee woorden', 2, [])).toMatch(/één woord/)
    expect(clueProblem('dier', 0, [])).toMatch(/getal/)
  })

  it('decides what a guess does', () => {
    const key: CardColor[] = ['red', 'red', 'blue', 'neutral', 'assassin']
    const none = key.map(() => false)
    expect(guessOutcome(key, none, 0, 'red', 1)).toMatchObject({
      winner: null,
      keepTurn: true,
    })
    expect(guessOutcome(key, none, 0, 'red', 0).keepTurn).toBe(false)
    expect(guessOutcome(key, none, 3, 'red', 2).keepTurn).toBe(false)
    expect(guessOutcome(key, none, 4, 'red', 2).winner).toBe('blue')
    // Turning the other team's last card makes them win.
    expect(guessOutcome(key, none, 2, 'red', 2).winner).toBe('blue')
    expect(
      guessOutcome(key, [true, false, false, false, false], 1, 'red', 2).winner,
    ).toBe('red')
    expect(smallerTeam(['red', 'red', 'blue'])).toBe('blue')
    expect(smallerTeam([])).toBe('red')
  })
})

async function sessionFixture(players = 4) {
  const f = await userFixture()
  const sessionId = await f.authorClient.mutation(
    api.functions.codenames.createSession,
    {},
  )
  const host = await f.authorClient.query(
    api.functions.codenames.hostSession,
    {},
  )
  const tokens: string[] = []
  for (const name of ['Ana', 'Bo', 'Cas', 'Dirk', 'Eva', 'Fien'].slice(
    0,
    players,
  )) {
    const { token } = await f.t.mutation(api.functions.codenames.join, {
      code: host!.code,
      name,
    })
    tokens.push(token)
  }
  const view = (token: string) =>
    f.t.query(api.functions.codenames.playerView, { token })
  return { ...f, sessionId, code: host!.code, tokens, view }
}

describe('codenames sessions', () => {
  it('splits players into teams and needs 2 per team to start', async () => {
    const s = await sessionFixture(3)
    const teams = await Promise.all(
      s.tokens.map(async t => (await s.view(t))!.me.team),
    )
    expect(teams).toEqual(['red', 'blue', 'red'])
    await expectPermanentError(
      s.t.mutation(api.functions.codenames.join, {
        code: s.code,
        name: 'ana ',
      }),
      'INVALID_ARGUMENT',
    )
    await expectPermanentError(
      s.t.mutation(api.functions.codenames.join, { code: '000000', name: 'X' }),
      'NOT_FOUND',
    )
    // Coming back with the token is the same player.
    const again = await s.t.mutation(api.functions.codenames.join, {
      code: s.code,
      name: '',
      token: s.tokens[0],
    })
    expect(again.token).toBe(s.tokens[0])

    await expectPermanentError(
      s.authorClient.mutation(api.functions.codenames.startGame, {
        sessionId: s.sessionId,
      }),
      'INVALID_ARGUMENT',
    )
    // Only the host runs the session.
    await expectPermanentError(
      s.playerClient.mutation(api.functions.codenames.startGame, {
        sessionId: s.sessionId,
      }),
      'NOT_FOUND',
    )
  })

  it('shows the key only to spymasters until the game is over', async () => {
    const s = await sessionFixture(4)
    await s.authorClient.mutation(api.functions.codenames.startGame, {
      sessionId: s.sessionId,
    })
    const views = await Promise.all(s.tokens.map(s.view))
    // The first player of each team is spymaster: Ana (red), Bo (blue).
    expect(views.map(v => v!.me.isSpymaster)).toEqual([
      true,
      true,
      false,
      false,
    ])
    expect(views[0]!.game!.cards.every(c => c.color !== null)).toBe(true)
    expect(views[2]!.game!.cards.every(c => c.color === null)).toBe(true)
    const host = await s.authorClient.query(
      api.functions.codenames.hostSession,
      {},
    )
    expect(host!.game!.cards.every(c => c.color === null)).toBe(true)
  })

  it('plays turns: clue, select, confirm, and the assassin ends it', async () => {
    const s = await sessionFixture(4)
    await s.authorClient.mutation(api.functions.codenames.startGame, {
      sessionId: s.sessionId,
    })
    const board = (await s.view(s.tokens[0]))!.game!
    const turn = board.turn
    // Ana and Cas are red, Bo and Dirk blue; spymasters first.
    const [spymaster, guesser, otherGuesser] =
      turn === 'red'
        ? [s.tokens[0], s.tokens[2], s.tokens[3]]
        : [s.tokens[1], s.tokens[3], s.tokens[2]]

    await expectPermanentError(
      s.t.mutation(api.functions.codenames.giveClue, {
        token: guesser,
        word: 'dier',
        number: 1,
      }),
      'FORBIDDEN',
    )
    await expectPermanentError(
      s.t.mutation(api.functions.codenames.giveClue, {
        token: spymaster,
        word: board.cards[0].word,
        number: 1,
      }),
      'INVALID_ARGUMENT',
    )
    await s.t.mutation(api.functions.codenames.giveClue, {
      token: spymaster,
      word: 'hint',
      number: 1,
    })
    await expectPermanentError(
      s.t.mutation(api.functions.codenames.selectCard, {
        token: otherGuesser,
        index: 0,
      }),
      'INVALID_ARGUMENT',
    )

    // An own card: one more guess left (number + 1).
    const own = board.cards.findIndex(c => c.color === turn)
    await s.t.mutation(api.functions.codenames.selectCard, {
      token: guesser,
      index: own,
    })
    expect((await s.view(otherGuesser))!.game!.selected).toBe(own)
    await s.t.mutation(api.functions.codenames.confirmCard, {
      token: guesser,
      index: own,
    })
    let now = (await s.view(guesser))!.game!
    expect(now.cards[own]).toMatchObject({ revealed: true, color: turn })
    expect(now.turn).toBe(turn)
    expect(now.clue!.guessesLeft).toBe(1)

    // The assassin: the other team wins and everyone sees the key.
    const assassin = board.cards.findIndex(c => c.color === 'assassin')
    await s.t.mutation(api.functions.codenames.selectCard, {
      token: guesser,
      index: assassin,
    })
    await s.t.mutation(api.functions.codenames.confirmCard, {
      token: guesser,
      index: assassin,
    })
    const done = (await s.view(otherGuesser))!
    expect(done.status).toBe('finished')
    now = done.game!
    expect(now.winner).toBe(turn === 'red' ? 'blue' : 'red')
    expect(now.winReason).toBe('assassin')
    expect(now.cards.every(c => c.color !== null)).toBe(true)

    // A new game starts from the lobby with the same players.
    await s.authorClient.mutation(api.functions.codenames.backToLobby, {
      sessionId: s.sessionId,
    })
    expect((await s.view(guesser))!).toMatchObject({
      status: 'lobby',
      game: null,
    })
  })

  it('lets the host move players, pick spymasters and remove players', async () => {
    const s = await sessionFixture(4)
    const host = await s.authorClient.query(
      api.functions.codenames.hostSession,
      {},
    )
    const cas = host!.players.find(p => p.name === 'Cas')!
    await s.authorClient.mutation(api.functions.codenames.setSpymaster, {
      sessionId: s.sessionId,
      playerId: cas._id,
    })
    expect((await s.view(s.tokens[2]))!.me.isSpymaster).toBe(true)
    expect((await s.view(s.tokens[0]))!.me.isSpymaster).toBe(false)
    await s.authorClient.mutation(api.functions.codenames.movePlayer, {
      sessionId: s.sessionId,
      playerId: cas._id,
    })
    expect((await s.view(s.tokens[2]))!.me).toMatchObject({
      team: 'blue',
      isSpymaster: false,
    })
    await s.authorClient.mutation(api.functions.codenames.removePlayer, {
      sessionId: s.sessionId,
      playerId: cas._id,
    })
    expect(await s.view(s.tokens[2])).toBeNull()
  })

  it('removes idle sessions and ends earlier ones of the host', async () => {
    const s = await sessionFixture(2)
    await s.t.run(async ctx => {
      await ctx.db.patch(s.sessionId, {
        lastActivityAt: Date.now() - IDLE_SESSION_MS - 1,
      })
    })
    await s.t.mutation(internal.functions.codenames.removeIdleSessions, {})
    expect(await s.view(s.tokens[0])).toBeNull()
    expect(
      await s.authorClient.query(api.functions.codenames.hostSession, {}),
    ).toBeNull()
  })
})
