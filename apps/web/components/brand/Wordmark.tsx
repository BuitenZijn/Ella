import { brandColors } from '@ella/ui/colors'

/** Ella's name as a logo, until there is a real one. */
export function Wordmark() {
  return (
    <span
      style={{
        fontFamily: 'var(--font-heading)',
        fontWeight: 800,
        fontSize: 28,
        letterSpacing: -0.5,
        color: brandColors.primary,
      }}
    >
      Ella
    </span>
  )
}
