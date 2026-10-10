import { getErrorCode, getErrorMessage } from './errorMessage'

/** Same rule as the backend's password check (convex/auth.ts). */
export const MIN_PASSWORD_LENGTH = 8

/**
 * An email address as typed, without surrounding spaces. Not lower-cased:
 * the backend matches addresses whatever their case (see
 * `passwordAccountState`), and one of two accounts stored under the same
 * address in different cases is only reached by typing it exactly.
 */
export function trimEmail(email: string): string {
  return email.trim()
}

/** Whether signing up failed because the address already has an account. */
export function isEmailInUseError(error: unknown): boolean {
  return (
    getErrorCode(error) === 'EMAIL_IN_USE' ||
    (getErrorCode(error) === undefined &&
      /already exists/.test(getErrorMessage(error, '')))
  )
}

/** What "Resend code" did (see `resendVerificationCode` in the backend). */
export type ResendCodeStatus = 'sent' | 'reused'

/**
 * The notice after "Resend code". Past the hourly limit nothing is sent while
 * the last code still works (`reused`); announcing a new code then has people
 * wait for an email that isn't coming. A backend from before the status
 * answers nothing, and had sent a code.
 */
export function resendCodeNotice(
  email: string,
  status: ResendCodeStatus | undefined,
): string {
  return status === 'reused'
    ? 'Je vorige code is nog geldig — kijk in je inbox (en spam).'
    : `We stuurden een nieuwe code naar ${email}. Die is 15 minuten geldig.`
}

/** Which auth form failed, for wording that fits it. */
export type AuthFormAction =
  | 'signIn'
  | 'signUp'
  | 'verifyEmail'
  | 'resendCode'
  | 'requestReset'
  | 'resetPassword'

const FALLBACKS: Record<AuthFormAction, string> = {
  signIn: 'Aanmelden is niet gelukt. Probeer opnieuw.',
  signUp: 'Je account kon niet aangemaakt worden. Probeer opnieuw.',
  verifyEmail: 'De code kon niet gecontroleerd worden. Probeer opnieuw.',
  resendCode: 'Er kon geen nieuwe code verstuurd worden. Probeer opnieuw.',
  requestReset: 'Er kon geen resetlink verstuurd worden. Probeer opnieuw.',
  resetPassword:
    'Je wachtwoord kon niet opnieuw ingesteld worden. Probeer opnieuw.',
}

const INVALID_CREDENTIALS = 'Ongeldig e-mailadres of wachtwoord.'
const PASSWORD_TOO_SHORT = `Je wachtwoord moet minstens ${MIN_PASSWORD_LENGTH} tekens lang zijn.`
const EMAIL_IN_USE =
  'Dit e-mailadres is al geregistreerd. Meld je aan, of stel je wachtwoord opnieuw in als je het vergeten bent.'

function invalidCode(action: AuthFormAction) {
  return action === 'resetPassword'
    ? 'Deze resetlink is ongeldig of verlopen. Vraag een nieuwe aan.'
    : 'Deze code is ongeldig of verlopen. Vraag een nieuwe aan.'
}

/**
 * The message to show when an auth call fails.
 *
 * The backend codes every failure a person can act on (see `authError` in
 * packages/backend/convex/lib/auth.ts). Development builds, and backends from
 * before the codes, surface the auth library's raw messages instead
 * (`InvalidSecret`, "Invalid password", …); those are matched as a fallback.
 */
export function getAuthErrorMessage(
  error: unknown,
  action: AuthFormAction,
): string {
  const message = getErrorMessage(error, '')
  switch (getErrorCode(error)) {
    case 'INVALID_CREDENTIALS':
      return INVALID_CREDENTIALS
    case 'INVALID_PASSWORD':
      return PASSWORD_TOO_SHORT
    case 'EMAIL_IN_USE':
      return EMAIL_IN_USE
    case 'INVALID_CODE':
      return invalidCode(action)
    case 'TOO_MANY_REQUESTS':
    case 'INVALID_ARGUMENT':
      return message || FALLBACKS[action]
  }

  if (/TooManyFailedAttempts/.test(message)) {
    return 'Te veel mislukte pogingen. Wacht enkele minuten en probeer opnieuw, of stel je wachtwoord opnieuw in.'
  }
  if (/InvalidSecret|InvalidAccountId|Invalid credentials/i.test(message)) {
    return action === 'signIn' ? INVALID_CREDENTIALS : invalidCode(action)
  }
  if (/Invalid password/.test(message)) return PASSWORD_TOO_SHORT
  if (/already exists/.test(message)) return EMAIL_IN_USE
  if (/Could not verify code|Invalid code|expired/i.test(message)) {
    return invalidCode(action)
  }
  return message || FALLBACKS[action]
}
