'use client'

import { TamaguiProvider, ToastProvider, Toaster } from '@ella/ui'
import config from '@ella/ui/tamagui.config'
import { NavbarProvider } from '../layout/NavbarContext'

/**
 * Everything except Convex auth: Tamagui, toasts, navbar context.
 * The `(marketing)` layout imports this file directly so the landing and
 * legal pages don't download the Convex client at all; the `(app)` layout
 * uses `Providers`, which adds Convex auth on top.
 *
 * The app is dark-only (HtmlShell sets `t_dark` on <html>). It used to read a
 * theme from localStorage, which crashed when storage was blocked and gave a
 * stored 'light' a hydration mismatch, long after the toggle was removed.
 */
export function UiProviders({ children }: { children: React.ReactNode }) {
  return (
    <TamaguiProvider config={config} defaultTheme='light'>
      <ToastProvider>
        <NavbarProvider>
          {children}
          <Toaster />
        </NavbarProvider>
      </ToastProvider>
    </TamaguiProvider>
  )
}
