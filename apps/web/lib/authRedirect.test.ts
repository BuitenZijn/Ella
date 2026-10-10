import { describe, expect, it } from 'vitest'
import {
  DEFAULT_APP_RETURN_PATH,
  getAuthPageHref,
  getSafeAppReturnPath,
  getSignInHref,
  isProtectedPath,
} from './authRedirect'

describe('isProtectedPath', () => {
  it('covers the signed-in sections and everything under them', () => {
    expect(isProtectedPath('/admin')).toBe(true)
    expect(isProtectedPath('/admin/users')).toBe(true)
    expect(isProtectedPath('/user')).toBe(true)
  })

  it('protects pages that are not on the public list, new ones included', () => {
    expect(isProtectedPath('/some-new-page')).toBe(true)
    expect(isProtectedPath('/users')).toBe(true)
    // Look-alikes of public pages are not public.
    expect(isProtectedPath('/sign-in-now')).toBe(true)
    expect(isProtectedPath('/privacy/extra')).toBe(true)
  })

  it('leaves the public pages alone', () => {
    for (const path of [
      '/',
      '/privacy',
      '/delete-account',
      '/sign-in',
      '/sign-up',
      '/sign-out',
      '/reset-password',
      '/verify-email',
      '/sign-in/',
    ]) {
      expect(isProtectedPath(path), path).toBe(false)
    }
  })
})

describe('getSafeAppReturnPath', () => {
  it('keeps local app paths, queries, and fragments', () => {
    expect(getSafeAppReturnPath('/quests/create?source=home#details')).toBe(
      '/quests/create?source=home#details',
    )
  })

  it('falls back for missing and external destinations', () => {
    expect(getSafeAppReturnPath(null)).toBe(DEFAULT_APP_RETURN_PATH)
    expect(getSafeAppReturnPath('https://example.com')).toBe(
      DEFAULT_APP_RETURN_PATH,
    )
    expect(getSafeAppReturnPath('//example.com')).toBe(DEFAULT_APP_RETURN_PATH)
  })
})

describe('getSignInHref', () => {
  it('encodes the intended destination', () => {
    expect(getSignInHref('/quests/create')).toBe(
      '/sign-in?returnTo=%2Fquests%2Fcreate',
    )
  })
})

describe('getAuthPageHref', () => {
  it('carries an invite through sign-up and verification', () => {
    expect(getAuthPageHref('/sign-up', '/invite/abc')).toBe(
      '/sign-up?returnTo=%2Finvite%2Fabc',
    )
    expect(
      getAuthPageHref('/verify-email', '/invite/abc', { email: 'a@b.test' }),
    ).toBe('/verify-email?email=a%40b.test&returnTo=%2Finvite%2Fabc')
  })

  it('leaves out the default destination and unsafe ones', () => {
    expect(getAuthPageHref('/sign-up', DEFAULT_APP_RETURN_PATH)).toBe(
      '/sign-up',
    )
    expect(getAuthPageHref('/sign-up', 'https://evil.test')).toBe('/sign-up')
  })
})
