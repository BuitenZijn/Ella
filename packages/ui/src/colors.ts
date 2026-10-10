/**
 * Ella Design System - Color Palette
 *
 * A light, playful palette: lavender pages, white cards, purple actions.
 * Components only use the semantic groups below, never raw values.
 */

// =============================================================================
// Ella - Core Palette
// =============================================================================

/**
 * Raw color values for the Ella theme.
 * @internal - Do not import directly, use semantic color groups instead
 */
const paletteColors = {
  /** Lavender - page background */
  lavender: '#F6F4FF',
  /** White - cards and surfaces */
  white: '#FFFFFF',
  /** Lavender Hover - hover/pressed surfaces */
  lavenderHover: '#ECE8FF',
  /** Bright violet - accents, highlights */
  violet: '#8B6CFF',
  /** Purple - primary fills; white text on it stays readable */
  purple: '#5B3FD6',
  /** Purple hover */
  purpleHover: '#4A31B8',
  /** Violet light - subtle violet backgrounds */
  violetLight: 'rgba(139, 108, 255, 0.14)',
  /** Blue - secondary, information */
  blue: '#186DB7',
  /** Blue hover */
  blueHover: '#115490',
  /** Blue light - subtle blue backgrounds */
  blueLight: 'rgba(24, 109, 183, 0.12)',
  /** Green - success */
  green: '#2E8B3A',
  /** Green hover */
  greenHover: '#256F2E',
  /** Green light - subtle green backgrounds */
  greenLight: 'rgba(46, 139, 58, 0.12)',
  /** Orange - warnings */
  orange: '#AF5F18',
  /** Orange hover */
  orangeHover: '#945014',
  /** Orange light - subtle orange backgrounds */
  orangeLight: 'rgba(224, 122, 31, 0.14)',
  /** Rust red - destructive actions and errors */
  rust: '#B71D2E',
  /** Rust red hover */
  rustHover: '#901624',
  /** Rust red light - subtle red backgrounds */
  rustLight: 'rgba(183, 29, 46, 0.1)',
  /** Ink - headers and primary text */
  ink: '#1F1A33',
  /** Gray - secondary text, labels */
  gray: '#4D4766',
  /** Gray muted - placeholders, inactive icons */
  grayMuted: '#6B6585',
  /** Border color for cards and elements */
  border: '#DCD6F2',
  /** Border color hover state */
  borderStrong: '#C4BCE6',
} as const

// =============================================================================
// Brand Colors - Primary accent colors (purple)
// =============================================================================

export const brandColors = {
  /** Primary brand color - main CTAs, links, active states */
  primary: paletteColors.purple,
  /** Primary hover/active state */
  primaryHover: paletteColors.purpleHover,
  /** Primary for text on light backgrounds */
  primaryText: paletteColors.purpleHover,
  /** Logo green - accents and highlights, not for text */
  accent: paletteColors.violet,
  /** Light primary for subtle backgrounds */
  primaryLight: paletteColors.violetLight,

  /** Secondary brand color - information (blue) */
  secondary: paletteColors.blue,
  /** Secondary hover state */
  secondaryHover: paletteColors.blueHover,
  /** Secondary light for subtle backgrounds */
  secondaryLight: paletteColors.blueLight,

  /** Destructive color - errors, delete actions (rust red) */
  destructive: paletteColors.rust,
  /** Destructive hover state */
  destructiveHover: paletteColors.rustHover,
  /** Destructive light for subtle backgrounds */
  destructiveLight: paletteColors.rustLight,

  /** Error color - alias for destructive */
  error: paletteColors.rust,
} as const

// =============================================================================
// Semantic Colors - For conveying meaning
// =============================================================================

/**
 * Use these for status indicators, alerts, and feedback.
 * Each has: text (for labels), background (for fills), border (for outlines), main (for icons/dots)
 */
