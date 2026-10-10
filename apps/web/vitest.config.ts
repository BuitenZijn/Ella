import { defineConfig } from 'vitest/config'
import path from 'node:path'

/**
 * Unit tests for the pure logic in `lib/analysis`.
 *
 * Scoped deliberately: those modules take plain objects and return plain
 * objects, so they need no DOM, no Convex client and no React. Component tests
 * would need a renderer and a Tamagui setup, which this project does not have.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['lib/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})
