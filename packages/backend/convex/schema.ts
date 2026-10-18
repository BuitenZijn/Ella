/**
 * Convex Schema Definition
 *
 * Tables are grouped per feature. Each feature that is ported from the old
 * EllaApp adds its tables in its own section below the foundation.
 */

import { defineSchema, defineTable } from 'convex/server'
import { authTables } from '@convex-dev/auth/server'
import { v } from 'convex/values'

// ============================================================================
// Exported validators (for use in function args)
// ============================================================================

export const mobilePlatformValidator = v.union(
  v.literal('ios'),
  v.literal('android'),
)

export const roleValidator = v.union(v.literal('user'), v.literal('admin'))

export const gameValidator = v.union(
  v.literal('maaltafel_puzzel'),
  v.literal('rekenoefeningen'),
  v.literal('dino_quiz'),
  v.literal('memory'),
  v.literal('planeten_puzzel'),
  v.literal('splitsen'),
  v.literal('klokkijken'),
  v.literal('geld_tellen'),
  v.literal('woordjes_lezen'),
  v.literal('reeksen'),
)

export const teamValidator = v.union(v.literal('red'), v.literal('blue'))

export const cardColorValidator = v.union(
  v.literal('red'),
  v.literal('blue'),
  v.literal('neutral'),
  v.literal('assassin'),
)

export const craftCategoryValidator = v.union(
  v.literal('tekenen'),
  v.literal('vouwen'),
  v.literal('schilderen'),
  v.literal('verven'),
  v.literal('slijm maken'),
  v.literal('boetseren'),
  v.literal('stempelen'),
)

export const mathLevelValidator = v.object({
  id: v.string(),
  label: v.string(),
  emoji: v.string(),
  minNumber: v.number(),
  maxNumber: v.number(),
  addition: v.boolean(),
  subtraction: v.boolean(),
  multiplication: v.boolean(),
  division: v.boolean(),
  fractions: v.boolean(),
  questionsPerRound: v.number(),
  timeLimitSeconds: v.number(),
  pointsPerCorrect: v.number(),
  speedBonus: v.number(),
  starThresholds: v.array(v.number()),
})

/** A card in one of the encyclopedia-style games (dinosaurs, planets). */
const encyclopediaEntry = {
  /** Position in the list, from the old app */
  number: v.number(),
  /** Dutch name, what children see */
  name: v.string(),
  scientificName: v.string(),
  description: v.string(),
  funFact: v.string(),
  image: v.optional(v.id('_storage')),
  createdAt: v.number(),
  updatedAt: v.number(),
}

// ============================================================================
// Schema
// ============================================================================

