import { describe, expect, it } from 'vitest'
import {
  CLOCK_LEVELS,
  DEFAULT_MATH_LEVELS,
  DEFAULT_WORD_LISTS,
  GAMES,
  GAME_CATEGORIES,
  MONEY_LEVELS,
  SEQUENCE_LEVELS,
  SPLIT_LEVELS,
  buildMemoryDeck,
  clockQuestions,
  clockText,
  formatEuro,
  moneyQuestions,
  sequenceQuestions,
  splitQuestions,
  wordQuestions,
  cellValue,
  dinoQuestions,
  exercisePoints,
  generateExercise,
  isRightAnswer,
  isSolved,
  neighbours,
  pickBlanks,
  puzzleStars,
  shuffledBoard,
  starsFor,
  swapTiles,
} from '../convex/lib/games'

/** A repeatable random sequence. */
function seeded(seed = 1) {
  let state = seed
  return () => {
    state = (state * 1664525 + 1013904223) % 2 ** 32
    return state / 2 ** 32
  }
}

describe('maaltafelpuzzel', () => {
  it('fills the grid with products and picks unsolved blanks', () => {
    expect(cellValue(0, 0)).toBe(1)
    expect(cellValue(6, 7)).toBe(56)
    const solved = new Set(['0_0', '0_1'])
    const blanks = pickBlanks(2, 5, solved, seeded())
    expect(blanks).toHaveLength(2) // only 2 of 4 cells left
    expect(blanks.map(([r, c]) => `${r}_${c}`).sort()).toEqual(['1_0', '1_1'])
  })

  it('finds neighbours inside the grid only', () => {
    expect(neighbours(0, 0, 10)).toHaveLength(3)
    expect(neighbours(5, 5, 10)).toHaveLength(8)
  })
})

describe('rekenoefeningen', () => {
  it('makes sums that fit the level', () => {
    const random = seeded(7)
    for (const level of DEFAULT_MATH_LEVELS) {
      for (let i = 0; i < 200; i++) {
        const ex = generateExercise(level, random)
        expect(Number.isFinite(ex.answer)).toBe(true)
        if (ex.text.includes(' - ') && !ex.text.includes('/')) {
          expect(ex.answer).toBeGreaterThanOrEqual(0)
        }
        if (ex.text.includes('÷'))
          expect(Number.isInteger(ex.answer)).toBe(true)
      }
    }
  })

  it('checks answers, adds a speed bonus and gives stars', () => {
    expect(isRightAnswer({ text: '1/2 + 1/4', answer: 0.75 }, '0,75')).toBe(
      true,
    )
    expect(isRightAnswer({ text: '2 + 2', answer: 4 }, '')).toBe(false)
    const easy = DEFAULT_MATH_LEVELS[0]
    expect(exercisePoints(easy, true, 10)).toBe(15) // within half of 30 s
    expect(exercisePoints(easy, true, 20)).toBe(10)
    expect(exercisePoints(easy, false, 1)).toBe(0)
    expect(starsFor(9, 10, [50, 75, 90])).toBe(3)
    expect(starsFor(7, 10, [50, 75, 90])).toBe(1)
    expect(starsFor(0, 0, [50, 75, 90])).toBe(0)
  })
})

describe('memory', () => {
  it('deals each emoji exactly pair- or trio-wise', () => {
    const emojis = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊']
    const deck = buildMemoryDeck(emojis, 3, 9, seeded())!
    expect(deck).toHaveLength(9)
    const counts = Object.values(
      deck.reduce<Record<string, number>>(
        (acc, e) => ({ ...acc, [e]: (acc[e] ?? 0) + 1 }),
        {},
      ),
    )
    expect(counts).toEqual([3, 3, 3])
    expect(buildMemoryDeck(emojis, 2, 16, seeded())).toBeNull() // needs 8 kinds
  })
})

describe('planetenpuzzel', () => {
  it('never starts solved and is solved by swapping back', () => {
    for (let seed = 1; seed < 50; seed++) {
      const board = shuffledBoard(3, seeded(seed))
      expect(isSolved(board)).toBe(false)
      expect([...board].sort((a, b) => a - b)).toEqual([
        0, 1, 2, 3, 4, 5, 6, 7, 8,
      ])
    }
    expect(isSolved(swapTiles([1, 0, 2], 0, 1))).toBe(true)
    expect([9, 18, 19].map(m => puzzleStars(m, 3))).toEqual([3, 2, 1])
  })
})

