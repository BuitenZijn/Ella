import type { NextConfig } from 'next'
import { config } from 'dotenv'
import { resolve } from 'path'

// Load root .env file (single source of truth)
config({ path: resolve(__dirname, '../../.env') })

// `convex deploy --cmd` injects NEXT_PUBLIC_CONVEX_URL for the deployment it
// just pushed to; the root .env's CONVEX_URL only fills in when it's unset
// (local builds and `next dev`). lib/convexUrl.ts fails a production build
// that ends up with neither.
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL

const nextConfig: NextConfig = {
  // `next dev` would otherwise write AGENTS.md and CLAUDE.md into apps/web
  agentRules: false,
  transpilePackages: ['tamagui', '@tamagui/config', '@ella/ui', '@ella/shared'],
  ...(convexUrl && { env: { NEXT_PUBLIC_CONVEX_URL: convexUrl } }),
}

export default nextConfig
