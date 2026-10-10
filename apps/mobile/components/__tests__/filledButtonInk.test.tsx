/**
 * The shared UI kit gives filled buttons (primary, danger, success, warning)
 * dark labels on the web, where white on the amber, teal and ember fills
 * fails contrast. The app keeps its white labels: they went through the
 * app's design review, and a kit change must not repaint ~30 buttons in the
 * next build without anyone deciding to.
 *
 * Button reads DARK_INK_ON_FILL (packages/ui/src/fillInk.ts) to decide; the
 * app's bundler, like Jest here, resolves fillInk.native.ts instead.
 */
// The kit exports only its index, which loads all of Tamagui's web build
import { DARK_INK_ON_FILL } from '../../../../packages/ui/src/fillInk'

describe('filled button labels in the app', () => {
  it('keeps white labels rather than the web kit dark ink', () => {
    expect(DARK_INK_ON_FILL).toBe(false)
  })
})
