import { afterEach, describe, expect, it, vi } from 'vitest'

describe('rtc-config', () => {
  afterEach(() => {
    vi.resetModules()
    vi.doUnmock('@/lib/env')
    vi.useRealTimers()
  })

  it('falls back to public stun when config is missing', async () => {
    vi.doMock('@/lib/env', () => ({
      env: {
        RTC_ICE_SERVERS_JSON: undefined
      }
    }))
    const { getRtcIceServers } = await import('@/lib/rtc-config')

    expect(getRtcIceServers()).toEqual([
      {
        urls: ['stun:stun.l.google.com:19302']
      }
    ])
  })

  it('parses configured turn and stun servers', async () => {
    vi.doMock('@/lib/env', () => ({
      env: {
        RTC_ICE_SERVERS_JSON: JSON.stringify([
          { urls: ['stun:stun.example.com:3478'] },
          {
            urls: ['turn:turn.example.com:3478?transport=udp'],
            username: 'turn-user',
            credential: 'turn-password'
          }
        ])
      }
    }))

    const { getRtcIceServers } = await import('@/lib/rtc-config')
    expect(getRtcIceServers()).toEqual([
      {
        urls: ['stun:stun.example.com:3478']
      },
      {
        urls: ['turn:turn.example.com:3478?transport=udp'],
        username: 'turn-user',
        credential: 'turn-password'
      }
    ])
  })

  it('appends ephemeral turn credentials for authenticated users', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-09T10:00:00.000Z'))
    vi.doMock('@/lib/env', () => ({
      env: {
        RTC_ICE_SERVERS_JSON: JSON.stringify([
          { urls: ['stun:stun.example.com:3478'] }
        ]),
        TURN_SHARED_SECRET: 'turn-secret',
        TURN_UDP_URL: 'turn:turn.example.com:3478?transport=udp',
        TURN_TLS_URL: 'turns:turn.example.com:5349?transport=tcp',
        TURN_CREDENTIAL_TTL_SECONDS: 3600
      }
    }))

    const { getRtcIceServers } = await import('@/lib/rtc-config')
    const servers = getRtcIceServers('user_1')

    expect(servers).toHaveLength(2)
    expect(servers[1]).toMatchObject({
      urls: [
        'turn:turn.example.com:3478?transport=udp',
        'turns:turn.example.com:5349?transport=tcp'
      ]
    })
    expect(typeof servers[1]?.username).toBe('string')
    expect(typeof servers[1]?.credential).toBe('string')
  })
})