export const semanticColors = {
  success: {
    text: paletteColors.green,
    background: paletteColors.greenLight,
    border: paletteColors.green,
    main: paletteColors.green,
    hover: paletteColors.greenHover,
  },
  error: {
    text: paletteColors.rust,
    background: paletteColors.rustLight,
    border: paletteColors.rust,
    main: paletteColors.rust,
    hover: paletteColors.rustHover,
  },
  warning: {
    text: paletteColors.orange,
    background: paletteColors.orangeLight,
    border: paletteColors.orange,
    main: paletteColors.orange,
    hover: paletteColors.orangeHover,
  },
  info: {
    text: paletteColors.blue,
    background: paletteColors.blueLight,
    border: paletteColors.blue,
    main: paletteColors.blue,
    hover: paletteColors.blueHover,
  },
} as const

// =============================================================================
// Neutral Colors - For layout, text, and borders
// =============================================================================

export const neutralColors = {
  /** Background colors - use for cards, sections, hover states */
  background: {
    page: paletteColors.lavender,
    elevated: paletteColors.white,
    /** Card background - alias for elevated */
    card: paletteColors.white,
    hover: paletteColors.lavenderHover,
    active: paletteColors.lavenderHover,
  },

  /** Text colors - use for content hierarchy */
  text: {
    /** Primary text - main content */
    primary: paletteColors.ink,
    /** Secondary text - labels, descriptions */
    secondary: paletteColors.gray,
    /** Tertiary text - less important, alias for muted */
    tertiary: paletteColors.grayMuted,
    /** Muted text - placeholders, disabled */
    muted: paletteColors.grayMuted,
    /** Inverse text - on dark backgrounds */
    inverse: paletteColors.white,
    /** Text and icons on a brand fill (green, blue, rust buttons) */
    onFill: paletteColors.white,
  },

  /** Border colors */
  border: {
    default: paletteColors.border,
    /** Subtle border - alias for default */
    subtle: paletteColors.border,
    strong: paletteColors.borderStrong,
    focus: paletteColors.purple,
  },
} as const

// =============================================================================
// Role Colors - For user permissions (admin badge, etc.)
// =============================================================================

export const roleColors = {
  admin: {
    background: paletteColors.violetLight,
    text: paletteColors.purple,
    border: paletteColors.purple,
  },
  user: {
    background: paletteColors.blueLight,
    text: paletteColors.blue,
    border: paletteColors.blue,
  },
  debug: {
    background: paletteColors.rustLight,
    text: paletteColors.rust,
    border: paletteColors.rust,
  },
} as const

// =============================================================================
// Status Colors - For quest/item status badges
// =============================================================================

export const statusColors = {
  active: {
    background: paletteColors.blueLight,
    text: paletteColors.blue,
    border: paletteColors.blue,
  },
  draft: {
    background: paletteColors.violetLight,
    text: paletteColors.purple,
    border: paletteColors.purple,
  },
  archived: {
    background: 'rgba(107, 124, 138, 0.15)',
    text: paletteColors.gray,
    border: paletteColors.gray,
  },
} as const

// =============================================================================
// Team Colors - For telling teams apart (e.g. quiz teams)
// =============================================================================

export const teamColors = [
  '#FF6B6B', // Coral Red
  '#4ECDC4', // Teal
  '#45B7D1', // Sky Blue
  '#96CEB4', // Mint
  '#FFEAA7', // Yellow
  '#DDA0DD', // Plum
  '#98D8C8', // Seafoam
  '#F7DC6F', // Gold
  '#BB8FCE', // Purple
  '#85C1E9', // Light Blue
] as const

export type TeamColor = (typeof teamColors)[number]

// =============================================================================
// Overlay Colors - For modal backdrops and overlays
// =============================================================================

export const overlayColors = {
  /** Light overlay - for dropdowns, popovers */
  light: 'rgba(0, 0, 0, 0.3)',
  /** Medium overlay - for sheets, drawers */
  medium: 'rgba(0, 0, 0, 0.5)',
  /** Dark overlay - for modals, alerts */
  dark: 'rgba(0, 0, 0, 0.7)',
} as const

// =============================================================================
// Type Exports
// =============================================================================

export type BrandColors = typeof brandColors
export type SemanticColors = typeof semanticColors
export type NeutralColors = typeof neutralColors
export type RoleColors = typeof roleColors
export type StatusColors = typeof statusColors
export type OverlayColors = typeof overlayColors
