/**
 * Number fields that keep what the creator types.
 *
 * The mission editor's number inputs used to parse and clamp on every
 * keystroke: "7." became 7, so "7.5" arrived as 75; a field clamped to a
 * minimum of 3000 turned "5" into 3000 and "5000" into 30005000; a cleared
 * field saved 0. Here the text stays as typed, and only a value that parses
 * and fits the field's rules is handed on (the same rules as the mobile
 * mission wizard's number fields).
 */

/** What a number field accepts. */
export interface NumberRules {
  /** Smallest allowed value (inclusive) */
  min?: number
  /** Largest allowed value (inclusive) */
  max?: number
  /** Whether only whole numbers are allowed */
  integer?: boolean
  /** Whether an empty field is an error rather than "use the default" */
  required?: boolean
}

/**
 * A number field's text as a finite number, or null when there is none yet.
 * Accepts a comma as the decimal separator, which many locales type.
 */
export function parseNumberInput(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value !== 'string') return null
  const text = value.trim().replace(',', '.')
  if (text === '') return null
  const num = Number(text)
  return Number.isFinite(num) ? num : null
}

/** A stored value as the text a number field shows ('' when unset). */
export function formatNumber(value: unknown): string {
  const num = parseNumberInput(value)
  return num === null ? '' : String(num)
}

/** Why a number field's text can't be saved, or null when it can. */
export function numberInputError(
  text: string,
  rules: NumberRules,
): string | null {
  if (text.trim() === '') return rules.required ? 'Required' : null
  const num = parseNumberInput(text)
  if (num === null) return 'Enter a number'
  if (rules.integer && !Number.isInteger(num)) return 'Enter a whole number'
  if (rules.min !== undefined && num < rules.min) {
    return `Must be at least ${rules.min}`
  }
  if (rules.max !== undefined && num > rules.max) {
    return `Must be at most ${rules.max}`
  }
  return null
}

/**
 * What a number field hands on for its text: the number, `undefined` for an
 * empty field (so the param's default applies), or `null` while the text
 * can't be saved — the last good value is kept then.
 */
export function numberInputValue(
  text: string,
  rules: NumberRules,
): number | undefined | null {
  if (numberInputError(text, rules)) return null
  return parseNumberInput(text) ?? undefined
}
