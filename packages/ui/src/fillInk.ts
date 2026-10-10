/**
 * Whether a ButtonText on a light brand fill (primary, danger, success,
 * warning Buttons) switches to dark ink by default.
 *
 * On the web it does: white on the amber, teal and ember fills is only
 * 2–3:1. The native app resolves fillInk.native.ts instead and keeps its
 * white labels, which went through the app's own design review; changing
 * them is a decision for the app, not a side effect of the shared kit.
 */
export const DARK_INK_ON_FILL: boolean = true
