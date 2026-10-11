/**
 * Ella's games — pure rules shared by the backend and the app
 * (re-exported from `@ella/backend/types`). Randomness is passed in, so the
 * rules can be tested; the app passes Math.random.
 */

export type Random = () => number

export const GAMES = [
  'maaltafel_puzzel',
  'rekenoefeningen',
  'dino_quiz',
  'memory',
  'planeten_puzzel',
] as const
export type Game = (typeof GAMES)[number]

export const GAME_LABELS: Record<Game, string> = {
  maaltafel_puzzel: 'Maaltafelpuzzel',
  rekenoefeningen: 'Rekenoefeningen',
  dino_quiz: 'Dinoquiz',
  memory: 'Memory',
  planeten_puzzel: 'Planetenpuzzel',
}

export const GAME_EMOJI: Record<Game, string> = {
  maaltafel_puzzel: '🧩',
  rekenoefeningen: '➕',
  dino_quiz: '🦕',
  memory: '🧠',
  planeten_puzzel: '🪐',
}

/** Child profile pictures: emoji, so no photos of children are stored. */
export const CHILD_AVATARS = ['🦊', '🐻', '🐼', '🐸', '🦁', '🐯', '🐨', '🐰', '🦄', '🐢', '🐙', '🦉'] as const

export function randomInt(random: Random, min: number, max: number): number {
  return Math.floor(random() * (max - min + 1)) + min
}

export function shuffle<T>(items: readonly T[], random: Random): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

// ============================================================================
// Maaltafelpuzzel: fill in the multiplication grid, a picture shows through
// ============================================================================

export interface MaaltafelSettings {
  gridSize: number
  blanksPerRound: number
  /** Chance a right answer also "explodes" its 8 neighbours open */
  bombChance: number
}

export const DEFAULT_MAALTAFEL: MaaltafelSettings = {
  gridSize: 10,
  blanksPerRound: 10,
  bombChance: 0.3,
}

/** Cell (row, col) holds (row + 1) × (col + 1). */
export function cellValue(row: number, col: number): number {
  return (row + 1) * (col + 1)
}

export const cellKey = (row: number, col: number) => `${row}_${col}`

/** The next round's blanks: random cells that are not solved yet. */
export function pickBlanks(
  gridSize: number,
  count: number,
  solved: ReadonlySet<string>,
  random: Random,
): [number, number][] {
  const open: [number, number][] = []
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      if (!solved.has(cellKey(r, c))) open.push([r, c])
    }
  }
  return shuffle(open, random).slice(0, count)
}

/** The up to 8 cells around a cell, inside the grid. */
export function neighbours(row: number, col: number, gridSize: number): [number, number][] {
  const result: [number, number][] = []
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const r = row + dr
      const c = col + dc
      if ((dr || dc) && r >= 0 && c >= 0 && r < gridSize && c < gridSize) result.push([r, c])
    }
  }
  return result
}

// ============================================================================
// Rekenoefeningen: sums at a chosen level, with stars
// ============================================================================

export interface MathLevel {
  id: string
  label: string
  emoji: string
  minNumber: number
  maxNumber: number
  addition: boolean
  subtraction: boolean
  multiplication: boolean
  division: boolean
  fractions: boolean
  questionsPerRound: number
  /** 0 = no limit */
  timeLimitSeconds: number
  pointsPerCorrect: number
  /** Extra points for answering within half the time */
  speedBonus: number
  /** Percentage right for 1, 2 and 3 stars */
  starThresholds: [number, number, number]
}

export const DEFAULT_MATH_LEVELS: MathLevel[] = [
  {
    id: 'easy', label: 'Makkelijk', emoji: '🟢', minNumber: 1, maxNumber: 20,
    addition: true, subtraction: true, multiplication: false, division: false, fractions: false,
    questionsPerRound: 10, timeLimitSeconds: 30, pointsPerCorrect: 10, speedBonus: 5,
    starThresholds: [50, 75, 90],
  },
  {
    id: 'medium', label: 'Gemiddeld', emoji: '🟡', minNumber: 1, maxNumber: 50,
    addition: true, subtraction: true, multiplication: true, division: true, fractions: false,
    questionsPerRound: 15, timeLimitSeconds: 20, pointsPerCorrect: 15, speedBonus: 10,
    starThresholds: [50, 75, 90],
  },
  {
    id: 'hard', label: 'Moeilijk', emoji: '🔴', minNumber: 1, maxNumber: 100,
    addition: true, subtraction: true, multiplication: true, division: true, fractions: true,
    questionsPerRound: 20, timeLimitSeconds: 15, pointsPerCorrect: 20, speedBonus: 15,
    starThresholds: [50, 75, 90],
  },
]

export interface Exercise {
  text: string
  answer: number
}

const round2 = (n: number) => Math.round(n * 100) / 100

/**
 * One sum for a level. Subtractions never go below zero and divisions come
 * out whole; fractions are answered as a decimal (rounded to 2 places).
 */
