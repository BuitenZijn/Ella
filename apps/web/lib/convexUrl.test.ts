import { describe, expect, it } from 'vitest'
import { LOCAL_CONVEX_URL, resolveConvexUrl } from './convexUrl'

describe('resolveConvexUrl', () => {
  it('uses the configured deployment', () => {
    const url = 'https://aromatic-cobra-274.convex.cloud'
    expect(resolveConvexUrl(url, 'production')).toBe(url)
    expect(resolveConvexUrl(url, 'development')).toBe(url)
  })

  it('falls back to the local backend in development and tests', () => {
    expect(resolveConvexUrl(undefined, 'development')).toBe(LOCAL_CONVEX_URL)
    expect(resolveConvexUrl('', 'test')).toBe(LOCAL_CONVEX_URL)
  })

  it('fails a production build without a deployment', () => {
    expect(() => resolveConvexUrl(undefined, 'production')).toThrow(
      /NEXT_PUBLIC_CONVEX_URL is not set/,
    )
    expect(() => resolveConvexUrl('', 'production')).toThrow()
  })
})
