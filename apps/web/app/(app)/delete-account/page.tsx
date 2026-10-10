import type { Metadata } from 'next'
import { Suspense } from 'react'
import { neutralColors, brandColors } from '@ella/ui/colors'
import { DeletionStartedNotice } from './DeletionStartedNotice'
import { SUPPORT_EMAIL } from '@ella/shared'

export const metadata: Metadata = {
  title: 'Account verwijderen — Ella',
  description:
    'Verwijder je Ella-account en alle gegevens die erbij horen, met of zonder de app.',
}

export default function DeleteAccountPage() {
  // An article, not a <main>: the app layout already renders the <main>.
  return (
    <article
      style={{
        maxWidth: 800,
        margin: '0 auto',
        padding: '48px 24px',
        color: neutralColors.text.primary,
        lineHeight: 1.7,
        fontFamily: 'var(--font-body)',
      }}
    >
      <h1
        style={{
          fontSize: 32,
          fontWeight: 700,
          fontFamily: 'var(--font-heading)',
          marginBottom: 4,
        }}
      >
        Account verwijderen
      </h1>
      <p style={{ color: neutralColors.text.muted, marginBottom: 32 }}>
        <strong>Ella</strong> — Account en gegevens verwijderen
      </p>

      <Suspense fallback={null}>
        <DeletionStartedNotice />
      </Suspense>

      <Section title='Hoe verwijder je je account?'>
        <p>Je kan je Ella-account op elk van deze manieren verwijderen:</p>
        <ul style={ulStyle}>
          <li>
            <strong>Op deze website:</strong>{' '}
            <a href='/user' style={linkStyle}>
              meld je aan en open Mijn account
            </a>{' '}
            en kies <strong>Account verwijderen</strong>. Je hebt de app
            daarvoor niet nodig.
          </li>
          <li>
            <strong>In de app:</strong> open{' '}
            <strong>
              Instellingen → Account &amp; privacy → Account verwijderen
            </strong>
            .
          </li>
          <li>
            <strong>Per e-mail:</strong> kan je niet meer aanmelden? Mail dan
            naar <strong>{SUPPORT_EMAIL}</strong> vanaf het e-mailadres van je
            account, en we verwijderen het binnen 30 dagen voor je.
          </li>
        </ul>
      </Section>

      <Section title='Wat wordt er verwijderd?'>
        <p>
          Je wordt meteen op al je toestellen afgemeld, en je e-mailadres en
          wachtwoord worden meteen gewist, zodat je met hetzelfde adres opnieuw
          kan registreren. De rest van je gegevens wordt op de achtergrond
          verwijderd, meestal binnen enkele minuten:
        </p>
        <ul style={ulStyle}>
          <li>Je profiel: naam, e-mailadres, foto en telefoonnummer</li>
          <li>De profielen van je kinderen, met hun scores en voortgang</li>
          <li>Alle bestanden die je hebt opgeladen</li>
        </ul>
      </Section>

      <Section title='Wat blijft er bewaard?'>
        <p>
          Niets dat jou identificeert, behalve gegevens die we wettelijk moeten
          bewaren, en logboeken van de diensten die we gebruiken, zoals het
          verzenden van e-mails, zolang die diensten ze bewaren.
        </p>
        <p>
          Meer details vind je in ons{' '}
          <a href='/privacy' style={linkStyle}>
            privacybeleid
          </a>
          .
        </p>
      </Section>
    </article>
  )
}

/* ── Shared styles ── */

const ulStyle: React.CSSProperties = {
  paddingLeft: 24,
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
}

const linkStyle: React.CSSProperties = {
  color: brandColors.primaryText,
  textDecoration: 'underline',
}

/* ── Helper components ── */

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section style={{ marginBottom: 40 }}>
      <h2
        style={{
          fontSize: 22,
          fontWeight: 700,
          fontFamily: 'var(--font-heading)',
          color: brandColors.primaryText,
          marginBottom: 12,
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  )
}
