/** A local `convex dev` backend: the fallback for development only. */
export const LOCAL_CONVEX_URL = 'http://127.0.0.1:3210'

/**
 * A production build without a deployment URL would ship a bundle that talks
 * to 127.0.0.1 and fails for every visitor, so it fails the build instead.
 */
export function resolveConvexUrl(
  url: string | undefined,
  nodeEnv: string | undefined,
): string {
  if (url) return url
  if (nodeEnv === 'production') {
    throw new Error(
      'NEXT_PUBLIC_CONVEX_URL is not set. Build with `convex deploy --cmd` ' +
        'or set CONVEX_URL (see next.config.ts).',
    )
  }
  return LOCAL_CONVEX_URL
}

/** The Convex deployment the web app talks to (inlined at build time). */
export const CONVEX_URL = resolveConvexUrl(
  process.env.NEXT_PUBLIC_CONVEX_URL,
  process.env.NODE_ENV,
)
