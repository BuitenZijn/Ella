import { styled, Card as TamaguiCard, GetProps } from 'tamagui'
import { neutralColors } from './colors'

/**
 * FormCard - Elevated card for forms (auth, settings, etc.)
 * Uses Digital Compass design system colors with shadow elevation.
 */
export const FormCard = styled(TamaguiCard, {
  name: 'FormCard',
  padding: '$6',
  backgroundColor: neutralColors.background.elevated,
  borderRadius: 12,
  borderWidth: 1,
  borderColor: neutralColors.border.default,
  elevation: 4,
  shadowColor: '#000',
  shadowRadius: 20,
  shadowOpacity: 0.3,

  variants: {
    size: {
      $4: {
        padding: '$4',
        borderRadius: 10,
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
  } as const,

  defaultVariants: {
    size: '$6',
  },
})

export type FormCardProps = GetProps<typeof FormCard>
