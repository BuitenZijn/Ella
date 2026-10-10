import { Providers } from '@/components/providers/providers'
import { Navbar } from '@/components/layout/Navbar'
import { AuthGate } from '@/components/auth/AuthGate'

/**
 * Layout for the web app. Nothing in this tree reads the request, so every
 * page is prerendered and served from the CDN like the marketing pages; the
 * session lives in the browser (see ConvexAuthProvider) and AuthGate keeps
 * signed-out visitors out of the protected sections.
 */
export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <Providers>
      <Navbar />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <AuthGate>{children}</AuthGate>
      </main>
    </Providers>
  )
}
