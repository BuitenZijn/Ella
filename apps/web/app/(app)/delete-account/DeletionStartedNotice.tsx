'use client'

import { useSearchParams } from 'next/navigation'
import { brandColors } from '@ella/ui/colors'
import { SUPPORT_EMAIL } from '@ella/shared'

/**
 * Shown after deleting an account from the web app (`?deleted=1`). Read on
 * the client so the rest of the page stays static.
 */
export function DeletionStartedNotice() {
  const searchParams = useSearchParams()
  if (searchParams.get('deleted') !== '1') return null

  return (
    <div
      style={{
        border: `1px solid ${brandColors.primary}`,
        borderRadius: 8,
        padding: '16px 20px',
        marginBottom: 32,
      }}
    >
      <strong>Je account wordt verwijderd.</strong> Je bent op al je toestellen
      afgemeld en je e-mailadres is vrijgegeven, zodat je er meteen opnieuw mee
      kan registreren; de rest van je gegevens is binnen enkele minuten weg.
      Klopt er iets niet? Mail naar <strong>{SUPPORT_EMAIL}</strong>.
    </div>
  )
}
