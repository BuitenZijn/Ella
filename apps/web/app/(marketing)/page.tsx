import type { Metadata } from 'next'
import { LandingPage } from './LandingPage'

export const metadata: Metadata = {
  title: 'Ella — leren door te spelen',
  description:
    'Ella is een leerapp voor kinderen: knutselen, rekenspelletjes, een dinoquiz, memory en planetenpuzzels.',
  alternates: { canonical: '/' },
}

export default function Home() {
  return <LandingPage />
}
