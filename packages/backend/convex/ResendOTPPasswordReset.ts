/**
 * Resend Email Provider for Password Reset
 *
 * Sends a password reset link to reset user passwords.
 * Uses Resend for email delivery.
 *
 * Based on: https://labs.convex.dev/auth/config/passwords#email-reset-setup
 * Example: https://github.com/get-convex/convex-auth-example/blob/main/convex/passwordReset/ResendOTPPasswordReset.ts
 */

import { Email } from '@convex-dev/auth/providers/Email'
import { Resend as ResendAPI } from 'resend'

import { escapeHtml, passwordResetLinks } from './lib/passwordResetLinks'
import { generateRandomString } from './lib/random'

/**
 * ResendOTPPasswordReset provider for password reset flow.
 * Generates a secure token and sends a reset link via Resend.
 */
export const ResendOTPPasswordReset = Email({
  id: 'resend-otp-password-reset',
  apiKey: process.env.AUTH_RESEND_KEY,
  // Token valid for 1 hour (password reset should be quick)
  maxAge: 60 * 60,

  async generateVerificationToken() {
    // Generate a secure 32-character token for the link (alphanumeric)
    return generateRandomString(
      32,
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
    )
  },

  async sendVerificationRequest({ identifier: email, provider, url, token }) {
    const resend = new ResendAPI(provider.apiKey)
    // App requests get a website link to press, with the app link as extra.
    const links = passwordResetLinks({
      url,
      token,
      email,
      siteUrl: process.env.SITE_URL,
    })
    const href = escapeHtml(links.primary)
    const appLinkHtml = links.app
      ? `
          <p style="color: #6a6a6a; font-size: 14px; line-height: 1.5; margin-bottom: 16px;">
            Heb je de Ella-app op deze telefoon? <a href="${escapeHtml(links.app)}" style="color: #3A9A37;">Open de reset dan in de app</a>.
          </p>`
      : ''
    const appLinkText = links.app
      ? `\n\nHeb je de Ella-app op deze telefoon? Open de reset dan in de app:\n${links.app}`
      : ''

    const { error } = await resend.emails.send({
      from: process.env.EMAIL_FROM ?? 'Ella <noreply@buitenzijnvzw.be>',
      to: [email],
      subject: 'Stel je Ella-wachtwoord opnieuw in',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #4EB54A; font-size: 28px; margin: 0;">Ella</h1>
          </div>

          <h2 style="color: #1a1a1a; font-size: 24px; margin-bottom: 16px;">Nieuw wachtwoord instellen</h2>

          <p style="color: #4a4a4a; font-size: 16px; line-height: 1.5; margin-bottom: 24px;">
            We kregen een vraag om je Ella-wachtwoord opnieuw in te stellen. Klik op de knop hieronder om een nieuw wachtwoord te kiezen:
          </p>

          <div style="text-align: center; margin-bottom: 24px;">
            <a href="${href}" style="display: inline-block; background: #4EB54A; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 700; font-size: 16px;">
              Nieuw wachtwoord instellen
            </a>
          </div>

          <p style="color: #6a6a6a; font-size: 14px; line-height: 1.5; margin-bottom: 16px;">
            Of kopieer deze link naar je browser:
          </p>
          <p style="color: #4a4a4a; font-size: 12px; word-break: break-all; background: #f5f5f5; padding: 12px; border-radius: 4px;">
            ${href}
          </p>
          ${appLinkHtml}

          <p style="color: #6a6a6a; font-size: 14px; line-height: 1.5; margin-top: 24px;">
            Deze link verloopt na 1 uur. Heb je dit niet zelf gevraagd? Dan mag je deze e-mail negeren; je wachtwoord blijft ongewijzigd.
          </p>

          <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 32px 0;" />

          <p style="color: #9a9a9a; font-size: 12px; text-align: center;">
            © ${new Date().getFullYear()} Ella
          </p>
        </div>
      `,
      text: `Stel je Ella-wachtwoord opnieuw in\n\nOpen de link hieronder om een nieuw wachtwoord te kiezen:\n\n${links.primary}${appLinkText}\n\nDeze link verloopt na 1 uur. Heb je dit niet zelf gevraagd? Dan mag je deze e-mail negeren; je wachtwoord blijft ongewijzigd.`,
    })

    if (error) {
      console.error('Failed to send password reset email:', error)
      throw new Error('Could not send password reset email')
    }
  },
})
