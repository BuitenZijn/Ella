import { describe, expect, it } from 'vitest'
import { ConvexError } from 'convex/values'
import {
  getAuthErrorMessage,
  isEmailInUseError,
  resendCodeNotice,
  trimEmail,
} from './authForms'

/** What a failed Convex call looks like in a development build. */
function devError(original: string) {
  return new Error(
    `[CONVEX A(auth:signIn)] [Request ID: 123] Server Error\nUncaught Error: ${original}\n    at handler`,
  )
}

describe('getAuthErrorMessage', () => {
  it('shows the coded messages the backend sends', () => {
    const coded = (code: string, message = 'from the server') =>
      new ConvexError({ code, message })
    expect(getAuthErrorMessage(coded('INVALID_CREDENTIALS'), 'signIn')).toBe(
      'Ongeldig e-mailadres of wachtwoord.',
    )
    expect(getAuthErrorMessage(coded('INVALID_PASSWORD'), 'signUp')).toBe(
      'Je wachtwoord moet minstens 8 tekens lang zijn.',
    )
    expect(getAuthErrorMessage(coded('EMAIL_IN_USE'), 'signUp')).toMatch(
      /al geregistreerd\. Meld je aan/,
    )
    expect(getAuthErrorMessage(coded('INVALID_CODE'), 'verifyEmail')).toMatch(
      /code is ongeldig of verlopen/,
    )
    expect(getAuthErrorMessage(coded('INVALID_CODE'), 'resetPassword')).toMatch(
      /resetlink is ongeldig of verlopen/,
    )
    expect(
      getAuthErrorMessage(
        coded('TOO_MANY_REQUESTS', 'Opnieuw proberen in 1 minute.'),
        'resendCode',
      ),
    ).toBe('Opnieuw proberen in 1 minute.')
  })

  it('recognises the auth library’s raw messages, whatever their case', () => {
    // The library throws "InvalidSecret" for a wrong password; the old check
    // looked for a lower-case 'invalid credentials' and never matched.
    expect(getAuthErrorMessage(devError('InvalidSecret'), 'signIn')).toBe(
      'Ongeldig e-mailadres of wachtwoord.',
    )
    expect(getAuthErrorMessage(devError('Invalid credentials'), 'signIn')).toBe(
      'Ongeldig e-mailadres of wachtwoord.',
    )
    expect(getAuthErrorMessage(devError('InvalidAccountId'), 'signIn')).toBe(
      'Ongeldig e-mailadres of wachtwoord.',
    )
    expect(getAuthErrorMessage(devError('Invalid password'), 'signUp')).toMatch(
      /minstens 8 tekens/,
    )
    expect(
      getAuthErrorMessage(devError('Could not verify code'), 'verifyEmail'),
    ).toMatch(/ongeldig of verlopen/)
  })

  it('falls back to wording for the form when production hides the message', () => {
    const hidden = new Error(
      '[CONVEX A(auth:signIn)] [Request ID: 123] Server Error',
    )
    expect(getAuthErrorMessage(hidden, 'signUp')).toBe(
      'Je account kon niet aangemaakt worden. Probeer opnieuw.',
    )
  })
})

describe('resendCodeNotice', () => {
  it('doesn’t announce a new code when the last one was kept', () => {
    // Past the hourly limit no code is sent while the last one works.
    expect(resendCodeNotice('jane@x.test', 'reused')).toBe(
      'Je vorige code is nog geldig — kijk in je inbox (en spam).',
    )
    expect(resendCodeNotice('jane@x.test', 'sent')).toBe(
      'We stuurden een nieuwe code naar jane@x.test. Die is 15 minuten geldig.',
    )
    // A backend from before the status answers nothing, and had sent one.
    expect(resendCodeNotice('jane@x.test', undefined)).toMatch(
      /^We stuurden een nieuwe code/,
    )
  })
})

describe('trimEmail', () => {
  it('trims, and leaves the case as typed for the backend to match', () => {
    // Lower-casing here made an account stored with capitals unreachable.
    expect(trimEmail('  Jane.Doe@Example.COM ')).toBe('Jane.Doe@Example.COM')
  })
})

describe('isEmailInUseError', () => {
  it('recognises the coded error and the library’s raw one', () => {
    expect(
      isEmailInUseError(
        new ConvexError({ code: 'EMAIL_IN_USE', message: 'Taken.' }),
      ),
    ).toBe(true)
    expect(isEmailInUseError(devError('Account a@x.test already exists'))).toBe(
      true,
    )
    expect(
      isEmailInUseError(
        new ConvexError({
          code: 'INVALID_PASSWORD',
          message: 'already exists',
        }),
      ),
    ).toBe(false)
    expect(isEmailInUseError(devError('InvalidSecret'))).toBe(false)
  })
})
