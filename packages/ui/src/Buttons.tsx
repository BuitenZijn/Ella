import { createContext } from 'react'
import { styled, GetProps, Button as TamaguiButton } from 'tamagui'
import { brandColors, neutralColors } from './colors'
import { DARK_INK_ON_FILL } from './fillInk'

/** Variants whose background is a light brand fill (amber, teal, ember). */
const FILLED_VARIANTS: ReadonlySet<string> = new Set([
  'primary',
  'danger',
  'success',
  'warning',
])

/**
 * True inside a Button with a light brand fill. ButtonText reads it to
 * switch to dark ink: white on those fills is only 2–3:1. Web only; the
 * native app keeps white labels (see fillInk.native.ts).
 */
export const ButtonFillContext = createContext(false)

const ButtonFrame = styled(TamaguiButton, {
  name: 'Button',
  backgroundColor: brandColors.primary,
  borderRadius: 10,
  height: 48,
  pressStyle: {
    opacity: 0.9,
    scale: 0.98,
  },
  hoverStyle: {
    backgroundColor: brandColors.primaryHover,
  },
  disabledStyle: {
    opacity: 0.35,
    cursor: 'not-allowed',
  },

  variants: {
    size: {
      $2: {
        height: 28,
        paddingHorizontal: '$2',
        borderRadius: 8,
      },
      $3: {
        height: 36,
        paddingHorizontal: '$3',
        borderRadius: 8,
      },
      $4: {
        height: 44,
        paddingHorizontal: '$4',
        borderRadius: 10,
      },
      $5: {
        height: 52,
        paddingHorizontal: '$5',
        borderRadius: 10,
      },
    },
    variant: {
      primary: {
        backgroundColor: brandColors.primary,
        hoverStyle: { backgroundColor: brandColors.primaryHover },
        pressStyle: { opacity: 0.9, scale: 0.98 },
      },
      secondary: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: brandColors.primary,
        hoverStyle: { backgroundColor: brandColors.primaryLight },
        pressStyle: { opacity: 0.9, scale: 0.98 },
      },
      danger: {
        backgroundColor: brandColors.destructive,
        hoverStyle: { backgroundColor: brandColors.destructiveHover },
        pressStyle: { opacity: 0.9, scale: 0.98 },
      },
      success: {
        backgroundColor: brandColors.secondary,
        hoverStyle: { backgroundColor: brandColors.secondaryHover },
        pressStyle: { opacity: 0.9, scale: 0.98 },
      },
      warning: {
        backgroundColor: brandColors.primary,
        hoverStyle: { backgroundColor: brandColors.primaryHover },
        pressStyle: { opacity: 0.9, scale: 0.98 },
      },
      ghost: {
        backgroundColor: neutralColors.background.hover,
        hoverStyle: { backgroundColor: neutralColors.background.elevated },
        pressStyle: { opacity: 0.9, scale: 0.98 },
      },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: brandColors.primary,
        hoverStyle: { backgroundColor: brandColors.primaryLight },
        pressStyle: { opacity: 0.9, scale: 0.98 },
      },
      'outline-danger': {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: brandColors.destructive,
        hoverStyle: { backgroundColor: brandColors.destructiveLight },
        pressStyle: { opacity: 0.9, scale: 0.98 },
      },
      'ghost-row': {
        backgroundColor: 'transparent',
        borderWidth: 0,
        hoverStyle: { backgroundColor: neutralColors.background.hover },
        pressStyle: {
          backgroundColor: neutralColors.background.hover,
          opacity: 0.9,
          scale: 0.99,
        },
      },
    },
  } as const,

  defaultVariants: {
    size: '$4',
    variant: 'primary',
  },
})

/**
 * Button - Main action button
 * Updated to use Digital Compass design system colors.
 *
 * Variants: primary, secondary, danger, success, warning, ghost, outline, outline-danger
 * Sizes: $3, $4, $5
 *
 * On the web, a ButtonText inside a filled variant (primary, danger,
 * success, warning) uses dark ink automatically, unless the button overrides
 * its background or the text sets its own color. The native app keeps its
 * white labels.
 */
export const Button = ButtonFrame.styleable(function Button(props, ref) {
  const filled =
    DARK_INK_ON_FILL &&
    FILLED_VARIANTS.has(props.variant ?? 'primary') &&
    props.backgroundColor === undefined
  return (
    <ButtonFillContext.Provider value={filled}>
      <ButtonFrame ref={ref} {...props} />
    </ButtonFillContext.Provider>
  )
})

/**
 * IconButton - A small button typically used for actions in cards/lists
 * Updated to use Digital Compass design system colors.
 */
export const IconButton = styled(TamaguiButton, {
  name: 'IconButton',
  size: '$3',
  borderRadius: '$3',
  backgroundColor: neutralColors.background.hover,
  hoverStyle: {
    backgroundColor: neutralColors.background.elevated,
  },
  pressStyle: {
    backgroundColor: neutralColors.background.elevated,
    opacity: 0.8,
  },

  variants: {
    variant: {
      ghost: {
        backgroundColor: neutralColors.background.hover,
        hoverStyle: { backgroundColor: neutralColors.background.elevated },
        pressStyle: {
          backgroundColor: neutralColors.background.elevated,
          opacity: 0.8,
        },
      },
      danger: {
        backgroundColor: brandColors.destructiveLight,
        hoverStyle: { backgroundColor: brandColors.destructive },
        pressStyle: { backgroundColor: brandColors.destructive, opacity: 0.8 },
      },
      success: {
        backgroundColor: brandColors.secondaryLight,
        hoverStyle: { backgroundColor: brandColors.secondary },
        pressStyle: { backgroundColor: brandColors.secondary, opacity: 0.8 },
      },
    },
  } as const,

  defaultVariants: {
    variant: 'ghost',
  },
})

export type ButtonProps = GetProps<typeof Button>
export type IconButtonProps = GetProps<typeof IconButton>
