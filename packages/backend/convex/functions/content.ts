/**
 * Content shared by every family: dinosaurs, planets, craft videos, memory
 * themes, the multiplication grid's pictures and the games' settings.
 * Anyone signed in reads it; `content:manage` changes it (contentAdmin.ts).
 */

import { v } from 'convex/values'
import { internalMutation, internalQuery, query } from '../_generated/server'
import type { QueryCtx } from '../_generated/server'
import type { Doc } from '../_generated/dataModel'
import { requireAuth } from '../lib/auth'
import {
  DEFAULT_MAALTAFEL,
  DEFAULT_MATH_LEVELS,
  type MathLevel,
} from '../lib/games'
import { craftCategoryValidator } from '../schema'

const tableValidator = v.union(v.literal('dinosaurs'), v.literal('planets'))

async function withImageUrls(
  ctx: QueryCtx,
  rows: Doc<'dinosaurs'>[] | Doc<'planets'>[],
) {
  return await Promise.all(
    rows.map(async row => ({
      _id: row._id,
      number: row.number,
      name: row.name,
      scientificName: row.scientificName,
      description: row.description,
      funFact: row.funFact,
      imageUrl: row.image ? await ctx.storage.getUrl(row.image) : null,
    })),
  )
}

export const listDinosaurs = query({
  args: {},
  handler: async ctx => {
    await requireAuth(ctx)
    const rows = await ctx.db
      .query('dinosaurs')
      .withIndex('by_number')
      .collect()
    return await withImageUrls(ctx, rows)
  },
})

export const listPlanets = query({
  args: {},
  handler: async ctx => {
    await requireAuth(ctx)
    const rows = await ctx.db.query('planets').withIndex('by_number').collect()
    return await withImageUrls(ctx, rows)
  },
})

export const listCrafts = query({
  args: { category: v.optional(craftCategoryValidator) },
  handler: async (ctx, { category }) => {
    await requireAuth(ctx)
    const crafts = category
      ? await ctx.db
          .query('crafts')
          .withIndex('by_category', q => q.eq('category', category))
          .collect()
      : await ctx.db.query('crafts').collect()
    return crafts.sort((a, b) => a.title.localeCompare(b.title, 'nl'))
  },
})

export const listMemoryThemes = query({
  args: {},
  handler: async ctx => {
    await requireAuth(ctx)
    return await ctx.db
      .query('memoryThemes')
      .withIndex('by_active', q => q.eq('active', true))
      .collect()
  },
})

/** Pictures for the multiplication grid; the game picks one at random. */
export const puzzleImageUrls = query({
  args: {},
  handler: async ctx => {
    await requireAuth(ctx)
    const images = await ctx.db
      .query('puzzleImages')
      .withIndex('by_active', q => q.eq('active', true))
      .collect()
    const urls = await Promise.all(images.map(i => ctx.storage.getUrl(i.image)))
    return urls.filter((u): u is string => u !== null)
  },
})

/** The games' settings, with the defaults for anything not set. */
export const gameSettings = query({
  args: {},
  handler: async ctx => {
    await requireAuth(ctx)
    const rows = await ctx.db.query('gameSettings').collect()
    const maaltafel = rows.find(r => r.game === 'maaltafel_puzzel')?.maaltafel
    const levels = rows.find(r => r.game === 'rekenoefeningen')?.mathLevels
    return {
      maaltafel: maaltafel ?? DEFAULT_MAALTAFEL,
      mathLevels: (levels as MathLevel[] | undefined) ?? DEFAULT_MATH_LEVELS,
    }
  },
})

// ============================================================================
// Seeding from the old app (run with `npx convex run`, see seed/README.md)
// ============================================================================

/** What is already seeded, so the script uploads only what is missing. */
export const seedState = internalQuery({
  args: {},
  handler: async ctx => ({
    dinosaurs: (await ctx.db.query('dinosaurs').collect()).map(d => d.number),
    planets: (await ctx.db.query('planets').collect()).map(p => p.number),
    puzzleImages: (await ctx.db.query('puzzleImages').collect()).map(i => i.name),
  }),
})

/**
 * Delete stored files nothing refers to (left behind by an interrupted seed).
 * Only content tables, profile pictures and claimed uploads refer to files.
 */
