/**
 * Managing the shared content (`content:manage`): dinosaurs, planets, craft
 * videos, memory themes, word lists, the multiplication grid's pictures and the games'
 * settings.
 *
 * Content pictures belong to the app, not to the person who uploaded them:
 * they are not claimed (see lib/storageClaims.ts), so deleting a manager's
 * account never deletes them. An upload must be fresh and unclaimed.
 */

import { v } from 'convex/values'
import { mutation, query } from '../_generated/server'
import type { MutationCtx } from '../_generated/server'
import type { Id } from '../_generated/dataModel'
import { requirePermission } from '../lib/auth'
import { permanentError } from '../lib/errors'
import { CLAIM_WINDOW_MS } from '../lib/storageClaims'
import { youtubeVideoId } from '../lib/youtube'
import { DEFAULT_WORD_LISTS, WORD_LIST_MAX, WORD_LIST_MIN } from '../lib/games'
import { craftCategoryValidator, mathLevelValidator } from '../schema'

const tableValidator = v.union(v.literal('dinosaurs'), v.literal('planets'))

const TEXT_MAX = 2000
const NAME_MAX = 80
const MEMORY_EMOJI_MIN = 9 // the largest grid (6×6 pairs) needs 18; smaller grids fewer
const MEMORY_EMOJI_MAX = 40

function text(value: string, label: string, max = TEXT_MAX, required = true) {
  const t = value.trim()
  if ((required && !t) || t.length > max) {
    throw permanentError(
      'INVALID_ARGUMENT',
      `${label}: vul 1 tot ${max} tekens in.`,
    )
  }
  return t
}

/** A picture uploaded in the last day that nobody has claimed. */
async function requireFreshUpload(ctx: MutationCtx, storageId: Id<'_storage'>) {
  const blob = await ctx.db.system.get(storageId)
  if (!blob)
    throw permanentError('NOT_FOUND', 'Upload niet gevonden. Probeer opnieuw.')
  const claimed = await ctx.db
    .query('storageClaims')
    .withIndex('by_storage_id', q => q.eq('storageId', storageId))
    .first()
  if (claimed || Date.now() - blob._creationTime > CLAIM_WINDOW_MS) {
    throw permanentError('FORBIDDEN', 'Upload de afbeelding opnieuw.')
  }
}

/** Replace a picture: check the new one, delete the old one. */
async function swapImage(
  ctx: MutationCtx,
  oldImage: Id<'_storage'> | undefined,
  newImage: Id<'_storage'> | undefined,
) {
  if (newImage === oldImage) return
  if (newImage) await requireFreshUpload(ctx, newImage)
  if (oldImage && (await ctx.db.system.get(oldImage)))
    await ctx.storage.delete(oldImage)
}

export const generateUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async ctx => {
    await requirePermission(ctx, 'content:manage')
    return await ctx.storage.generateUploadUrl()
  },
})

// ============================================================================
// Dinosaurs and planets
// ============================================================================

const entryArgs = {
  number: v.number(),
  name: v.string(),
  scientificName: v.string(),
  description: v.string(),
  funFact: v.string(),
  /** Left out: keep the picture; null: remove it; an id: a new upload */
  image: v.optional(v.union(v.id('_storage'), v.null())),
}

function checkedEntry(entry: {
  number: number
  name: string
  scientificName: string
  description: string
  funFact: string
}) {
  if (
    !Number.isInteger(entry.number) ||
    entry.number < 1 ||
    entry.number > 9999
  ) {
    throw permanentError('INVALID_ARGUMENT', 'Kies een nummer van 1 tot 9999.')
  }
  return {
    number: entry.number,
    name: text(entry.name, 'Naam', NAME_MAX),
    scientificName: text(
      entry.scientificName,
      'Wetenschappelijke naam',
      NAME_MAX,
      false,
    ),
    description: text(entry.description, 'Beschrijving'),
    funFact: text(entry.funFact, 'Weetje', TEXT_MAX, false),
  }
}

