import { describe, expect, it } from 'vitest'
import {
  DEFAULT_MATH_LEVELS,
  buildMemoryDeck,
  cellValue,
  dinoQuestions,
  exercisePoints,
  generateExercise,
  isRightAnswer,
  isSolved,
  neighbours,
  pickBlanks,
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
        if (ex.text.includes('÷')) expect(Number.isInteger(ex.answer)).toBe(true)
      }
    }
  })

  it('checks answers, adds a speed bonus and gives stars', () => {
    expect(isRightAnswer({ text: '1/2 + 1/4', answer: 0.75 }, '0,75')).toBe(true)
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
      deck.reduce<Record<string, number>>((acc, e) => ({ ...acc, [e]: (acc[e] ?? 0) + 1 }), {}),
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
      expect([...board].sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8])
    }
    expect(isSolved(swapTiles([1, 0, 2], 0, 1))).toBe(true)
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
    expect(questions.map(q => q.dino.name).sort()).toEqual(['T-Rex', 'Triceratops'])
    for (const q of questions) {
      expect(q.choices).toHaveLength(3)
      expect(new Set(q.choices).size).toBe(3)
      expect(q.choices).toContain(q.dino.name)
    }
  })
})
