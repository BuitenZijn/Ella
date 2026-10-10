'use client'

import { ConvexAuthProvider } from './ConvexAuthProvider'
import { UiProviders } from './UiProviders'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ConvexAuthProvider>
      <UiProviders>{children}</UiProviders>
    </ConvexAuthProvider>
  )
}
