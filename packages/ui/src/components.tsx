import { styled, GetProps, YStack } from 'tamagui'
import { neutralColors, brandColors } from './colors'

/**
 * Card - Primary container component for the Xplorer design system.
 *
 * This is the main card component. Use it for all card-like containers.
 *
 * Variants:
 * - `default`: Elevated background with subtle border
 * - `outlined`: Transparent background with prominent border
 * - `highlight`: Primary brand border for emphasis
 * - `muted`: Hover background color (subdued)
 * - `success`: Green-tinted for success states
 * - `ghost`: No background or border (container only)
 *
 * Size: "$3" | "$4" | "$5" | "$6" (use Tamagui size tokens)
 *
 * Interactive: Set `interactive` to true for clickable cards with hover/press effects
 *
 * @example
 * // Basic card
 * <Card>Content</Card>
 *
 * // Interactive card with size
 * <Card interactive size="$5">Clickable content</Card>
 *
 * // Highlighted card
 * <Card variant="highlight">Important content</Card>
 */
export const Card = styled(YStack, {
  name: 'Card',
  borderRadius: 12,
  padding: '$4',
  backgroundColor: neutralColors.background.elevated,
  borderWidth: 1,
  borderColor: neutralColors.border.default,

  variants: {
    variant: {
      default: {
        backgroundColor: neutralColors.background.elevated,
        borderColor: neutralColors.border.default,
      },
      outlined: {
        backgroundColor: 'transparent',
        borderColor: neutralColors.border.default,
      },
      highlight: {
        backgroundColor: neutralColors.background.elevated,
        borderWidth: 1,
        borderColor: brandColors.primary,
      },
      muted: {
        backgroundColor: neutralColors.background.hover,
        borderColor: neutralColors.border.default,
      },
      success: {
        backgroundColor: brandColors.secondaryLight,
        borderColor: brandColors.secondary,
      },
      ghost: {
        padding: 0,
        backgroundColor: 'transparent',
        borderWidth: 0,
      },
      subtle: {
        backgroundColor: neutralColors.background.elevated,
        borderWidth: 0,
      },
    },
    size: {
      $3: {
        padding: '$3',
        borderRadius: 10,
      },
      $4: {
        padding: '$4',
        borderRadius: 12,
      },
      $5: {
        padding: '$5',
        borderRadius: 12,
      },
      $6: {
        padding: '$6',
        borderRadius: 12,
      },
    },
    interactive: {
      true: {
        cursor: 'pointer',
        hoverStyle: {
          backgroundColor: neutralColors.background.hover,
          borderColor: brandColors.primary,
        },
        pressStyle: {
          scale: 0.99,
          opacity: 0.95,
        },
      },
    },
  } as const,

  defaultVariants: {
    variant: 'default',
    size: '$4',
  },
})

export type CardProps = GetProps<typeof Card>

// Re-export Tamagui components for convenience
export { Button } from 'tamagui'
