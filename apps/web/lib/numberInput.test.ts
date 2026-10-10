import { describe, it, expect } from 'vitest'
import {
  formatNumber,
  numberInputError,
  numberInputValue,
  parseNumberInput,
  type NumberRules,
} from './numberInput'

/**
 * What a number field hands on after each keystroke, as the mission editor
 * applies it: a value that can be saved replaces the last one, text that
 * can't keeps it. Returns the text shown and the value saved at the end.
 */
function type(
  keystrokes: string[],
  rules: NumberRules,
  initial?: number,
): { text: string; saved: number | undefined } {
  let text = formatNumber(initial)
  let saved = initial
  for (const key of keystrokes) {
    text = key === 'CLEAR' ? '' : key === 'BS' ? text.slice(0, -1) : text + key
    const value = numberInputValue(text, rules)
    if (value !== null) saved = value
  }
  return { text, saved }
}

// The cases the web scan reproduced against the old field, which parsed and
// clamped on every keystroke.
describe('typing into a number field', () => {
  it('takes a decimal: "7.5" km/h is 7.5, not 75', () => {
    expect(type(['7', '.', '5'], { min: 1, max: 50 })).toEqual({
      text: '7.5',
      saved: 7.5,
    })
  })

  it('keeps the text while it is below the minimum: 5000 ms, not 30005000', () => {
    expect(
      type(['CLEAR', '5', '0', '0', '0'], { min: 3000, max: 60000 }, 3000),
    ).toEqual({ text: '5000', saved: 5000 })
  })

  it('takes a tolerance of 0.5', () => {
    expect(type(['CLEAR', '0', '.', '5'], { min: 0 }, 0.01)).toEqual({
      text: '0.5',
      saved: 0.5,
    })
  })

  it('takes a comma as the decimal separator', () => {
    expect(type(['1', ',', '5'], {})).toEqual({ text: '1,5', saved: 1.5 })
  })

  it('never saves 0 for a cleared required field', () => {
    const cleared = type(['CLEAR'], { min: 1, required: true }, 60)
    expect(cleared).toEqual({ text: '', saved: 60 })
    expect(numberInputError(cleared.text, { min: 1, required: true })).toBe(
      'Required',
    )
  })

  it('saves nothing for a cleared optional field, so the default applies', () => {
    expect(type(['CLEAR'], { min: 0 }, 2)).toEqual({
      text: '',
      saved: undefined,
    })
  })

  it('replaces a value by backspacing and typing', () => {
    expect(type(['BS', '8'], { min: 4, max: 10, integer: true }, 6)).toEqual({
      text: '8',
      saved: 8,
    })
  })
})

describe('numberInputError', () => {
  it.each([
    ['abc', {}, 'Enter a number'],
    ['-', {}, 'Enter a number'],
    ['2.5', { integer: true }, 'Enter a whole number'],
    ['2', { min: 4 }, 'Must be at least 4'],
    ['20', { max: 10 }, 'Must be at most 10'],
    ['', { required: true }, 'Required'],
  ] as const)('says why %j cannot be saved (%j)', (text, rules, error) => {
    expect(numberInputError(text, rules)).toBe(error)
  })

  it('accepts values within the rules', () => {
    expect(numberInputError('4', { min: 4, max: 10, integer: true })).toBeNull()
    expect(numberInputError('', {})).toBeNull()
  })
})

describe('parseNumberInput', () => {
  it('reads numbers and number text, not other values', () => {
    expect(parseNumberInput(3)).toBe(3)
    expect(parseNumberInput(' 0,25 ')).toBe(0.25)
    expect(parseNumberInput('')).toBeNull()
    expect(parseNumberInput(Number.NaN)).toBeNull()
    expect(parseNumberInput(undefined)).toBeNull()
  })
})
