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
  'splitsen',
  'klokkijken',
  'geld_tellen',
  'woordjes_lezen',
  'reeksen',
] as const
export type Game = (typeof GAMES)[number]

export const GAME_LABELS: Record<Game, string> = {
  maaltafel_puzzel: 'Maaltafelpuzzel',
  rekenoefeningen: 'Rekenoefeningen',
  dino_quiz: 'Dinoquiz',
  memory: 'Memory',
  planeten_puzzel: 'Planetenpuzzel',
  splitsen: 'Splitsen',
  klokkijken: 'Klokkijken',
  geld_tellen: 'Geld tellen',
  woordjes_lezen: 'Woordjes lezen',
  reeksen: 'Reeksen',
}

export const GAME_EMOJI: Record<Game, string> = {
  maaltafel_puzzel: '🧩',
  rekenoefeningen: '➕',
  dino_quiz: '🦕',
  memory: '🧠',
  planeten_puzzel: '🪐',
  splitsen: '🏠',
  klokkijken: '🕒',
  geld_tellen: '💶',
  woordjes_lezen: '📖',
  reeksen: '🔁',
}

export interface GameCategory {
  id: 'rekenen' | 'taal' | 'denken' | 'ontdekken'
  label: string
  emoji: string
  games: Game[]
}

/** The games grouped the way school does; every game is in one group. */
export const GAME_CATEGORIES: GameCategory[] = [
  {
    id: 'rekenen',
    label: 'Rekenen',
    emoji: '🔢',
    games: [
      'rekenoefeningen',
      'maaltafel_puzzel',
      'splitsen',
      'klokkijken',
      'geld_tellen',
    ],
  },
  { id: 'taal', label: 'Taal', emoji: '🔤', games: ['woordjes_lezen'] },
  { id: 'denken', label: 'Denken', emoji: '💡', games: ['memory', 'reeksen'] },
  {
    id: 'ontdekken',
    label: 'Ontdekken',
    emoji: '🔭',
    games: ['dino_quiz', 'planeten_puzzel'],
  },
]

/** Percentage right for 1, 2 and 3 stars, for the quiz-style games. */
export const STAR_THRESHOLDS: [number, number, number] = [50, 75, 90]

/** Questions in one round of the quiz-style games. */
export const QUESTIONS_PER_ROUND = 10

/** Child profile pictures: emoji, so no photos of children are stored. */
export const CHILD_AVATARS = [
  '🦊',
  '🐻',
  '🐼',
  '🐸',
  '🦁',
  '🐯',
  '🐨',
  '🐰',
  '🦄',
  '🐢',
  '🐙',
  '🦉',
] as const

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
export function neighbours(
  row: number,
  col: number,
  gridSize: number,
): [number, number][] {
  const result: [number, number][] = []
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const r = row + dr
      const c = col + dc
      if ((dr || dc) && r >= 0 && c >= 0 && r < gridSize && c < gridSize)
        result.push([r, c])
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
    id: 'easy',
    label: 'Makkelijk',
    emoji: '🟢',
    minNumber: 1,
    maxNumber: 20,
    addition: true,
    subtraction: true,
    multiplication: false,
    division: false,
    fractions: false,
    questionsPerRound: 10,
    timeLimitSeconds: 30,
    pointsPerCorrect: 10,
    speedBonus: 5,
    starThresholds: [50, 75, 90],
  },
  {
    id: 'medium',
    label: 'Gemiddeld',
    emoji: '🟡',
    minNumber: 1,
    maxNumber: 50,
    addition: true,
    subtraction: true,
    multiplication: true,
    division: true,
    fractions: false,
    questionsPerRound: 15,
    timeLimitSeconds: 20,
    pointsPerCorrect: 15,
    speedBonus: 10,
    starThresholds: [50, 75, 90],
  },
  {
    id: 'hard',
    label: 'Moeilijk',
    emoji: '🔴',
    minNumber: 1,
    maxNumber: 100,
    addition: true,
    subtraction: true,
    multiplication: true,
    division: true,
    fractions: true,
    questionsPerRound: 20,
    timeLimitSeconds: 15,
    pointsPerCorrect: 20,
    speedBonus: 15,
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
  const answer =
    op === '+' ? a + b : op === '-' ? a - b : op === '×' ? a * b : a / b
  return { text: `${a} ${op} ${b}`, answer: round2(answer) }
}