describe('dinoquiz', () => {
  it('asks only about dinosaurs with a picture, with 3 different choices', () => {
    const dinos = [
      { name: 'T-Rex', imageUrl: 'a' },
      { name: 'Triceratops', imageUrl: 'b' },
      { name: 'Stegosaurus', imageUrl: null },
      { name: 'Diplodocus', imageUrl: null },
    ]
    const questions = dinoQuestions(dinos, seeded())
    expect(questions.map(q => q.dino.name).sort()).toEqual([
      'T-Rex',
      'Triceratops',
    ])
    for (const q of questions) {
      expect(q.choices).toHaveLength(3)
      expect(new Set(q.choices).size).toBe(3)
      expect(q.choices).toContain(q.dino.name)
    }
  })
})

describe('categories', () => {
  it('puts every game in exactly one category', () => {
    const grouped = GAME_CATEGORIES.flatMap(c => c.games)
    expect([...grouped].sort()).toEqual([...GAMES].sort())
  })
})

describe('splitsen', () => {
  it('splits into two parts of at least 1 within the level', () => {
    const random = seeded(3)
    for (const level of SPLIT_LEVELS) {
      const questions = splitQuestions(level, 50, random)
      expect(questions).toHaveLength(50)
      for (const q of questions) {
        expect(q.total).toBeGreaterThanOrEqual(level.min)
        expect(q.total).toBeLessThanOrEqual(level.max)
        expect(q.known).toBeGreaterThanOrEqual(1)
        expect(q.answer).toBeGreaterThanOrEqual(1)
        expect(q.known + q.answer).toBe(q.total)
      }
    }
  })
})

describe('klokkijken', () => {
  it('says the time the way children learn it', () => {
    expect(clockText({ hour: 3, minute: 0 })).toBe('drie uur')
    expect(clockText({ hour: 3, minute: 15 })).toBe('kwart over drie')
    expect(clockText({ hour: 3, minute: 30 })).toBe('half vier')
    expect(clockText({ hour: 3, minute: 40 })).toBe('tien over half vier')
    expect(clockText({ hour: 11, minute: 45 })).toBe('kwart voor twaalf')
    expect(clockText({ hour: 12, minute: 55 })).toBe('vijf voor één')
  })

  it('asks times of the level with four different choices', () => {
    const random = seeded(5)
    for (const level of CLOCK_LEVELS) {
      for (const q of clockQuestions(level, 20, random)) {
        expect(q.time.minute % level.stepMinutes).toBe(0)
        expect(new Set(q.choices).size).toBe(4)
        expect(q.choices).toContain(clockText(q.time))
      }
    }
  })
})

describe('geld tellen', () => {
  it('formats euros and asks prices the level can pay', () => {
    expect(formatEuro(300)).toBe('€ 3')
    expect(formatEuro(250)).toBe('€ 2,50')
    expect(formatEuro(1005)).toBe('€ 10,05')
    expect(formatEuro(50, true)).toBe('50 cent')
    expect(formatEuro(200, true)).toBe('€ 2')
    const random = seeded(9)
    for (const level of MONEY_LEVELS) {
      for (const q of moneyQuestions(level, 30, random)) {
        expect(q.cents).toBeGreaterThan(0)
        expect(q.cents).toBeLessThanOrEqual(level.maxCents)
        expect(q.cents % Math.min(...level.pieces)).toBe(0)
      }
    }
  })
})

describe('woordjes lezen', () => {
  it('asks each word once, with four different words to pick from', () => {
    const words = DEFAULT_WORD_LISTS[0].words
    const questions = wordQuestions(words, 10, seeded(2))
    expect(questions).toHaveLength(10)
    expect(new Set(questions.map(q => q.item.word)).size).toBe(10)
    for (const q of questions) {
      expect(new Set(q.choices.map(c => c.word)).size).toBe(4)
      expect(q.choices).toContainEqual(q.item)
    }
    expect(wordQuestions(words.slice(0, 3), 10, seeded())).toEqual([])
  })
})

describe('reeksen', () => {
  it('continues patterns and number rows', () => {
    const random = seeded(4)
    for (const level of SEQUENCE_LEVELS) {
      for (const q of sequenceQuestions(level, 30, random)) {
        if (q.choices) {
          expect(q.choices).toContain(q.answer)
          expect(new Set(q.choices).size).toBe(q.choices.length)
        } else {
          const nums = [...q.items, q.answer].map(Number)
          expect(nums.every(n => Number.isInteger(n) && n >= 0)).toBe(true)
          const steps = nums.slice(1).map((n, i) => n - nums[i])
          const ratios = nums.slice(1).map((n, i) => n / nums[i])
          expect(
            steps.every(s => s === steps[0]) || ratios.every(r => r === 2),
          ).toBe(true)
        }
      }
    }
  })
})
