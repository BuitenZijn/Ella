import { ConvexError } from 'convex/values'
import { getErrorCode, getErrorMessage } from './errorMessage'

export interface AppErrorCopy {
  title: string
  message: string
  /** A coded "not found" or "no access": not worth an error report */
  expected: boolean
}

const GENERIC_MESSAGE =
  'Deze pagina kon niet geladen worden. Probeer opnieuw, of ga terug naar de startpagina.'

/**
 * What the app's error page says about an error thrown while rendering,
 * usually by a Convex query. Coded backend errors (`permanentError`) say what
 * went wrong; a Convex server error shows its message only where the
 * envelope still carries one (development); anything else, such as a
 * TypeError from a component, gets a generic line rather than its raw text.
 */
export function describeAppError(error: unknown): AppErrorCopy {
  const code = getErrorCode(error)
  if (code === 'NOT_FOUND') {
    return {
      title: 'Niet gevonden',
      message: getErrorMessage(
        error,
        'Wat je zoekt bestaat niet of werd verwijderd.',
      ),
      expected: true,
    }
  }
  if (code === 'FORBIDDEN') {
    return {
      title: 'Geen toegang',
      message: getErrorMessage(
        error,
        'Je account heeft geen toegang tot deze pagina.',
      ),
      expected: true,
    }
  }
  const fromBackend =
    error instanceof ConvexError ||
    (error instanceof Error && error.message.startsWith('[CONVEX '))
  return {
    title: 'Er ging iets mis',
    message: fromBackend
      ? getErrorMessage(error, GENERIC_MESSAGE)
      : GENERIC_MESSAGE,
    expected: false,
  }
}
