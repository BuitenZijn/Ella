import { describe, it, expect } from 'vitest'
import { ConvexError } from 'convex/values'
import { getErrorMessage } from './errorMessage'

describe('getErrorMessage', () => {
  it('shows the message a coded backend error carries', () => {
    const error = new ConvexError({
      code: 'INVALID_ARGUMENT',
      message:
        'Waypoint 2: the checkpoint mission "Quiz" (quiz) has no questions.',
    })
    // What a toast showed before: the serialized envelope.
    expect(error.message).toContain('"code"')

    expect(getErrorMessage(error, 'Failed to activate quest')).toBe(
      'Waypoint 2: the checkpoint mission "Quiz" (quiz) has no questions.',
    )
  })

  it('shows a ConvexError thrown with a plain string', () => {
    expect(getErrorMessage(new ConvexError('Quest is archived'), 'x')).toBe(
      'Quest is archived',
    )
  })

  it('falls back when a ConvexError has no readable message', () => {
    expect(
      getErrorMessage(new ConvexError({ code: 'FORBIDDEN' }), 'Not allowed'),
    ).toBe('Not allowed')
    expect(
      getErrorMessage(
        new ConvexError({ code: 'FORBIDDEN', message: '  ' }),
        'Not allowed',
      ),
    ).toBe('Not allowed')
  })

  it("keeps other errors' own message", () => {
    expect(getErrorMessage(new Error('Opladen mislukt: 413'), 'x')).toBe(
      'Opladen mislukt: 413',
    )
  })

  it('shows the fallback, not the envelope, for an uncoded server error', () => {
    // A plain `Error` thrown by a Convex function, as production delivers it:
    // the original message is dropped and only the envelope is left.
    const error = new Error(
      '[CONVEX M(quests:saveQuestWithWaypoints)] [Request ID: 1a2b3c] Server Error\n  Called by client',
    )

    expect(getErrorMessage(error, 'Failed to save quest')).toBe(
      'Failed to save quest',
    )
  })

  it('shows the original message of an uncoded server error in development', () => {
    const error = new Error(
      [
        '[CONVEX M(quests:activate)] [Request ID: 1a2b3c] Server Error',
        'Uncaught Error: Quest must have a description to be activated',
        '    at validateQuestActivation (../../convex/lib/lifecycle.ts:182:11)',
        '  Called by client',
      ].join('\n'),
    )

    expect(getErrorMessage(error, 'Failed to activate quest')).toBe(
      'Quest must have a description to be activated',
    )
  })

  it('falls back for anything that is not an error', () => {
    expect(getErrorMessage('boom', 'Er ging iets mis')).toBe('Er ging iets mis')
    expect(getErrorMessage(undefined, 'Er ging iets mis')).toBe(
      'Er ging iets mis',
    )
    expect(getErrorMessage(new Error(''), 'Er ging iets mis')).toBe(
      'Er ging iets mis',
    )
  })
})