export const deleteUnusedFiles = internalMutation({
  args: { olderThanMinutes: v.optional(v.number()) },
  returns: v.number(),
  handler: async (ctx, { olderThanMinutes = 60 }) => {
    const used = new Set<string>()
    for (const d of await ctx.db.query('dinosaurs').collect()) if (d.image) used.add(d.image)
    for (const p of await ctx.db.query('planets').collect()) if (p.image) used.add(p.image)
    for (const i of await ctx.db.query('puzzleImages').collect()) used.add(i.image)
    for (const u of await ctx.db.query('users').collect()) if (u.image) used.add(u.image)
    for (const c of await ctx.db.query('storageClaims').collect()) used.add(c.storageId)
    const cutoff = Date.now() - olderThanMinutes * 60 * 1000
    let deleted = 0
    for (const file of await ctx.db.system.query('_storage').collect()) {
      // Recent files may be uploads that are about to be saved.
      if (!used.has(file._id) && file._creationTime < cutoff) {
        await ctx.storage.delete(file._id)
        deleted++
      }
    }
    return deleted
  },
})

/** An upload URL for one seed image. */
export const seedUploadUrl = internalMutation({
  args: {},
  returns: v.string(),
  handler: async ctx => await ctx.storage.generateUploadUrl(),
})

/** Add one card; refuses a number that is already taken. */
export const seedEntry = internalMutation({
  args: {
    table: tableValidator,
    number: v.number(),
    name: v.string(),
    scientificName: v.string(),
    description: v.string(),
    funFact: v.string(),
    image: v.optional(v.id('_storage')),
  },
  returns: v.null(),
  handler: async (ctx, { table, ...entry }) => {
    const existing = await ctx.db
      .query(table)
      .withIndex('by_number', q => q.eq('number', entry.number))
      .first()
    if (existing) throw new Error(`${table} #${entry.number} already exists`)
    const now = Date.now()
    await ctx.db.insert(table, { ...entry, createdAt: now, updatedAt: now })
    return null
  },
})

/** Seed one craft video; skips a title that is already there. */
export const seedCraft = internalMutation({
  args: {
    category: craftCategoryValidator,
    title: v.string(),
    youtubeUrl: v.string(),
    description: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, craft) => {
    const same = (await ctx.db
      .query('crafts')
      .withIndex('by_category', q => q.eq('category', craft.category))
      .collect()).some(c => c.title === craft.title)
    if (same) throw new Error(`craft "${craft.title}" already exists`)
    const now = Date.now()
    await ctx.db.insert('crafts', { ...craft, createdAt: now, updatedAt: now })
    return null
  },
})

export const seedMemoryTheme = internalMutation({
  args: { name: v.string(), emoji: v.string(), emojis: v.array(v.string()), active: v.boolean() },
  returns: v.null(),
  handler: async (ctx, theme) => {
    const same = (await ctx.db.query('memoryThemes').collect()).some(t => t.name === theme.name)
    if (same) throw new Error(`memory theme "${theme.name}" already exists`)
    const now = Date.now()
    await ctx.db.insert('memoryThemes', { ...theme, createdAt: now, updatedAt: now })
    return null
  },
})

/**
 * Seed one grid picture (uploaded just before). When the name is already
 * there, the fresh upload is deleted again and false is returned.
 */
export const seedPuzzleImage = internalMutation({
  args: { name: v.string(), image: v.id('_storage'), active: v.boolean() },
  returns: v.boolean(),
  handler: async (ctx, row) => {
    const same = (await ctx.db.query('puzzleImages').collect()).some(i => i.name === row.name)
    if (same) {
      await ctx.storage.delete(row.image)
      return false
    }
    await ctx.db.insert('puzzleImages', { ...row, createdAt: Date.now() })
    return true
  },
})

/** The multiplication grid's settings; only set when there are none yet. */
export const seedMaaltafelSettings = internalMutation({
  args: { gridSize: v.number(), blanksPerRound: v.number(), bombChance: v.number() },
  returns: v.null(),
  handler: async (ctx, maaltafel) => {
    const existing = await ctx.db
      .query('gameSettings')
      .withIndex('by_game', q => q.eq('game', 'maaltafel_puzzel'))
      .first()
    if (!existing) {
      await ctx.db.insert('gameSettings', { game: 'maaltafel_puzzel', maaltafel, updatedAt: Date.now() })
    }
    return null
  },
})
