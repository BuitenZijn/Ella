/**
 * Links for the password-reset email.
 *
 * The mobile app requests `ella://reset-password?...` links, but most mail
 * clients won't open a custom scheme and phones without the app can't either
 * (it isn't in the stores yet). The pressable link therefore always goes to
 * the website's /reset-password page, which accepts the same email + code and
 * completes the reset. The app link stays available as a secondary option.
 */

// Until Ella has a domain; set SITE_URL on the deployment.
export const DEFAULT_SITE_URL = 'http://localhost:3000'

export interface PasswordResetLinks {
  /** The link the button and copy-paste text use: always http(s). */
  primary: string
  /** Deep link into the app, when the reset was requested from the app. */
  app?: string
}

export function passwordResetLinks({
  url,
  token,
  email,
  siteUrl,
}: {
  /** The URL @convex-dev/auth built from `redirectTo` plus `code`. */
  url: string
  token: string
  email: string
  siteUrl?: string
}): PasswordResetLinks {
  if (!url.startsWith('ella:')) return { primary: url }

  const site = (siteUrl || DEFAULT_SITE_URL).replace(/\/$/, '')
  const web = new URL(`${site}/reset-password`)
  web.searchParams.set('email', email)
  web.searchParams.set('code', token)
  // Tells the page to point the user back to the app when done.
  web.searchParams.set('from', 'app')
  return { primary: web.toString(), app: url }
}

/** Escape a value for use inside HTML text or a double-quoted attribute. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
