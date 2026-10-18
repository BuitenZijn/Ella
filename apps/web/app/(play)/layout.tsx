import type { Metadata } from 'next'
import { Providers } from '@/components/providers/providers'

export const metadata: Metadata = {
  title: 'Codenames',
  robots: { index: false },
}

/**
 * Players' phones: no navbar and no sign-in, the whole screen is the game
 * (and the team's colour). Convex is there for the game; players have no
 * account, they act with the token they got when joining.
 */
export default function PlayLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <Providers>
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {children}
      </main>
    </Providers>
  )
}
