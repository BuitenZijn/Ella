import { describe, expect, it } from 'vitest'
import { ConvexError } from 'convex/values'
import { describeAppError } from './appError'

describe('describeAppError', () => {
  it('explains a missing resource', () => {
    const copy = describeAppError(
      new ConvexError({ code: 'NOT_FOUND', message: 'Session not found' }),
    )
    expect(copy).toEqual({
      title: 'Niet gevonden',
      message: 'Session not found',
      expected: true,
    })
  })

  it('explains a forbidden resource, with a fallback message', () => {
    const copy = describeAppError(new ConvexError({ code: 'FORBIDDEN' }))
    expect(copy.title).toBe('Geen toegang')
    expect(copy.message).toMatch(/geen toegang/)
  })

  it('never shows the Convex envelope of a production server error', () => {
    const copy = describeAppError(
      new Error(
        '[CONVEX Q(quests:list)] [Request ID: 0a1b2c] Server Error\n  Called by client',
      ),
    )
    expect(copy.title).toBe('Er ging iets mis')
    expect(copy.expected).toBe(false)
    expect(copy.message).not.toContain('CONVEX')
    expect(copy.message).not.toContain('Request ID')
  })

  it("shows a development server error's original message", () => {
    const copy = describeAppError(
      new Error(
        '[CONVEX Q(quests:get)] [Request ID: 0a1b2c] Server Error\nUncaught Error: Not authenticated\n    at handler',
      ),
    )
    expect(copy.message).toBe('Not authenticated')
  })

  it('hides the raw text of a component error', () => {
    const copy = describeAppError(
      new TypeError("Cannot read properties of undefined (reading 'title')"),
    )
    expect(copy.title).toBe('Er ging iets mis')
    expect(copy.message).not.toContain('undefined')
  })
})