/** Typed answers accept a comma as decimal sign. */
export function isRightAnswer(exercise: Exercise, typed: string): boolean {
  const value = Number(typed.trim().replace(',', '.'))
  return (
    typed.trim() !== '' &&
    Number.isFinite(value) &&
    Math.abs(value - exercise.answer) < 0.01
  )
}

export function exercisePoints(
  level: MathLevel,
  right: boolean,
  seconds: number,
): number {
  if (!right) return 0
  const fast =
    level.timeLimitSeconds > 0 && seconds <= level.timeLimitSeconds / 2
  return level.pointsPerCorrect + (fast ? level.speedBonus : 0)
}

/** 0 to 3 stars for the share of right answers. */
export function starsFor(
  rightCount: number,
  total: number,
  thresholds: [number, number, number],
): number {
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
  if (isSolved(board) && board.length > 1)
    [board[0], board[1]] = [board[1], board[0]]
  return board
}

export function isSolved(board: readonly number[]): boolean {
  return board.every((tile, i) => tile === i)
}

/** 3 stars within one move per tile, 2 within two, else 1. */
export function puzzleStars(moves: number, size: number): number {
  const tiles = size * size
  return moves <= tiles ? 3 : moves <= tiles * 2 ? 2 : 1
}

/** A planet's symbol on the puzzle's picker, by its number. */
export const PLANET_EMOJI: Record<number, string> = {
  1: '☿️',
  2: '♀️',
  3: '🌍',
  4: '🔴',
  5: '🟠',
  6: '🪐',
  7: '🔵',
  8: '💙',
  9: '⚪',
}

