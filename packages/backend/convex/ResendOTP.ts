/**
 * Resend Email Provider for Email Verification
 *
 * Sends a 6-digit verification code to verify email addresses during sign-up.
 * Uses Resend for email delivery.
 *
 * Based on: https://labs.convex.dev/auth/config/passwords#email-verification-setup
 */

import { Email } from '@convex-dev/auth/providers/Email'
import { Resend as ResendAPI } from 'resend'

import { generateRandomString } from './lib/random'

/**
 * ResendOTP provider for email verification during sign-up.
 * Generates a 6-digit numeric code and sends it via Resend.
 */
export const ResendOTP = Email({
  id: 'resend-otp',
  apiKey: process.env.AUTH_RESEND_KEY,
  // Token valid for 15 minutes (short-lived code)
  maxAge: 60 * 15,

  async generateVerificationToken() {
    return generateRandomString(6, '0123456789')
  },

  async sendVerificationRequest({ identifier: email, provider, token }) {
    const resend = new ResendAPI(provider.apiKey)

    const { error } = await resend.emails.send({
      from: process.env.EMAIL_FROM ?? 'Ella <noreply@buitenzijnvzw.be>',
      to: [email],
      subject: `${token} is je Ella verificatiecode`,
      html: `
        <div style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
          Je verificatiecode is ${token}
        </div>
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #4EB54A; font-size: 28px; margin: 0;">Ella</h1>
          </div>

          <h2 style="color: #1a1a1a; font-size: 24px; margin-bottom: 16px;">Je verificatiecode</h2>

          <p style="color: #4a4a4a; font-size: 16px; line-height: 1.5; margin-bottom: 24px;">
            Vul deze code in om je e-mailadres te bevestigen:
          </p>

          <div style="text-align: center; margin-bottom: 32px;">
            <span style="display: inline-block; background: #f5f5f5; border: 2px solid #4EB54A; border-radius: 12px; padding: 16px 40px; font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #1a1a1a; font-family: monospace;">
              ${token}
            </span>
          </div>

          <p style="color: #6a6a6a; font-size: 14px; line-height: 1.5; margin-top: 24px;">
            Deze code verloopt na 15 minuten. Heb je geen account aangemaakt bij Ella? Dan mag je deze e-mail negeren.
          </p>

          <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 32px 0;" />

          <p style="color: #9a9a9a; font-size: 12px; text-align: center;">
            &copy; ${new Date().getFullYear()} Ella
          </p>
        </div>
      `,
      text: `Je Ella verificatiecode is: ${token}\n\nVul deze code in om je e-mailadres te bevestigen.\n\nDeze code verloopt na 15 minuten. Heb je geen account aangemaakt bij Ella? Dan mag je deze e-mail negeren.`,
    })

    if (error) {
      console.error('Failed to send verification email:', error)
      throw new Error('Could not send verification email')
    }
  },
})
