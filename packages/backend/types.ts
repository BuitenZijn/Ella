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
  GAME_CATEGORIES,
  STAR_THRESHOLDS,
  QUESTIONS_PER_ROUND,
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
  puzzleStars,
  PLANET_EMOJI,
  DINO_CHOICES,
  dinoQuestions,
  SPLIT_LEVELS,
  splitQuestions,
  CLOCK_LEVELS,
  CLOCK_CHOICES,
  clockText,
  clockQuestions,
  MONEY_LEVELS,
  SHOP_ITEMS,
  formatEuro,
  moneyQuestions,
  WORD_CHOICES,
  WORD_LIST_MIN,
  WORD_LIST_MAX,
  DEFAULT_WORD_LISTS,
  wordQuestions,
  SEQUENCE_LEVELS,
  sequenceQuestions,
} from './convex/lib/games'
export type {
  Game,
  Random,
  MaaltafelSettings,
  MathLevel,
  Exercise,
  MemoryGrid,
  DinoQuestion,
  GameCategory,
  SplitLevel,
  SplitQuestion,
  ClockLevel,
  ClockTime,
  ClockQuestion,
  MoneyLevel,
  MoneyQuestion,
  WordItem,
  WordList,
  WordQuestion,
  SequenceLevel,
  SequenceQuestion,
} from './convex/lib/games'
export { youtubeVideoId, youtubeEmbedUrl } from './convex/lib/youtube'

// Codenames (pure rules — shared between backend & apps)
export {
  BOARD_SIZE,
  MIN_PLAYERS_PER_TEAM,
  MAX_PLAYERS,
  PLAYER_NAME_MAX,
  CLUE_WORD_MAX,
  CLUE_NUMBER_MAX,
  CODENAMES_WORDS_MIN,
  CODENAMES_WORDS_MAX,
  TEAM_LABELS,
  otherTeam,
  normalizeWord,
  clueProblem,
} from './convex/lib/codenames'
export type { Team, CardColor } from './convex/lib/codenames'