export function swapTiles(
  board: readonly number[],
  a: number,
  b: number,
): number[] {
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
export function dinoQuestions<
  T extends { name: string; imageUrl: string | null },
>(dinos: readonly T[], random: Random): DinoQuestion<T>[] {
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

// ============================================================================
// Splitsen: split a number in two (the "splitshuis")
// ============================================================================

export interface SplitLevel {
  id: string
  label: string
  emoji: string
  /** Smallest and largest number to split */
  min: number
  max: number
}

export const SPLIT_LEVELS: SplitLevel[] = [
  { id: 'tot5', label: 'Tot 5', emoji: '🟢', min: 2, max: 5 },
  { id: 'tot10', label: 'Tot 10', emoji: '🟡', min: 5, max: 10 },
  { id: 'tot20', label: 'Tot 20', emoji: '🔴', min: 10, max: 20 },
]

export interface SplitQuestion {
  total: number
  /** The part that is given */
  known: number
  /** The part to find: total − known */
  answer: number
  /** Whether the given part is on the left of the house */
  knownLeft: boolean
}

/** Splits with both parts at least 1, never the same one twice in a row. */
export function splitQuestions(
  level: SplitLevel,
  count: number,
  random: Random,
): SplitQuestion[] {
  const result: SplitQuestion[] = []
  while (result.length < count) {
    const total = randomInt(random, level.min, level.max)
    const known = randomInt(random, 1, total - 1)
    const last = result[result.length - 1]
    if (last && last.total === total && last.known === known) continue
    result.push({
      total,
      known,
      answer: total - known,
      knownLeft: random() < 0.5,
    })
  }
  return result
}

// ============================================================================
// Klokkijken: read an analogue clock
// ============================================================================

export interface ClockLevel {
  id: string
  label: string
  emoji: string
  /** Times on this level are whole multiples of this many minutes */
  stepMinutes: 60 | 30 | 15 | 5
}

export const CLOCK_LEVELS: ClockLevel[] = [
  { id: 'uur', label: 'Hele uren', emoji: '🟢', stepMinutes: 60 },
  { id: 'half', label: 'Halve uren', emoji: '🟡', stepMinutes: 30 },
  { id: 'kwart', label: 'Kwartieren', emoji: '🟠', stepMinutes: 15 },
  { id: 'vijf', label: 'Per 5 minuten', emoji: '🔴', stepMinutes: 5 },
]

export interface ClockTime {
  /** 1 to 12 */
  hour: number
  /** 0 to 55 */
  minute: number
}

const HOUR_WORDS = [
  'twaalf',
  'één',
  'twee',
  'drie',
  'vier',
  'vijf',
  'zes',
  'zeven',
  'acht',
  'negen',
  'tien',
  'elf',
]

/** The time as children learn to say it: "kwart over drie", "half vier". */
export function clockText({ hour, minute }: ClockTime): string {
  const h = HOUR_WORDS[hour % 12]
  const n = HOUR_WORDS[(hour + 1) % 12]
  switch (minute) {
    case 0:
      return `${h} uur`
    case 5:
      return `vijf over ${h}`
    case 10:
      return `tien over ${h}`
    case 15:
      return `kwart over ${h}`
    case 20:
      return `tien voor half ${n}`
    case 25:
      return `vijf voor half ${n}`
    case 30:
      return `half ${n}`
    case 35:
      return `vijf over half ${n}`
    case 40:
      return `tien over half ${n}`
    case 45:
      return `kwart voor ${n}`
    case 50:
      return `tien voor ${n}`
    case 55:
      return `vijf voor ${n}`
    default:
      throw new Error(`No words for minute ${minute}`)
  }
}

export const CLOCK_CHOICES = 4

export interface ClockQuestion {
  time: ClockTime
  choices: string[]
}

function clockTimes(level: ClockLevel): ClockTime[] {
  const times: ClockTime[] = []
  for (let hour = 1; hour <= 12; hour++)
    for (let minute = 0; minute < 60; minute += level.stepMinutes)
      times.push({ hour, minute })
  return times
}

/**
 * Clocks to read, each with four times to pick from. From the half hours
 * on, one wrong choice is an hour off ("half drie" for "half vier"): the
 * mistake children make most.
 */
export function clockQuestions(
  level: ClockLevel,
  count: number,
  random: Random,
): ClockQuestion[] {
  const times = clockTimes(level)
  const order: ClockTime[] = []
  while (order.length < count) order.push(...shuffle(times, random))
  return order.slice(0, count).map(time => {
    const right = clockText(time)
    const wrong = new Set<string>()
    if (level.stepMinutes < 60) {
      const hour = time.hour === 1 ? 12 : time.hour - 1
      wrong.add(clockText({ ...time, hour }))
    }
    for (const other of shuffle(times, random)) {
      if (wrong.size >= CLOCK_CHOICES - 1) break
      const t = clockText(other)
      if (t !== right) wrong.add(t)
    }
    return { time, choices: shuffle([right, ...wrong], random) }
  })
}

// ============================================================================
// Geld tellen: pay the exact price with coins and notes
// ============================================================================

export interface MoneyLevel {
  id: string
  label: string
  emoji: string
  /** Coins and notes to pay with, in cents */
  pieces: number[]
  /** Prices are multiples of this, up to `maxCents` */
  stepCents: number
  maxCents: number
}

export const MONEY_LEVELS: MoneyLevel[] = [
  {
    id: 'euro',
    label: 'Hele euro’s',
    emoji: '🟢',
    pieces: [100, 200, 500],
    stepCents: 100,
    maxCents: 1000,
  },
  {
    id: 'halve',
    label: 'Met 50 cent',
    emoji: '🟡',
    pieces: [50, 100, 200, 500],
    stepCents: 50,
    maxCents: 1000,
  },
  {
    id: 'centen',
    label: 'Met centen',
    emoji: '🔴',
    pieces: [10, 20, 50, 100, 200, 500, 1000],
    stepCents: 10,
    maxCents: 2000,
  },
]

export const SHOP_ITEMS = [
  '🍦',
  '🍎',
  '🧸',
  '📚',
  '🍪',
  '🎈',
  '🖍️',
  '⚽',
  '🧃',
  '🍫',
  '🪁',
  '🚗',
] as const

/** "€ 3" or "€ 2,50"; with `coin`, an amount under a euro is "50 cent". */
export function formatEuro(cents: number, coin = false): string {
  if (coin && cents < 100) return `${cents} cent`
  const euros = Math.floor(cents / 100)
  const rest = cents % 100
  return rest === 0
    ? `€ ${euros}`
    : `€ ${euros},${String(rest).padStart(2, '0')}`
}

export interface MoneyQuestion {
  item: string
  cents: number
}

/** Things to buy, each with a price the level's money can pay exactly. */
export function moneyQuestions(
  level: MoneyLevel,
  count: number,
  random: Random,
): MoneyQuestion[] {
  const items = shuffle(SHOP_ITEMS, random)
  const steps = level.maxCents / level.stepCents
  return Array.from({ length: count }, (_, i) => ({
    item: items[i % items.length],
    cents: randomInt(random, 1, steps) * level.stepCents,
  }))
}

// ============================================================================
// Woordjes lezen: read a word, find its picture (and the other way round)
// ============================================================================

export interface WordItem {
  word: string
  emoji: string
}

export interface WordList {
  name: string
  emoji: string
  words: WordItem[]
}

export const WORD_CHOICES = 4
export const WORD_LIST_MIN = WORD_CHOICES
export const WORD_LIST_MAX = 40

/** The lists the app uses until lists are made on the website. */
export const DEFAULT_WORD_LISTS: WordList[] = [
  {
    name: 'Dieren',
    emoji: '🐾',
    words: [
      { word: 'kat', emoji: '🐱' },
      { word: 'hond', emoji: '🐶' },
      { word: 'vis', emoji: '🐟' },
      { word: 'koe', emoji: '🐄' },
      { word: 'schaap', emoji: '🐑' },
      { word: 'paard', emoji: '🐴' },
      { word: 'muis', emoji: '🐭' },
      { word: 'uil', emoji: '🦉' },
      { word: 'eend', emoji: '🦆' },
      { word: 'beer', emoji: '🐻' },
      { word: 'kip', emoji: '🐔' },
      { word: 'varken', emoji: '🐷' },
    ],
  },
  {
    name: 'Eten',
    emoji: '🍎',
    words: [
      { word: 'appel', emoji: '🍎' },
      { word: 'peer', emoji: '🍐' },
      { word: 'ei', emoji: '🥚' },
      { word: 'kaas', emoji: '🧀' },
      { word: 'brood', emoji: '🍞' },
      { word: 'melk', emoji: '🥛' },
      { word: 'taart', emoji: '🎂' },
      { word: 'soep', emoji: '🍲' },
      { word: 'wortel', emoji: '🥕' },
      { word: 'druif', emoji: '🍇' },
      { word: 'ijs', emoji: '🍦' },
      { word: 'koek', emoji: '🍪' },
    ],
  },
  {
    name: 'Thuis',
    emoji: '🏠',
    words: [
      { word: 'bed', emoji: '🛏️' },
      { word: 'deur', emoji: '🚪' },
      { word: 'stoel', emoji: '🪑' },
      { word: 'boek', emoji: '📖' },
      { word: 'sok', emoji: '🧦' },
      { word: 'lamp', emoji: '💡' },
      { word: 'sleutel', emoji: '🔑' },
      { word: 'bad', emoji: '🛁' },
      { word: 'zeep', emoji: '🧼' },
      { word: 'jas', emoji: '🧥' },
      { word: 'pet', emoji: '🧢' },
      { word: 'bal', emoji: '⚽' },
    ],
  },
  {
    name: 'Buiten',
    emoji: '🌳',
    words: [
      { word: 'boom', emoji: '🌳' },
      { word: 'zon', emoji: '☀️' },
      { word: 'maan', emoji: '🌙' },
      { word: 'ster', emoji: '⭐' },
      { word: 'roos', emoji: '🌹' },
      { word: 'auto', emoji: '🚗' },
      { word: 'fiets', emoji: '🚲' },
      { word: 'bus', emoji: '🚌' },
      { word: 'boot', emoji: '⛵' },
      { word: 'trein', emoji: '🚂' },
      { word: 'wolk', emoji: '☁️' },
      { word: 'regen', emoji: '🌧️' },
    ],
  },
]

export interface WordQuestion {
  item: WordItem
  /** True: read the word, pick the picture. False: the other way round. */
  showWord: boolean
  choices: WordItem[]
}

/** Each word at most once per round, with three other words to pick from. */
export function wordQuestions(
  words: readonly WordItem[],
  count: number,
  random: Random,
): WordQuestion[] {
  const unique = [...new Map(words.map(w => [w.word, w])).values()]
  if (unique.length < WORD_CHOICES) return []
  return shuffle(unique, random)
    .slice(0, count)
    .map(item => {
      const others = shuffle(
        unique.filter(w => w.word !== item.word),
        random,
      ).slice(0, WORD_CHOICES - 1)
      return {
        item,
        showWord: random() < 0.5,
        choices: shuffle([item, ...others], random),
      }
    })
}

// ============================================================================
// Reeksen: what comes next?
// ============================================================================

export interface SequenceLevel {
  id: 'patroon' | 'tellen' | 'sprongen'
  label: string
  emoji: string
  description: string
}

export const SEQUENCE_LEVELS: SequenceLevel[] = [
  {
    id: 'patroon',
    label: 'Patronen',
    emoji: '🟢',
    description: 'Welk figuurtje komt erna?',
  },
  {
    id: 'tellen',
    label: 'Tellen',
    emoji: '🟡',
    description: 'Tel verder met 1, 2, 5 of 10',
  },
  {
    id: 'sprongen',
    label: 'Sprongen',
    emoji: '🔴',
    description: 'Vooruit, achteruit en verdubbelen',
  },
]

export interface SequenceQuestion {
  items: string[]
  answer: string
  /** Pictures to pick from; null when the answer is a number to type */
  choices: string[] | null
}

const PATTERN_SETS = [
  ['🔴', '🔵', '🟡', '🟢'],
  ['🍎', '🍌', '🍇', '🍓'],
  ['🐶', '🐱', '🐰', '🐸'],
  ['⭐', '🌙', '☀️', '☁️'],
  ['🔺', '🟦', '🟣', '🔶'],
]

/** Repeating units, as positions in a set of four pictures. */
const PATTERNS = [
  [0, 1],
  [0, 0, 1],
  [0, 1, 1],
  [0, 1, 2],
  [0, 0, 1, 1],
  [0, 1, 2, 1],
]

const SEQUENCE_SHOWN = 5

function pick<T>(items: readonly T[], random: Random): T {
  return items[randomInt(random, 0, items.length - 1)]
}

function patternQuestion(random: Random): SequenceQuestion {
  const set = shuffle(pick(PATTERN_SETS, random), random)
  const unit = pick(PATTERNS, random)
  // At least one whole unit and a bit more, so the pattern can be seen.
  const length = randomInt(random, Math.max(5, unit.length + 2), 8)
  const at = (i: number) => set[unit[i % unit.length]]
  const used = [...new Set(unit)].map(i => set[i])
  const extra = set.find(s => !used.includes(s))
  return {
    items: Array.from({ length }, (_, i) => at(i)),
    answer: at(length),
    choices: shuffle(extra ? [...used, extra] : used, random),
  }
}

function numberQuestion(
  level: SequenceLevel,
  random: Random,
): SequenceQuestion {
  const n = SEQUENCE_SHOWN + 1
  let values: number[]
  if (level.id === 'tellen') {
    const step = pick([1, 2, 5, 10], random)
    const start = step * randomInt(random, 0, 5)
    values = Array.from({ length: n }, (_, i) => start + i * step)
  } else {
    const kind = pick(['up', 'down', 'double'] as const, random)
    if (kind === 'double') {
      const start = randomInt(random, 1, 3)
      values = Array.from({ length: n }, (_, i) => start * 2 ** i)
    } else {
      const step = randomInt(random, 2, 10)
      const start = randomInt(random, 0, 20)
      values = Array.from({ length: n }, (_, i) => start + i * step)
      // Counting back ends at the start, so it never goes below zero.
      if (kind === 'down') values.reverse()
    }
  }
  return {
    items: values.slice(0, SEQUENCE_SHOWN).map(String),
    answer: String(values[SEQUENCE_SHOWN]),
    choices: null,
  }
}

export function sequenceQuestions(
  level: SequenceLevel,
  count: number,
  random: Random,
): SequenceQuestion[] {
  return Array.from({ length: count }, () =>
    level.id === 'patroon'
      ? patternQuestion(random)
      : numberQuestion(level, random),
  )
}