export const saveEntry = mutation({
  args: {
    table: tableValidator,
    id: v.optional(v.union(v.id('dinosaurs'), v.id('planets'))),
    ...entryArgs,
  },
  returns: v.null(),
  handler: async (ctx, { table, id, image, ...entry }) => {
    await requirePermission(ctx, 'content:manage')
    const checked = checkedEntry(entry)
    const sameNumber = await ctx.db
      .query(table)
      .withIndex('by_number', q => q.eq('number', checked.number))
      .first()
    if (sameNumber && sameNumber._id !== id) {
      throw permanentError(
        'INVALID_ARGUMENT',
        `Nummer ${checked.number} is al in gebruik.`,
      )
    }
    const now = Date.now()
    if (id) {
      const existing = await ctx.db.get(id)
      if (!existing || ctx.db.normalizeId(table, id) === null) {
        throw permanentError('NOT_FOUND', 'Dit item bestaat niet (meer).')
      }
      const newImage =
        image === undefined ? existing.image : (image ?? undefined)
      await swapImage(ctx, existing.image, newImage)
      await ctx.db.patch(id, { ...checked, image: newImage, updatedAt: now })
    } else {
      if (image) await requireFreshUpload(ctx, image)
      await ctx.db.insert(table, {
        ...checked,
        image: image ?? undefined,
        createdAt: now,
        updatedAt: now,
      })
    }
    return null
  },
})

export const removeEntry = mutation({
  args: {
    table: tableValidator,
    id: v.union(v.id('dinosaurs'), v.id('planets')),
  },
  returns: v.null(),
  handler: async (ctx, { table, id }) => {
    await requirePermission(ctx, 'content:manage')
    const entry = ctx.db.normalizeId(table, id) ? await ctx.db.get(id) : null
    if (!entry) return null
    await swapImage(ctx, entry.image, undefined)
    await ctx.db.delete(id)
    return null
  },
})

// ============================================================================
// Craft videos
// ============================================================================

export const saveCraft = mutation({
  args: {
    id: v.optional(v.id('crafts')),
    category: craftCategoryValidator,
    title: v.string(),
    youtubeUrl: v.string(),
    description: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, { id, ...craft }) => {
    await requirePermission(ctx, 'content:manage')
    const youtubeUrl = craft.youtubeUrl.trim()
    if (!youtubeVideoId(youtubeUrl)) {
      throw permanentError('INVALID_ARGUMENT', 'Geef een geldige YouTube-link.')
    }
    const description = craft.description?.trim()
    const row = {
      category: craft.category,
      title: text(craft.title, 'Titel', NAME_MAX),
      youtubeUrl,
      description: description ? text(description, 'Beschrijving') : undefined,
      updatedAt: Date.now(),
    }
    if (id) {
      if (!(await ctx.db.get(id)))
        throw permanentError('NOT_FOUND', 'Deze video bestaat niet (meer).')
      await ctx.db.patch(id, row)
    } else {
      await ctx.db.insert('crafts', { ...row, createdAt: row.updatedAt })
    }
    return null
  },
})

export const removeCraft = mutation({
  args: { id: v.id('crafts') },
  returns: v.null(),
  handler: async (ctx, { id }) => {
    await requirePermission(ctx, 'content:manage')
    if (await ctx.db.get(id)) await ctx.db.delete(id)
    return null
  },
})

// ============================================================================
// Memory themes
// ============================================================================

/** All themes, also the inactive ones. */
export const listMemoryThemes = query({
  args: {},
  handler: async ctx => {
    await requirePermission(ctx, 'content:manage')
    return await ctx.db.query('memoryThemes').collect()
  },
})

export const saveMemoryTheme = mutation({
  args: {
    id: v.optional(v.id('memoryThemes')),
    name: v.string(),
    emoji: v.string(),
    emojis: v.array(v.string()),
    active: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, { id, ...theme }) => {
    await requirePermission(ctx, 'content:manage')
    const emojis = [...new Set(theme.emojis.map(e => e.trim()).filter(Boolean))]
    if (emojis.length < MEMORY_EMOJI_MIN || emojis.length > MEMORY_EMOJI_MAX) {
      throw permanentError(
        'INVALID_ARGUMENT',
        `Een thema heeft ${MEMORY_EMOJI_MIN} tot ${MEMORY_EMOJI_MAX} verschillende emoji nodig.`,
      )
    }
    if (emojis.some(e => e.length > 16)) {
      throw permanentError(
        'INVALID_ARGUMENT',
        'Gebruik enkel emoji, één per vakje.',
      )
    }
    const row = {
      name: text(theme.name, 'Naam', NAME_MAX),
      emoji: text(theme.emoji, 'Icoon', 16),
      emojis,
      active: theme.active,
      updatedAt: Date.now(),
    }
    if (id) {
      if (!(await ctx.db.get(id)))
        throw permanentError('NOT_FOUND', 'Dit thema bestaat niet (meer).')
      await ctx.db.patch(id, row)
    } else {
      await ctx.db.insert('memoryThemes', { ...row, createdAt: row.updatedAt })
    }
    return null
  },
})