export function generateExercise(level: MathLevel, random: Random): Exercise {
  const ops: string[] = []
  if (level.addition) ops.push('+')
  if (level.subtraction) ops.push('-')
  if (level.multiplication) ops.push('×')
  if (level.division) ops.push('÷')
  if (level.fractions) ops.push('frac')
  if (ops.length === 0) ops.push('+')
  const op = ops[Math.floor(random() * ops.length)]
  const max = Math.max(level.maxNumber, level.minNumber)

  if (op === 'frac') {
    const d1 = randomInt(random, 2, Math.min(12, Math.max(2, max)))
    const d2 = randomInt(random, 2, Math.min(12, Math.max(2, max)))
    const n1 = randomInt(random, 1, d1 - 1)
    const n2 = randomInt(random, 1, d2 - 1)
    const plus = random() < 0.5
    return {
      text: `${n1}/${d1} ${plus ? '+' : '-'} ${n2}/${d2}`,
      answer: round2(plus ? n1 / d1 + n2 / d2 : n1 / d1 - n2 / d2),
    }
  }

  let a = randomInt(random, level.minNumber, max)
  let b = randomInt(random, level.minNumber, max)
  if (op === '-' && a < b) [a, b] = [b, a]
  if (op === '÷') {
    b = randomInt(random, 1, Math.min(12, max))
    a = b * randomInt(random, 1, Math.max(1, Math.floor(max / b)))
  }
  const answer = op === '+' ? a + b : op === '-' ? a - b : op === '×' ? a * b : a / b
  return { text: `${a} ${op} ${b}`, answer: round2(answer) }
}

/** Typed answers accept a comma as decimal sign. */
export function isRightAnswer(exercise: Exercise, typed: string): boolean {
  const value = Number(typed.trim().replace(',', '.'))
  return typed.trim() !== '' && Number.isFinite(value) && Math.abs(value - exercise.answer) < 0.01
}

export function exercisePoints(level: MathLevel, right: boolean, seconds: number): number {
  if (!right) return 0
  const fast = level.timeLimitSeconds > 0 && seconds <= level.timeLimitSeconds / 2
  return level.pointsPerCorrect + (fast ? level.speedBonus : 0)
}

/** 0 to 3 stars for the share of right answers. */
export function starsFor(rightCount: number, total: number, thresholds: [number, number, number]): number {
  const pct = total > 0 ? (rightCount / total) * 100 : 0
  return thresholds.filter(t => pct >= t).length
}

// ============================================================================
// Memory: find pairs or trios of emoji
// ============================================================================

export interface MemoryGrid {
  label: string
  rows: number
  cols: number
}

export const MEMORY_GRIDS: Record<2 | 3, MemoryGrid[]> = {
  2: [
    { label: '4×3', rows: 3, cols: 4 },
    { label: '4×4', rows: 4, cols: 4 },
    { label: '6×4', rows: 4, cols: 6 },
    { label: '6×5', rows: 5, cols: 6 },
    { label: '6×6', rows: 6, cols: 6 },
  ],
  3: [
    { label: '3×3', rows: 3, cols: 3 },
    { label: '4×3', rows: 3, cols: 4 },
    { label: '6×3', rows: 3, cols: 6 },
    { label: '6×4', rows: 4, cols: 6 },
    { label: '6×5', rows: 5, cols: 6 },
  ],
}

/**
 * A shuffled deck: `cards / matchSize` different emoji from the theme, each
 * `matchSize` times. Null when the theme has too few emoji for the grid.
 */
export function buildMemoryDeck(
  emojis: readonly string[],
  matchSize: 2 | 3,
  cards: number,
  random: Random,
): string[] | null {
  const kinds = Math.floor(cards / matchSize)
  const unique = [...new Set(emojis)]
  if (kinds < 1 || unique.length < kinds || cards % matchSize !== 0) return null
  const chosen = shuffle(unique, random).slice(0, kinds)
  return shuffle(
    chosen.flatMap(emoji => Array.from({ length: matchSize }, () => emoji)),
    random,
  )
}

// ============================================================================
// Planetenpuzzel: swap tiles until the planet is whole
// ============================================================================

export const PUZZLE_SIZES = [3, 4, 5, 6, 7] as const

/**
 * The tiles' order on the board: tile `board[i]` sits in place i. Any order
 * can be solved with swaps; a solved board is never returned.
 */
export function shuffledBoard(size: number, random: Random): number[] {
  const solved = Array.from({ length: size * size }, (_, i) => i)
  const board = shuffle(solved, random)
  if (isSolved(board) && board.length > 1) [board[0], board[1]] = [board[1], board[0]]
  return board
}

export function isSolved(board: readonly number[]): boolean {
  return board.every((tile, i) => tile === i)
}

export function swapTiles(board: readonly number[], a: number, b: number): number[] {
  const next = [...board]
  ;[next[a], next[b]] = [next[b], next[a]]
  return next
}

// ============================================================================
// Dinoquiz: which dinosaur is this?
// ============================================================================

export const DINO_CHOICES = 3

export interface DinoQuestion<T> {
  dino: T
  choices: string[]
}

/**
 * One question per dinosaur with a picture, in random order; the wrong
 * choices come from all dinosaurs (also those without a picture).
 */
export function dinoQuestions<T extends { name: string; imageUrl: string | null }>(
  dinos: readonly T[],
  random: Random,
): DinoQuestion<T>[] {
  return shuffle(
    dinos.filter(d => d.imageUrl),
    random,
  ).map(dino => {
    const others = shuffle(
      dinos.filter(d => d.name !== dino.name).map(d => d.name),
      random,
    ).slice(0, DINO_CHOICES - 1)
    return { dino, choices: shuffle([dino.name, ...others], random) }
  })
}
