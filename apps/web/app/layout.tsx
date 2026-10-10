import type { Metadata } from 'next'
import { HtmlShell, baseMetadata } from '@/components/layout/HtmlShell'

export const metadata: Metadata = baseMetadata

/**
 * One root layout for every route keeps marketing-to-app navigation inside the
 * Next.js client. Route-group layouts add their own providers without forcing
 * the browser to reload the document and bootstrap the application again.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <HtmlShell>{children}</HtmlShell>
}