export const removeMemoryTheme = mutation({
  args: { id: v.id('memoryThemes') },
  returns: v.null(),
  handler: async (ctx, { id }) => {
    await requirePermission(ctx, 'content:manage')
    if (await ctx.db.get(id)) await ctx.db.delete(id)
    return null
  },
})

// ============================================================================
// Word lists (Woordjes lezen)
// ============================================================================

const WORD_MAX = 30

/** All lists, also the hidden ones. */
export const listWordLists = query({
  args: {},
  handler: async ctx => {
    await requirePermission(ctx, 'content:manage')
    return await ctx.db.query('wordLists').collect()
  },
})

export const saveWordList = mutation({
  args: {
    id: v.optional(v.id('wordLists')),
    name: v.string(),
    emoji: v.string(),
    words: v.array(v.object({ word: v.string(), emoji: v.string() })),
    active: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, { id, ...list }) => {
    await requirePermission(ctx, 'content:manage')
    // A word that is in the list twice keeps its first picture.
    const seen = new Set<string>()
    const words = list.words
      .map(w => ({ word: w.word.trim(), emoji: w.emoji.trim() }))
      .filter(w => {
        const key = w.word.toLowerCase()
        if (!w.word || !w.emoji || seen.has(key)) return false
        seen.add(key)
        return true
      })
    if (words.length < WORD_LIST_MIN || words.length > WORD_LIST_MAX) {
      throw permanentError(
        'INVALID_ARGUMENT',
        `Een lijst heeft ${WORD_LIST_MIN} tot ${WORD_LIST_MAX} verschillende woorden nodig.`,
      )
    }
    if (words.some(w => w.word.length > WORD_MAX || w.emoji.length > 16)) {
      throw permanentError(
        'INVALID_ARGUMENT',
        `Een woord heeft hoogstens ${WORD_MAX} letters en één emoji.`,
      )
    }
    const row = {
      name: text(list.name, 'Naam', NAME_MAX),
      emoji: text(list.emoji, 'Icoon', 16),
      words,
      active: list.active,
      updatedAt: Date.now(),
    }
    if (id) {
      if (!(await ctx.db.get(id)))
        throw permanentError('NOT_FOUND', 'Deze lijst bestaat niet (meer).')
      await ctx.db.patch(id, row)
    } else {
      await ctx.db.insert('wordLists', { ...row, createdAt: row.updatedAt })
    }
    return null
  },
})

export const removeWordList = mutation({
  args: { id: v.id('wordLists') },
  returns: v.null(),
  handler: async (ctx, { id }) => {
    await requirePermission(ctx, 'content:manage')
    if (await ctx.db.get(id)) await ctx.db.delete(id)
    return null
  },
})

/** Copy the app's own lists in, to edit them; only while there are none. */
export const importDefaultWordLists = mutation({
  args: {},
  returns: v.null(),
  handler: async ctx => {
    await requirePermission(ctx, 'content:manage')
    if (await ctx.db.query('wordLists').first()) {
      throw permanentError('INVALID_ARGUMENT', 'Er zijn al woordenlijsten.')
    }
    const now = Date.now()
    for (const list of DEFAULT_WORD_LISTS) {
      await ctx.db.insert('wordLists', {
        ...list,
        active: true,
        createdAt: now,
        updatedAt: now,
      })
    }
    return null
  },
})

// ============================================================================
// Multiplication grid pictures
// ============================================================================

export const listPuzzleImages = query({
  args: {},
  handler: async ctx => {
    await requirePermission(ctx, 'content:manage')
    const rows = await ctx.db.query('puzzleImages').collect()
    return await Promise.all(
      rows.map(async r => ({
        ...r,
        imageUrl: await ctx.storage.getUrl(r.image),
      })),
    )
  },
})

