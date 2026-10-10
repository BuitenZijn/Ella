import { ConvexError } from 'convex/values'

// A plain `Error` thrown inside a Convex function reaches the client wrapped
// as "[CONVEX M(quests:activate)] [Request ID: …] Server Error". Development
// builds append "Uncaught Error: <original message>" and a stack; production
// drops the original message entirely.
const CONVEX_ENVELOPE = /^\[CONVEX [A-Z]+\(/
const UNCAUGHT_MESSAGE = /^Uncaught \w*Error: (.+)$/m

/** The `code` a backend `ConvexError({ code, message })` carries, if any. */
export function getErrorCode(error: unknown): string | undefined {
  if (!(error instanceof ConvexError)) return undefined
  const data: unknown = error.data
  if (data && typeof data === 'object' && 'code' in data) {
    const { code } = data as { code: unknown }
    if (typeof code === 'string') return code
  }
  return undefined
}

/**
 * The text to show a person when a call fails.
 *
 * Backend functions throw `ConvexError({ code, message })` for failures a
 * person can act on (see `permanentError` in
 * packages/backend/convex/lib/errors.ts), such as a quest that can't be
 * activated yet. On the client that object arrives as the error's `data`,
 * while `error.message` is the serialized envelope with the function path
 * and request id — noise in a toast. An uncoded server error shows its
 * original message when the envelope still carries one (development), and
 * the fallback otherwise. Other errors keep their own message.
 *
 * @param fallback shown when the error carries no readable message
 */
export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ConvexError) {
    const data: unknown = error.data
    if (typeof data === 'string' && data.trim()) return data
    if (data && typeof data === 'object' && 'message' in data) {
      const { message } = data as { message: unknown }
      if (typeof message === 'string' && message.trim()) return message
    }
    return fallback
  }
  if (error instanceof Error && error.message.trim()) {
    if (!CONVEX_ENVELOPE.test(error.message)) return error.message
    return error.message.match(UNCAUGHT_MESSAGE)?.[1]?.trim() || fallback
  }
  return fallback
}
