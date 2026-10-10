import type { Metadata } from 'next'
import '@tamagui/core/reset.css'
// Import colors directly from source file to avoid Tamagui context in Server Component
import { neutralColors } from '@ella/ui/colors'
import { Inter, Poppins } from 'next/font/google'
import { SITE_URL } from '@/lib/siteUrl'

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
})

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  variable: '--font-poppins',
  display: 'swap',
})

const SITE_TITLE = 'Ella — leren door te spelen'
const SITE_DESCRIPTION =
  'Ella is een leerapp voor kinderen: knutselen, rekenspelletjes, een dinoquiz, memory en planetenpuzzels.'

export const baseMetadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  applicationName: 'Ella',
  openGraph: {
    type: 'website',
    siteName: 'Ella',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: '/',
    locale: 'nl_BE',
  },
  twitter: {
    card: 'summary',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
}

/**
 * The shared <html>/<head>/<body> skeleton used by the single root layout.
 * Route-group layouts add marketing or authenticated-app providers inside
 * this shell, so navigating between those groups remains a client transition.
 */
export function HtmlShell({ children }: { children: React.ReactNode }) {
  return (
    // Light only: there is no dark theme or toggle
    <html
      lang='nl-BE'
      suppressHydrationWarning
      className={`t_light ${inter.variable} ${poppins.variable}`}
    >
      {/* eslint-disable-next-line @next/next/no-head-element -- this IS the
          root layout's <head>; the rule only exempts files under app/ */}
      <head>
        <style
          dangerouslySetInnerHTML={{
            __html: `
              :root {
                --font-heading: var(--font-poppins), -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                --font-body: var(--font-inter), -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                --page-background: ${neutralColors.background.page};
                --card-background: ${neutralColors.background.elevated};
              }
              html, body {
                background-color: ${neutralColors.background.page};
                margin: 0;
                padding: 0;
                font-family: var(--font-body);
              }
              h1, h2, h3, h4, h5, h6 {
                font-family: var(--font-heading);
              }
              @keyframes pulse {
                0%, 100% { opacity: 0.4; }
                50% { opacity: 1; }
              }
            `,
          }}
        />
      </head>
      <body
        style={{
          margin: 0,
          padding: 0,
          position: 'relative',
          zIndex: 1,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {children}
      </body>
    </html>
  )
}