export const addPuzzleImage = mutation({
  args: { name: v.string(), image: v.id('_storage') },
  returns: v.null(),
  handler: async (ctx, { name, image }) => {
    await requirePermission(ctx, 'content:manage')
    await requireFreshUpload(ctx, image)
    await ctx.db.insert('puzzleImages', {
      name: text(name, 'Naam', NAME_MAX),
      image,
      active: true,
      createdAt: Date.now(),
    })
    return null
  },
})

export const setPuzzleImageActive = mutation({
  args: { id: v.id('puzzleImages'), active: v.boolean() },
  returns: v.null(),
  handler: async (ctx, { id, active }) => {
    await requirePermission(ctx, 'content:manage')
    if (!(await ctx.db.get(id)))
      throw permanentError('NOT_FOUND', 'Deze afbeelding bestaat niet (meer).')
    await ctx.db.patch(id, { active })
    return null
  },
})

export const removePuzzleImage = mutation({
  args: { id: v.id('puzzleImages') },
  returns: v.null(),
  handler: async (ctx, { id }) => {
    await requirePermission(ctx, 'content:manage')
    const row = await ctx.db.get(id)
    if (!row) return null
    await swapImage(ctx, row.image, undefined)
    await ctx.db.delete(id)
    return null
  },
})

// ============================================================================
// Game settings
// ============================================================================

async function upsertSettings(
  ctx: MutationCtx,
  game: 'maaltafel_puzzel' | 'rekenoefeningen',
  patch: {
    maaltafel?: { gridSize: number; blanksPerRound: number; bombChance: number }
    mathLevels?: (typeof mathLevelValidator.type)[]
  },
) {
  const existing = await ctx.db
    .query('gameSettings')
    .withIndex('by_game', q => q.eq('game', game))
    .first()
  const updatedAt = Date.now()
  if (existing) await ctx.db.patch(existing._id, { ...patch, updatedAt })
  else await ctx.db.insert('gameSettings', { game, ...patch, updatedAt })
}

export const saveMaaltafelSettings = mutation({
  args: {
    gridSize: v.number(),
    blanksPerRound: v.number(),
    bombChance: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, settings) => {
    await requirePermission(ctx, 'content:manage')
    const { gridSize, blanksPerRound, bombChance } = settings
    if (
      !Number.isInteger(gridSize) ||
      gridSize < 3 ||
      gridSize > 12 ||
      !Number.isInteger(blanksPerRound) ||
      blanksPerRound < 1 ||
      blanksPerRound > gridSize * gridSize ||
      !(bombChance >= 0 && bombChance <= 1)
    ) {
      throw permanentError(
        'INVALID_ARGUMENT',
        'Ongeldige instellingen voor de maaltafelpuzzel.',
      )
    }
    await upsertSettings(ctx, 'maaltafel_puzzel', { maaltafel: settings })
    return null
  },
})

export const saveMathLevels = mutation({
  args: { levels: v.array(mathLevelValidator) },
  returns: v.null(),
  handler: async (ctx, { levels }) => {
    await requirePermission(ctx, 'content:manage')
    if (levels.length < 1 || levels.length > 10) {
      throw permanentError('INVALID_ARGUMENT', 'Geef 1 tot 10 niveaus.')
    }
    for (const l of levels) {
      const ok =
        l.id.trim() &&
        l.label.trim() &&
        Number.isInteger(l.minNumber) &&
        Number.isInteger(l.maxNumber) &&
        l.minNumber >= 0 &&
        l.maxNumber >= l.minNumber &&
        l.maxNumber <= 10_000 &&
        Number.isInteger(l.questionsPerRound) &&
        l.questionsPerRound >= 1 &&
        l.questionsPerRound <= 100 &&
        l.timeLimitSeconds >= 0 &&
        l.timeLimitSeconds <= 600 &&
        l.pointsPerCorrect >= 0 &&
        l.speedBonus >= 0 &&
        l.starThresholds.length === 3 &&
        l.starThresholds.every(
          (t, i) =>
            t >= 0 && t <= 100 && (i === 0 || t >= l.starThresholds[i - 1]),
        )
      if (!ok)
        throw permanentError(
          'INVALID_ARGUMENT',
          `Niveau "${l.label}" klopt niet.`,
        )
    }
    if (new Set(levels.map(l => l.id)).size !== levels.length) {
      throw permanentError(
        'INVALID_ARGUMENT',
        'Elk niveau heeft een eigen id nodig.',
      )
    }
    await upsertSettings(ctx, 'rekenoefeningen', { mathLevels: levels })
    return null
  },
})
