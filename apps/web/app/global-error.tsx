'use client'

import { useEffect } from 'react'
import { brandColors, neutralColors } from '@ella/ui/colors'

const buttonStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  height: 44,
  padding: '0 18px',
  borderRadius: 10,
  border: `1px solid ${brandColors.primary}`,
  fontSize: 15,
  fontWeight: 600,
  fontFamily: 'inherit',
  textDecoration: 'none',
  cursor: 'pointer',
}

/**
 * Last-resort error page, for errors in the root or (app) layouts themselves
 * (page errors stop at app/(app)/error.tsx). It replaces the root layout, so
 * it renders its own document with inline styles and no providers.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html lang='en'>
      <head>
        <title>Er ging iets mis — Ella</title>
      </head>
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          boxSizing: 'border-box',
          backgroundColor: neutralColors.background.page,
          color: neutralColors.text.primary,
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        }}
      >
        <main style={{ maxWidth: 460, textAlign: 'center' }}>
          <h1 style={{ fontSize: 28, margin: '0 0 12px' }}>Er ging iets mis</h1>
          <p
            style={{
              margin: '0 0 24px',
              lineHeight: 1.6,
              color: neutralColors.text.secondary,
            }}
          >
            Er ging onverwacht iets mis. Probeer opnieuw, of ga terug naar de
            startpagina.
          </p>
          <div
            style={{
              display: 'flex',
              gap: 12,
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <button
              type='button'
              onClick={reset}
              style={{
                ...buttonStyle,
                backgroundColor: brandColors.primary,
                color: neutralColors.text.onFill,
              }}
            >
              Opnieuw proberen
            </button>
            {/* A full page load: the client router may be what broke */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href='/'
              style={{
                ...buttonStyle,
                backgroundColor: 'transparent',
                color: neutralColors.text.primary,
              }}
            >
              Startpagina
            </a>
          </div>
        </main>
      </body>
    </html>
  )
}