export default defineSchema({
  ...authTables,

  // --------------------------------------------------------------------------
  // Users & Authentication
  // --------------------------------------------------------------------------

  users: defineTable({
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    image: v.optional(v.id('_storage')),
    role: v.optional(roleValidator),
    permissionOverrides: v.optional(v.array(v.string())),
    bio: v.optional(v.string()),
    phone: v.optional(v.string()),
    location: v.optional(v.string()),
    language: v.optional(v.string()), // Preferred language (e.g. 'nl', 'en')
    /**
     * Set when the user (or an admin) requested account deletion. The batched
     * deletion worker keeps running until the row itself is removed; the flag
     * lets a cron resume the cascade if a batch chain ever dies.
     */
    deletionRequestedAt: v.optional(v.number()),
  })
    .index('email', ['email'])
    .index('by_deletion_requested_at', ['deletionRequestedAt'])
    .index('by_role', ['role'])
    // User pickers search by name; email prefixes use the `email` index.
    .searchIndex('search_first_name', { searchField: 'firstName' })
    .searchIndex('search_last_name', { searchField: 'lastName' }),

  /**
   * Sign-in emails (verification codes, password-reset links) sent per
   * address, so the auth flows that send them without a password can't be
   * used to flood an inbox. See `authEmailSendDecision` in lib/auth.ts.
   */
  authEmailThrottles: defineTable({
    email: v.string(),
    kind: v.union(v.literal('verify'), v.literal('reset')),
    windowStart: v.number(),
    count: v.number(),
    lastSentAt: v.number(),
  }).index('by_email_and_kind', ['email', 'kind']),

  /**
   * Store-enforced release floor. There is at most one tiny policy document
   * per mobile platform, so the public query remains an indexed, cacheable
   * read regardless of user count.
   */
  mobileVersionPolicies: defineTable({
    platform: mobilePlatformValidator,
    minimumVersion: v.string(),
    minimumBuild: v.number(),
    storeUrl: v.string(),
    message: v.optional(v.string()),
    updatedAt: v.number(),
  }).index('by_platform', ['platform']),

  // --------------------------------------------------------------------------
  // Storage Claims (who uploaded each blob — see lib/storageClaims.ts)
  // --------------------------------------------------------------------------

  storageClaims: defineTable({
    storageId: v.id('_storage'),
    userId: v.id('users'),
    claimedAt: v.number(),
  })
    .index('by_storage_id', ['storageId'])
    .index('by_user', ['userId']),

  // --------------------------------------------------------------------------
  // Content, shared by every family (managed with `content:manage`)
  // --------------------------------------------------------------------------

  /** The dinosaur quiz: one card per dinosaur. */
  dinosaurs: defineTable(encyclopediaEntry).index('by_number', ['number']),

  /** The planet puzzles: one picture per planet. */
  planets: defineTable(encyclopediaEntry).index('by_number', ['number']),

  /** Craft videos (YouTube), per category. */
  crafts: defineTable({
    category: craftCategoryValidator,
    title: v.string(),
    youtubeUrl: v.string(),
    description: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index('by_category', ['category']),

  memoryThemes: defineTable({
    name: v.string(),
    emoji: v.string(),
    emojis: v.array(v.string()),
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index('by_active', ['active']),

  /** Words to read, each with a picture (Woordjes lezen). */
  wordLists: defineTable({
    name: v.string(),
    emoji: v.string(),
    words: v.array(v.object({ word: v.string(), emoji: v.string() })),
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index('by_active', ['active']),

  /** Codenames' word list: one row; the code has the default list. */
  codenamesWords: defineTable({
    words: v.array(v.string()),
    updatedAt: v.number(),
  }),

  /** Pictures that show through the multiplication grid. */
  puzzleImages: defineTable({
    name: v.string(),
    image: v.id('_storage'),
    active: v.boolean(),
    createdAt: v.number(),
  }).index('by_active', ['active']),

  /** One row per game with settings; the code has the defaults. */
  gameSettings: defineTable({
    game: v.union(v.literal('maaltafel_puzzel'), v.literal('rekenoefeningen')),
    maaltafel: v.optional(
      v.object({
        gridSize: v.number(),
        blanksPerRound: v.number(),
        bombChance: v.number(),
      }),
    ),
    mathLevels: v.optional(v.array(mathLevelValidator)),
    updatedAt: v.number(),
  }).index('by_game', ['game']),

  // --------------------------------------------------------------------------
  // Families
  // --------------------------------------------------------------------------

  /**
   * A child's profile under a parent's account. Children have no account,
   * email or password: only a first name or nickname and an emoji.
   */
  children: defineTable({
    parentId: v.id('users'),
    name: v.string(),
    avatar: v.string(),
    createdAt: v.number(),
  }).index('by_parent', ['parentId']),

  /** One finished game. */
  scores: defineTable({
    childId: v.id('children'),
    /** For deleting a family's data with the parent's account */
    parentId: v.id('users'),
    game: gameValidator,
    timeSeconds: v.number(),
    moves: v.optional(v.number()),
    mistakes: v.optional(v.number()),
    correct: v.optional(v.number()),
    total: v.optional(v.number()),
    points: v.optional(v.number()),
    stars: v.optional(v.number()),
    /** e.g. "4x4", "easy" */
    difficulty: v.optional(v.string()),
    /** e.g. the planet's name */
    subject: v.optional(v.string()),
    completedAt: v.number(),
  })
    .index('by_child_and_game', ['childId', 'game', 'completedAt'])
    .index('by_parent', ['parentId']),

  // --------------------------------------------------------------------------
  // Codenames: a host's session on a big screen, players on their phones
  // --------------------------------------------------------------------------

  /**
   * One session: a lobby, then games one after the other with the same
   * players. `key` is secret: only spymasters see it (functions/codenames.ts).
   */
  codenamesSessions: defineTable({
    hostId: v.id('users'),
    /** Six digits, what players type or scan; unique among sessions */
    code: v.string(),
    status: v.union(
      v.literal('lobby'),
      v.literal('playing'),
      v.literal('finished'),
    ),
    redSpymaster: v.optional(v.id('codenamesPlayers')),
    blueSpymaster: v.optional(v.id('codenamesPlayers')),
    /** The current (or last) game; absent before the first one */
    game: v.optional(
      v.object({
        words: v.array(v.string()),
        key: v.array(cardColorValidator),
        revealed: v.array(v.boolean()),
        startingTeam: teamValidator,
        turn: teamValidator,
        clue: v.optional(
          v.object({
            word: v.string(),
            number: v.number(),
            guessesLeft: v.number(),
          }),
        ),
        /** The card a guesser tapped, waiting to be confirmed */
        selected: v.optional(v.number()),
        clues: v.array(
          v.object({
            team: teamValidator,
            word: v.string(),
            number: v.number(),
          }),
        ),
        winner: v.optional(teamValidator),
        /** How it was won: all cards found, or the other team hit the assassin */
        winReason: v.optional(
          v.union(v.literal('cards'), v.literal('assassin')),
        ),
      }),
    ),
    lastActivityAt: v.number(),
    createdAt: v.number(),
  })
    .index('by_code', ['code'])
    .index('by_host', ['hostId'])
    .index('by_last_activity', ['lastActivityAt']),

  /** A player in a session: just a name, no account. */
  codenamesPlayers: defineTable({
    sessionId: v.id('codenamesSessions'),
    name: v.string(),
    team: teamValidator,
    /** Secret the player's browser keeps to act as this player */
    token: v.string(),
    joinedAt: v.number(),
  })
    .index('by_session', ['sessionId', 'joinedAt'])
    .index('by_token', ['token']),
})
