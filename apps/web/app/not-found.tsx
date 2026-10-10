import { UiProviders } from '@/components/providers/UiProviders'
import { MarketingNavbar } from '@/components/layout/MarketingNavbar'
import { MarketingFooter } from '@/components/layout/MarketingFooter'
import { NotFound } from '@/components/layout/NotFound'

/**
 * 404 for URLs no route matches. It renders in the root layout, outside both
 * route groups, so it brings the marketing chrome (no Convex client).
 */
export default function RootNotFound() {
  return (
    <UiProviders>
      <MarketingNavbar />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <NotFound />
      </main>
      <MarketingFooter />
    </UiProviders>
  )
}
