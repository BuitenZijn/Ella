import { describe, expect, it } from 'vitest'
import { formatDate, formatDateTime, formatTime } from './formatDate'

// Built from local fields, so the expectations hold in any time zone
const afternoon = new Date(2026, 8, 28, 14, 5)
const morning = new Date(2026, 0, 3, 9, 7)

describe('formatDate', () => {
  it('uses day, short month and year, whatever the browser locale', () => {
    expect(formatDate(afternoon)).toBe('28 Sep 2026')
    expect(formatDate(morning)).toBe('3 Jan 2026')
  })

  it('accepts a timestamp', () => {
    expect(formatDate(afternoon.getTime())).toBe('28 Sep 2026')
  })
})

describe('formatDateTime', () => {
  it('adds a 24-hour time', () => {
    expect(formatDateTime(afternoon)).toBe('28 Sep 2026, 14:05')
    expect(formatDateTime(morning.getTime())).toBe('3 Jan 2026, 09:07')
  })
})

describe('formatTime', () => {
  it('uses a 24-hour clock', () => {
    expect(formatTime(afternoon)).toBe('14:05')
    expect(formatTime(morning)).toBe('09:07')
  })
})
