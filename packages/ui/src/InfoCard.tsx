import { styled, GetProps, YStack, Paragraph } from 'tamagui'
import { semanticColors, neutralColors } from './colors'

/**
 * InfoCard - A card for displaying contextual information or alerts
 *
 * Use this component for both informational cards and alert messages.
 * For simple inline alerts, use size="$3" for compact styling.
 *
 * Variants: default, success, error, warning, info
 *
 * @example
 * // Full info card with title
 * <InfoCard variant="success">
 *   <InfoCardTitle variant="success">Success!</InfoCardTitle>
 *   <InfoCardText variant="success">Your quest was saved.</InfoCardText>
 * </InfoCard>
 *
 * // Compact alert (replaces AlertCard)
 * <InfoCard variant="error" size="$3">
 *   <InfoCardText variant="error">Error message here</InfoCardText>
 * </InfoCard>
 */
export const InfoCard = styled(YStack, {
  name: 'InfoCard',
  padding: '$5',
  borderRadius: 12,
  borderWidth: 1,
  gap: '$3',

  variants: {
    variant: {
      default: {
        backgroundColor: neutralColors.background.elevated,
        borderColor: neutralColors.border.default,
      },
      success: {
        backgroundColor: semanticColors.success.background,
        borderColor: semanticColors.success.border,
      },
      error: {
        backgroundColor: semanticColors.error.background,
        borderColor: semanticColors.error.border,
      },
      warning: {
        backgroundColor: semanticColors.warning.background,
        borderColor: semanticColors.warning.border,
      },
      info: {
        backgroundColor: semanticColors.info.background,
        borderColor: semanticColors.info.border,
      },
    },
    size: {
      $3: {
        padding: '$3',
        gap: '$2',
        borderRadius: 10,
      },
      '$3.5': {
        padding: '$3.5',
        gap: '$2',
        borderRadius: 12,
      },
      $4: {
        padding: '$4',
        gap: '$2',
        borderRadius: 12,
      },
      $5: {
        padding: '$5',
        gap: '$3',
        borderRadius: 12,
      },
    },
  } as const,

  defaultVariants: {
    variant: 'default',
    size: '$4',
  },
})

/**
 * InfoCardTitle - Title text for InfoCard with matching color
 */
export const InfoCardTitle = styled(Paragraph, {
  name: 'InfoCardTitle',
  fontSize: 18,
  fontWeight: '600',

  variants: {
    variant: {
      default: {
        color: '$color12',
      },
      success: {
        color: semanticColors.success.text,
      },
      error: {
        color: semanticColors.error.text,
      },
      warning: {
        color: semanticColors.warning.text,
      },
      info: {
        color: semanticColors.info.text,
      },
    },
  } as const,

  defaultVariants: {
    variant: 'default',
  },
})

/**
 * InfoCardText - Body text for InfoCard with matching color
 */
export const InfoCardText = styled(Paragraph, {
  name: 'InfoCardText',
  fontSize: 14,
  lineHeight: 20,

  variants: {
    variant: {
      default: {
        color: neutralColors.text.secondary,
      },
      success: {
        color: semanticColors.success.text,
      },
      error: {
        color: semanticColors.error.text,
      },
      warning: {
        color: semanticColors.warning.text,
      },
      info: {
        color: semanticColors.info.text,
      },
    },
  } as const,

  defaultVariants: {
    variant: 'default',
  },
})

export type InfoCardProps = GetProps<typeof InfoCard>
export type InfoCardTitleProps = GetProps<typeof InfoCardTitle>
export type InfoCardTextProps = GetProps<typeof InfoCardText>
