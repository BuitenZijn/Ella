/**
 * Families: a parent's account with child profiles, and the children's
 * scores. A parent only ever sees their own children: results are compared
 * within the family, never with other families' children.
 */

import { v } from 'convex/values'
import { mutation, query } from '../_generated/server'
import type { MutationCtx, QueryCtx } from '../_generated/server'
import type { Id } from '../_generated/dataModel'
import { getCurrentUser } from '../lib/auth'
import { permanentError } from '../lib/errors'
import { CHILD_AVATARS, GAMES } from '../lib/games'
import { gameValidator } from '../schema'

const MAX_CHILDREN = 10
const NAME_MAX = 30
const RECENT_SCORES = 20

/** The child, if it belongs to the signed-in parent. */
async function requireOwnChild(ctx: QueryCtx | MutationCtx, childId: Id<'children'>) {
  const parent = await getCurrentUser(ctx)
  const child = await ctx.db.get(childId)
  if (!child || child.parentId !== parent._id) {
    throw permanentError('NOT_FOUND', 'Dit kindprofiel bestaat niet (meer).')
  }
  return { parent, child }
}

function checkedProfile(name: string, avatar: string) {
  const n = name.trim()
  if (!n || n.length > NAME_MAX) {
    throw permanentError('INVALID_ARGUMENT', `Kies een naam van 1 tot ${NAME_MAX} tekens.`)
  }
  if (!(CHILD_AVATARS as readonly string[]).includes(avatar)) {
    throw permanentError('INVALID_ARGUMENT', 'Kies een van de figuurtjes.')
  }
  return { name: n, avatar }
}

export const listChildren = query({
  args: {},
  handler: async ctx => {
    const parent = await getCurrentUser(ctx)
    return await ctx.db
      .query('children')
      .withIndex('by_parent', q => q.eq('parentId', parent._id))
      .collect()
  },
})

export const addChild = mutation({
  args: { name: v.string(), avatar: v.string() },
  returns: v.id('children'),
  handler: async (ctx, args) => {
    const parent = await getCurrentUser(ctx)
    const existing = await ctx.db
      .query('children')
      .withIndex('by_parent', q => q.eq('parentId', parent._id))
      .collect()
    if (existing.length >= MAX_CHILDREN) {
      throw permanentError('FORBIDDEN', `Je kan maximaal ${MAX_CHILDREN} kinderen toevoegen.`)
    }
    return await ctx.db.insert('children', {
      parentId: parent._id,
      ...checkedProfile(args.name, args.avatar),
      createdAt: Date.now(),
    })
  },
})

export const updateChild = mutation({
  args: { childId: v.id('children'), name: v.string(), avatar: v.string() },
  returns: v.null(),
  handler: async (ctx, { childId, name, avatar }) => {
    await requireOwnChild(ctx, childId)
    await ctx.db.patch(childId, checkedProfile(name, avatar))
    return null
  },
})

/** Removes the profile and all its scores. */
export const removeChild = mutation({
  args: { childId: v.id('children') },
  returns: v.null(),
  handler: async (ctx, { childId }) => {
    await requireOwnChild(ctx, childId)
    for (const game of GAMES) {
      const scores = await ctx.db
        .query('scores')
        .withIndex('by_child_and_game', q => q.eq('childId', childId).eq('game', game))
        .collect()
      for (const score of scores) await ctx.db.delete(score._id)
    }
    await ctx.db.delete(childId)
    return null
  },
})

/** Plausibility limits, so a score can't be nonsense. */
function checkedNumber(value: number | undefined, max: number, label: string) {
  if (value === undefined) return undefined
  if (!Number.isFinite(value) || value < 0 || value > max) {
    throw permanentError('INVALID_ARGUMENT', `Ongeldige score (${label}).`)
  }
  return Math.round(value)
}

export const saveScore = mutation({
  args: {
    childId: v.id('children'),
    game: gameValidator,
    timeSeconds: v.number(),
    moves: v.optional(v.number()),
    mistakes: v.optional(v.number()),
    correct: v.optional(v.number()),
    total: v.optional(v.number()),
    points: v.optional(v.number()),
    stars: v.optional(v.number()),
    difficulty: v.optional(v.string()),
    subject: v.optional(v.string()),
  },
  returns: v.id('scores'),
  handler: async (ctx, { childId, game, ...score }) => {
    const { parent } = await requireOwnChild(ctx, childId)
    if ((score.difficulty?.length ?? 0) > 40 || (score.subject?.length ?? 0) > 80) {
      throw permanentError('INVALID_ARGUMENT', 'Ongeldige score.')
    }
    return await ctx.db.insert('scores', {
      childId,
      parentId: parent._id,
      game,
      timeSeconds: checkedNumber(score.timeSeconds, 24 * 3600, 'tijd')!,
      moves: checkedNumber(score.moves, 100_000, 'zetten'),
      mistakes: checkedNumber(score.mistakes, 100_000, 'fouten'),
      correct: checkedNumber(score.correct, 1000, 'juist'),
      total: checkedNumber(score.total, 1000, 'totaal'),
      points: checkedNumber(score.points, 1_000_000, 'punten'),
      stars: checkedNumber(score.stars, 3, 'sterren'),
      difficulty: score.difficulty,
      subject: score.subject,
      completedAt: Date.now(),
    })
  },
})

/** A child's recent results per game, newest first. */
export const childResults = query({
  args: { childId: v.id('children') },
  handler: async (ctx, { childId }) => {
    const { child } = await requireOwnChild(ctx, childId)
    const perGame = await Promise.all(
      GAMES.map(async game => {
        const scores = await ctx.db
          .query('scores')
          .withIndex('by_child_and_game', q => q.eq('childId', childId).eq('game', game))
          .order('desc')
          .take(RECENT_SCORES)
        return { game, played: scores.length, recent: scores }
      }),
    )
    return { child, games: perGame }
  },
})

/**
 * The family's best times for a game (fastest per child and difficulty),
 * for a friendly comparison between siblings.
 */
export const familyBest = query({
  args: { game: gameValidator },
  handler: async (ctx, { game }) => {
    const parent = await getCurrentUser(ctx)
    const children = await ctx.db
      .query('children')
      .withIndex('by_parent', q => q.eq('parentId', parent._id))
      .collect()
    const rows = []
    for (const child of children) {
      const scores = await ctx.db
        .query('scores')
        .withIndex('by_child_and_game', q => q.eq('childId', child._id).eq('game', game))
        .collect()
      const best = new Map<string, (typeof scores)[number]>()
      for (const s of scores) {
        const key = s.difficulty ?? ''
        const current = best.get(key)
        if (!current || s.timeSeconds < current.timeSeconds) best.set(key, s)
      }
      for (const s of best.values()) {
        rows.push({
          childName: child.name,
          avatar: child.avatar,
          difficulty: s.difficulty,
          timeSeconds: s.timeSeconds,
          stars: s.stars,
          points: s.points,
        })
      }
    }
    return rows.sort((a, b) => a.timeSeconds - b.timeSeconds)
  },
})
