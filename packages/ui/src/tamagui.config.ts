import { config } from '@tamagui/config/v3'
import { createTamagui } from 'tamagui'
import { neutralColors, brandColors } from './colors'

// The Ella light theme: lavender pages, white cards, purple actions
const ellaLight = {
  // Background colors
  background: neutralColors.background.page,
  backgroundHover: neutralColors.background.hover,
  backgroundPress: neutralColors.background.active,
  backgroundFocus: neutralColors.background.active,
  backgroundStrong: neutralColors.background.elevated,
  backgroundTransparent: 'transparent',

  // Text colors - color12 is the strongest text, color1 the faintest
  color: neutralColors.text.primary,
  colorHover: neutralColors.text.primary,
  colorPress: neutralColors.text.secondary,
  colorFocus: neutralColors.text.primary,
  color1: neutralColors.text.muted,
  color2: neutralColors.text.muted,
  color3: neutralColors.text.muted,
  color4: neutralColors.text.muted,
  color5: neutralColors.text.secondary,
  color6: neutralColors.text.secondary,
  color7: neutralColors.text.secondary,
  color8: neutralColors.text.secondary,
  color9: neutralColors.text.secondary,
  color10: neutralColors.text.secondary,
  color11: neutralColors.text.secondary,
  color12: neutralColors.text.primary,

  // Border colors
  borderColor: neutralColors.border.default,
  borderColorHover: neutralColors.border.strong,
  borderColorFocus: brandColors.primary,
  borderColorPress: neutralColors.border.strong,

  // Placeholder
  placeholderColor: neutralColors.text.muted,

  // Shadow
  shadowColor: 'rgba(0,0,0,0.08)',
  shadowColorHover: 'rgba(0,0,0,0.12)',
  shadowColorPress: 'rgba(0,0,0,0.12)',
  shadowColorFocus: 'rgba(0,0,0,0.12)',

  // Outline (for focus states)
  outlineColor: brandColors.primary,
} as const

const tamaguiConfig = createTamagui({
  ...config,
  // Only ship our own themes. Spreading config.themes here pulls in every
  // default color theme and component sub-theme (~2.6MB of CSS inlined into
  // each SSR response on web) that the app never uses.
  themes: {
    light: ellaLight,
    // Also set dark to light for consistency (the app is light-only)
    dark: ellaLight,
  },
  defaultTheme: 'light',
})

export type Conf = typeof tamaguiConfig

declare module 'tamagui' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface TamaguiCustomConfig extends Conf {}
}

export default tamaguiConfig
