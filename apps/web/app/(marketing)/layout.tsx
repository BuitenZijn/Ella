import { UiProviders } from '@/components/providers/UiProviders'
import { MarketingNavbar } from '@/components/layout/MarketingNavbar'
import { MarketingFooter } from '@/components/layout/MarketingFooter'

// The whole point of this group: no cookie access anywhere in the tree, so
// these pages are statically generated at build time and served from the
// CDN edge instead of being server-rendered per request.
export const dynamic = 'force-static'

export default function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <UiProviders>
      <MarketingNavbar />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {children}
      </main>
      <MarketingFooter />
    </UiProviders>
  )
}
