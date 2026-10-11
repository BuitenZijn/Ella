/**
 * Shared types for the Ella application
 *
 * - Document types are derived from schema via Doc<T>
 * - Composite types are defined in lib/types.ts
 *
 * Import in apps:
 *   import type { User } from "@ella/backend/types";
 */

export type { User, UserWithImageUrl, UserFilterItem } from './convex/lib/types'

// Re-export Id for convenience
export type { Id } from './convex/_generated/dataModel'

// Permissions (pure logic — shared between backend & apps)
export {
  ALL_PERMISSIONS,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  getEffectivePermissions,
  hasPermission,
  hasAnyPermission,
} from './convex/lib/permissions'
export type { Permission, Role } from './convex/lib/permissions'

// Games (pure rules — shared between backend & apps)
export {
  GAMES,
  GAME_LABELS,
  GAME_EMOJI,
  CHILD_AVATARS,
  randomInt,
  shuffle,
  DEFAULT_MAALTAFEL,
  cellValue,
  cellKey,
  pickBlanks,
  neighbours,
  DEFAULT_MATH_LEVELS,
  generateExercise,
  isRightAnswer,
  exercisePoints,
  starsFor,
  MEMORY_GRIDS,
  buildMemoryDeck,
  PUZZLE_SIZES,
  shuffledBoard,
  isSolved,
  swapTiles,
  DINO_CHOICES,
  dinoQuestions,
} from './convex/lib/games'
export type {
  Game,
  Random,
  MaaltafelSettings,
  MathLevel,
  Exercise,
  MemoryGrid,
  DinoQuestion,
} from './convex/lib/games'
export { youtubeVideoId, youtubeEmbedUrl } from './convex/lib/youtube'
