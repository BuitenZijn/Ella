import { describe, expect, it } from 'vitest'
import {
  clearLegacySession,
  convexAuthStorageKeys,
  hasStoredAccessToken,
  hasStoredSession,
  isTokenFresh,
} from './authStorage'

const URL = 'https://example-cobra-123.convex.cloud'
const keys = convexAuthStorageKeys(URL)
const NOW = Date.UTC(2026, 8, 28, 12, 0, 0)

function memoryStorage(entries: Record<string, string> = {}) {
  const map = new Map(Object.entries(entries))
  return {
    map,
    getItem: (key: string) => map.get(key) ?? null,
    removeItem: (key: string) => void map.delete(key),
  }
}

function jwtExpiringAt(ms: number) {
  const encode = (value: object) =>
    btoa(JSON.stringify(value))
      .replace(/=+$/, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
  return `${encode({ alg: 'RS256' })}.${encode({ sub: 'u|s', exp: ms / 1000 })}.sig`
}

describe('convexAuthStorageKeys', () => {
  it('namespaces keys the way @convex-dev/auth does', () => {
    expect(keys.jwt).toBe('__convexAuthJWT_httpsexamplecobra123convexcloud')
    expect(keys.refreshToken).toBe(
      '__convexAuthRefreshToken_httpsexamplecobra123convexcloud',
    )
  })
})

describe('hasStoredSession', () => {
  it('needs a real refresh token', () => {
    expect(hasStoredSession(memoryStorage(), URL)).toBe(false)
    expect(
      hasStoredSession(memoryStorage({ [keys.refreshToken]: 'dummy' }), URL),
    ).toBe(false)
    expect(
      hasStoredSession(memoryStorage({ [keys.refreshToken]: 'r1' }), URL),
    ).toBe(true)
  })
})

describe('hasStoredAccessToken', () => {
  it('needs both an access token and a real refresh token', () => {
    expect(
      hasStoredAccessToken(
        memoryStorage({ [keys.refreshToken]: 'r1', [keys.jwt]: 'jwt' }),
        URL,
      ),
    ).toBe(true)
    expect(
      hasStoredAccessToken(memoryStorage({ [keys.refreshToken]: 'r1' }), URL),
    ).toBe(false)
    expect(
      hasStoredAccessToken(
        memoryStorage({ [keys.refreshToken]: 'dummy', [keys.jwt]: 'jwt' }),
        URL,
      ),
    ).toBe(false)
  })
})

describe('isTokenFresh', () => {
  it('accepts a token with time left', () => {
    expect(isTokenFresh(jwtExpiringAt(NOW + 30 * 60_000), NOW)).toBe(true)
  })

  it('rejects expired, nearly expired and malformed tokens', () => {
    expect(isTokenFresh(jwtExpiringAt(NOW - 1), NOW)).toBe(false)
    expect(isTokenFresh(jwtExpiringAt(NOW + 30_000), NOW)).toBe(false)
    expect(isTokenFresh('not-a-jwt', NOW)).toBe(false)
    expect(isTokenFresh('a.!!!.c', NOW)).toBe(false)
  })
})

describe('clearLegacySession', () => {
  it('drops sessions left by the cookie-based setup', () => {
    const storage = memoryStorage({
      [keys.jwt]: 'jwt',
      [keys.refreshToken]: 'dummy',
      [keys.serverStateFetchTime]: '1',
      unrelated: 'kept',
    })
    clearLegacySession(storage, URL)
    expect([...storage.map.keys()]).toEqual(['unrelated'])
  })

  it('keeps browser sessions', () => {
    const storage = memoryStorage({
      [keys.jwt]: 'jwt',
      [keys.refreshToken]: 'r1',
    })
    clearLegacySession(storage, URL)
    expect(storage.map.size).toBe(2)
  })
})
