/**
 * Content shared by every family: the cards of the dinosaur quiz and the
 * planet puzzles. Anyone signed in reads it; `content:manage` changes it.
 */

import { v } from 'convex/values'
import { internalMutation, query } from '../_generated/server'
import type { QueryCtx } from '../_generated/server'
import type { Doc } from '../_generated/dataModel'
import { requireAuth } from '../lib/auth'

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

// ============================================================================
// Seeding from the old app (run with `npx convex run`, see seed/README.md)
// ============================================================================

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
