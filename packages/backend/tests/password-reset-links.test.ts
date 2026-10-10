/**
 * Password-reset emails for app requests must link to the website: the
 * `ella://` scheme only works where the app is installed (it isn't in the
 * stores yet) and many mail clients won't open it at all.
 */
import { describe, expect, it, vi } from 'vitest'
import { ResendOTPPasswordReset } from '../convex/ResendOTPPasswordReset'
import {
  escapeHtml,
  DEFAULT_SITE_URL,
  passwordResetLinks,
} from '../convex/lib/passwordResetLinks'

const { sent } = vi.hoisted(() => ({
  sent: [] as { html: string; text: string }[],
}))
vi.mock('resend', () => ({
  Resend: class {
    emails = {
      send: async (payload: { html: string; text: string }) => {
        sent.push(payload)
        return { error: null }
      },
    }
  },
}))

const token = 'AbC123xyz'
const email = 'player+test@example.com'
const appUrl = `ella://reset-password?email=${encodeURIComponent(email)}&code=${token}`

describe('passwordResetLinks', () => {
  it('points app requests at the website with the same email and code', () => {
    const links = passwordResetLinks({
      url: appUrl,
      token,
      email,
      siteUrl: 'http://localhost:3000',
    })
    const web = new URL(links.primary)
    expect(web.origin).toBe('http://localhost:3000')
    expect(web.pathname).toBe('/reset-password')
    expect(web.searchParams.get('email')).toBe(email)
    expect(web.searchParams.get('code')).toBe(token)
    expect(web.searchParams.get('from')).toBe('app')
    expect(links.app).toBe(appUrl)
  })

  it('falls back to DEFAULT_SITE_URL when SITE_URL is unset', () => {
    const links = passwordResetLinks({ url: appUrl, token, email })
    expect(
      links.primary.startsWith(`${DEFAULT_SITE_URL}/reset-password?`),
    ).toBe(true)
  })

  it('ignores a trailing slash on SITE_URL', () => {
    const links = passwordResetLinks({
      url: appUrl,
      token,
      email,
      siteUrl: 'http://localhost:3000/',
    })
    expect(
      links.primary.startsWith('http://localhost:3000/reset-password?'),
    ).toBe(true)
  })

  it('leaves website requests untouched', () => {
    const url = `https://buitenzijnvzw.be/reset-password?email=${encodeURIComponent(email)}&code=${token}`
    expect(passwordResetLinks({ url, token, email })).toEqual({ primary: url })
  })
})

describe('escapeHtml', () => {
  it('makes a link safe inside an href attribute', () => {
    expect(escapeHtml('https://x.test/?a=1&b="2"<')).toBe(
      'https://x.test/?a=1&amp;b=&quot;2&quot;&lt;',
    )
  })
})

describe('password reset email', () => {
  async function send(url: string) {
    sent.length = 0
    await ResendOTPPasswordReset.sendVerificationRequest!({
      identifier: email,
      provider: { apiKey: 'test' },
      url,
      token,
      expires: new Date(),
    } as never)
    return sent[0]
  }

  it('makes the button open the website for app requests', async () => {
    const { html, text } = await send(appUrl)
    const buttonHref = html
      .match(/<a href="([^"]+)"/)![1]
      .replace(/&amp;/g, '&')
    const web = new URL(buttonHref)
    expect(web.pathname).toBe('/reset-password')
    expect(web.searchParams.get('code')).toBe(token)
    expect(web.searchParams.get('email')).toBe(email)
    // The app link is still offered, but only as the secondary option.
    expect(html).toContain('href="ella://reset-password')
    expect(text.indexOf(buttonHref)).toBeLessThan(text.indexOf(appUrl))
  })

  it('keeps website requests on their own link', async () => {
    const url = `https://buitenzijnvzw.be/reset-password?email=${encodeURIComponent(email)}&code=${token}`
    const { html, text } = await send(url)
    expect(html).not.toContain('ella://')
    expect(text).toContain(url)
  })
})
