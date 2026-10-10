import Link from 'next/link'
import type { ComponentProps } from 'react'
import { brandColors, neutralColors } from '@ella/ui/colors'

type ButtonLinkVariant = 'primary' | 'outline'
type ButtonLinkSize = 'sm' | 'md' | 'lg'

export type ButtonLinkProps = ComponentProps<typeof Link> & {
  variant?: ButtonLinkVariant
  size?: ButtonLinkSize
}

// React hoists and dedupes a <style> with `href` + `precedence`, so this
// ships once however many links a page renders, on the server and client.
const CSS = `
.xp-button-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-sizing: border-box;
  border: 1px solid transparent;
  font-family: var(--font-body);
  font-weight: 600;
  line-height: 1;
  text-decoration: none;
  white-space: nowrap;
  transition: background-color 0.15s ease, border-color 0.15s ease;
}
.xp-button-link:focus-visible {
  outline: 2px solid ${brandColors.primary};
  outline-offset: 2px;
}
.xp-button-link--sm { height: 36px; padding: 0 13px; border-radius: 8px; font-size: 14px; }
.xp-button-link--md { height: 44px; padding: 0 18px; border-radius: 10px; font-size: 15px; }
.xp-button-link--lg { height: 52px; padding: 0 24px; border-radius: 10px; font-size: 17px; }
.xp-button-link--primary {
  background-color: ${brandColors.primary};
  color: ${neutralColors.text.onFill};
}
.xp-button-link--primary:hover { background-color: ${brandColors.primaryHover}; }
.xp-button-link--outline {
  background-color: transparent;
  border-color: ${brandColors.primary};
  color: ${neutralColors.text.primary};
}
.xp-button-link--outline:hover { background-color: ${brandColors.primaryLight}; }
`

/**
 * A link styled like the `@ella/ui` Button. Use it instead of wrapping a
 * Button in a Link, which nests a <button> in an <a>: two tab stops for one
 * action, and ambiguous to screen readers.
 */
export function ButtonLink({
  variant = 'primary',
  size = 'md',
  className,
  ...props
}: ButtonLinkProps) {
  const classes = [
    'xp-button-link',
    `xp-button-link--${variant}`,
    `xp-button-link--${size}`,
    className,
  ]
  return (
    <>
      <style href='xp-button-link' precedence='default'>
        {CSS}
      </style>
      <Link {...props} className={classes.filter(Boolean).join(' ')} />
    </>
  )
}
