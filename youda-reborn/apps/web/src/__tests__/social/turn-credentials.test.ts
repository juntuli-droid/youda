import { afterEach, describe, expect, it, vi } from 'vitest'

describe('turn-credentials', () => {
  afterEach(() => {
    vi.resetModules()
    vi.doUnmock('@/lib/env')
    vi.useRealTimers()
  })

  it('returns null when turn secret is absent', async () => {
    vi.doMock('@/lib/env', () => ({
      env: {
        TURN_SHARED_SECRET: undefined,
        TURN_CREDENTIAL_TTL_SECONDS: undefined
      }
    }))

    const { createTurnCredentialBundle } = await import('@/lib/turn-credentials')
    expect(createTurnCredentialBundle('user_1')).toBeNull()
  })

  it('creates ephemeral turn credentials with ttl', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-09T10:00:00.000Z'))
    vi.doMock('@/lib/env', () => ({
      env: {
        TURN_SHARED_SECRET: 'turn-secret',
        TURN_CREDENTIAL_TTL_SECONDS: 600
      }
    }))

    const { createTurnCredentialBundle } = await import('@/lib/turn-credentials')
    const bundle = createTurnCredentialBundle('user_1')
    const expectedExpiresAt = Math.floor(Date.now() / 1000) + 600

    expect(bundle).toMatchObject({
      ttlSeconds: 600
    })
    expect(bundle?.username).toBe(`${expectedExpiresAt}:user_1`)
    expect(typeof bundle?.credential).toBe('string')
  })
})
