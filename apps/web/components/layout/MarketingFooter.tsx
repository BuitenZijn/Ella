import Link from 'next/link'
import { brandColors, neutralColors } from '@ella/ui/colors'

const LEGAL_LINKS = [{ href: '/privacy', label: 'Privacybeleid' }]

const CSS = `
.xp-footer-link {
  color: ${neutralColors.text.secondary};
  font-size: 14px;
  text-decoration: none;
}
.xp-footer-link:hover { color: ${neutralColors.text.primary}; }
.xp-footer-link:focus-visible {
  outline: 2px solid ${brandColors.primary};
  outline-offset: 2px;
  border-radius: 2px;
}
`

/**
 * Footer of the public pages: contact and privacy have to be reachable
 * without an account (app stores and GDPR both ask for it).
 */
export function MarketingFooter() {
  return (
    <footer
      style={{
        position: 'relative',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px 24px',
        padding: '24px',
        borderTop: `1px solid ${neutralColors.border.default}`,
        backgroundColor: neutralColors.background.elevated,
      }}
    >
      <style href='xp-footer' precedence='default'>
        {CSS}
      </style>
      <p style={{ margin: 0, fontSize: 14, color: neutralColors.text.muted }}>
        © {new Date().getFullYear()} Ella
      </p>
      <nav aria-label='Juridisch'>
        <ul
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px 24px',
            margin: 0,
            padding: 0,
            listStyle: 'none',
          }}
        >
          {LEGAL_LINKS.map(link => (
            <li key={link.href}>
              <Link href={link.href} className='xp-footer-link'>
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </footer>
  )
}
