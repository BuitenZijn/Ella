import type { Metadata } from 'next'
import { SUPPORT_EMAIL } from '@ella/shared'
import { neutralColors, brandColors } from '@ella/ui/colors'

export const metadata: Metadata = {
  title: 'Privacybeleid — Ella',
  description: 'Hoe Ella omgaat met de gegevens van ouders en kinderen.',
  alternates: { canonical: '/privacy' },
}

// DRAFT: written for the first test version with our own children. Have it
// reviewed before Ella is offered to other parents or schools.
export default function PrivacyPolicyPage() {
  return (
    // The (marketing) layout already renders the page's <main>
    <article
      style={{
        width: '100%',
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
        Privacybeleid
      </h1>
      <p style={{ color: neutralColors.text.muted, marginBottom: 32 }}>
        <strong>Ella</strong> — Ontwerpversie, laatste update: 10 oktober 2026
      </p>

      <Section title='1. Voor wie is Ella?'>
        <p>
          Ella is een leerapp voor kinderen. Een account maakt altijd een ouder
          of voogd aan; kinderen krijgen geen eigen account, e-mailadres of
          wachtwoord. Vragen? Mail naar{' '}
          <a href={`mailto:${SUPPORT_EMAIL}`} style={linkStyle}>
            {SUPPORT_EMAIL}
          </a>
          .
        </p>
      </Section>

      <Section title='2. Welke gegevens bewaren we?'>
        <ul style={ulStyle}>
          <li>
            <strong>Van de ouder:</strong> voornaam, achternaam, e-mailadres en
            wachtwoord (alleen als cryptografische hash, nooit leesbaar).
          </li>
          <li>
            <strong>Van het kind:</strong> alleen wat nodig is om te spelen: een
            voornaam of bijnaam, een figuurtje (emoji), en de scores in de
            spelletjes. Geen foto&rsquo;s, geen locatie, geen contactgegevens.
            Ouders zien alleen de scores van hun eigen kinderen.
          </li>
          <li>
            <strong>Technisch:</strong> sessiegegevens om je aangemeld te
            houden.
          </li>
        </ul>
      </Section>

      <Section title='3. Wat doen we er níet mee?'>
        <ul style={ulStyle}>
          <li>Geen reclame, geen tracking, geen analysediensten van derden.</li>
          <li>We verkopen of delen geen gegevens.</li>
          <li>
            Kinderen kunnen in Ella niet met anderen praten of iets delen.
          </li>
        </ul>
      </Section>

      <Section title='4. Wie verwerkt de gegevens voor ons?'>
        <ul style={ulStyle}>
          <li>
            <strong>Convex</strong> — database en opslag.
          </li>
          <li>
            <strong>Resend</strong> — e-mails om je e-mailadres te bevestigen en
            je wachtwoord opnieuw in te stellen.
          </li>
        </ul>
        <p>
          Ella laadt zelf niets van YouTube. Een knutselfilmpje openen gaat naar
          de YouTube-app of -website, waar de regels van YouTube gelden. Laat
          jonge kinderen dat best samen met een volwassene doen.
        </p>
      </Section>

      <Section title='5. Bewaren en verwijderen'>
        <p>
          We bewaren de gegevens zolang het account bestaat. Verwijder je het
          account, dan wissen we alle gegevens van de ouder en de kinderen
          binnen enkele minuten. Je kan ook altijd mailen om je gegevens in te
          kijken, te laten verbeteren of te laten wissen; we antwoorden binnen
          30 dagen. Een klacht kan bij de{' '}
          <a
            href='https://www.gegevensbeschermingsautoriteit.be'
            target='_blank'
            rel='noopener noreferrer'
            style={linkStyle}
          >
            Gegevensbeschermingsautoriteit
          </a>
          .
        </p>
      </Section>
    </article>
  )
}

const linkStyle: React.CSSProperties = {
  color: brandColors.primaryText,
  textDecoration: 'underline',
}

const ulStyle: React.CSSProperties = {
  paddingLeft: 24,
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
}

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
