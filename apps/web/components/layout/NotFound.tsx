'use client'

import { Compass } from 'lucide-react'
import { ButtonLink } from '@/components/common/ButtonLink'
import { StatusPage } from './StatusPage'

/** The 404 page body. */
export function NotFound() {
  return (
    <StatusPage
      icon={Compass}
      title='Pagina niet gevonden'
      message='Deze pagina bestaat niet of is verhuisd. Controleer het adres, of ga terug naar de startpagina.'
    >
      <ButtonLink href='/'>Startpagina</ButtonLink>
    </StatusPage>
  )
}
