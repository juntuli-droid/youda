import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  mockAttachSessionCookies,
  mockClearSessionCookies,
  mockHashOpaqueToken,
  mockVerifyRefreshToken,
  mockFindRefreshToken,
  mockFindLoginSessionById,
  mockTouchLoginSession,
  mockRotateSessionTokens,
  mockGetRequestIp,
  mockGetRequestUserAgent,
  mockBuildDeviceFingerprint,
  mockRevokeRefreshToken,
  mockRevokeLoginSession
} = vi.hoisted(() => ({
  mockAttachSessionCookies: vi.fn(),
  mockClearSessionCookies: vi.fn(),
  mockHashOpaqueToken: vi.fn(),
  mockVerifyRefreshToken: vi.fn(),
  mockFindRefreshToken: vi.fn(),
  mockFindLoginSessionById: vi.fn(),
  mockTouchLoginSession: vi.fn(),
  mockRotateSessionTokens: vi.fn(),
  mockGetRequestIp: vi.fn(),
  mockGetRequestUserAgent: vi.fn(),
  mockBuildDeviceFingerprint: vi.fn(),
  mockRevokeRefreshToken: vi.fn(),
  mockRevokeLoginSession: vi.fn()
}))

vi.mock('@/lib/auth-cookies', () => ({
  attachSessionCookies: mockAttachSessionCookies,
  clearSessionCookies: mockClearSessionCookies
}))

vi.mock('@/lib/auth', () => ({
  hashOpaqueToken: mockHashOpaqueToken,
  verifyRefreshToken: mockVerifyRefreshToken
}))

vi.mock('@/lib/security-store', () => ({
  findRefreshToken: mockFindRefreshToken,
  findLoginSessionById: mockFindLoginSessionById,
  touchLoginSession: mockTouchLoginSession,
  revokeRefreshToken: mockRevokeRefreshToken,
  revokeLoginSession: mockRevokeLoginSession
}))

vi.mock('@/lib/session-service', () => ({
  rotateSessionTokens: mockRotateSessionTokens
}))

vi.mock('@/lib/request-meta', () => ({
  getRequestIp: mockGetRequestIp,
  getRequestUserAgent: mockGetRequestUserAgent,
  buildDeviceFingerprint: mockBuildDeviceFingerprint
}))

import { POST as refresh } from '@/app/api/auth/refresh/route'
import { POST as logout } from '@/app/api/auth/logout/route'

describe('auth refresh/logout routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockHashOpaqueToken.mockResolvedValue('hashed-refresh')
    mockVerifyRefreshToken.mockResolvedValue({
      sub: 'user_1',
      type: 'refresh',
      sessionId: 'session_1'
    })
    mockFindRefreshToken.mockResolvedValue({
      id: 'refresh_1',
      userId: 'user_1',
      revokedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
      user: {
        id: 'user_1',
        username: 'alice'
      }
    })
    mockFindLoginSessionById.mockResolvedValue({
      id: 'session_1',
      revokedAt: null,
      verificationState: 'TRUSTED'
    })
    mockTouchLoginSession.mockResolvedValue(undefined)
    mockRotateSessionTokens.mockResolvedValue({
      accessToken: 'new-access',
      refreshToken: 'new-refresh'
    })
    mockGetRequestIp.mockReturnValue('127.0.0.1')
    mockGetRequestUserAgent.mockReturnValue('vitest')
    mockBuildDeviceFingerprint.mockResolvedValue('fingerprint')
  })

  it('rejects refresh without cookie', async () => {
    const response = await refresh(new Request('http://localhost/api/auth/refresh', { method: 'POST' }))
    expect(response.status).toBe(401)
  })

  it('rejects invalid refresh payloads', async () => {
    mockVerifyRefreshToken.mockResolvedValueOnce(null)

    const response = await refresh(
      new Request('http://localhost/api/auth/refresh', {
        method: 'POST',
        headers: { cookie: 'refreshToken=abc' }
      })
    )

    expect(response.status).toBe(401)
  })

  it('rejects revoked or untrusted login sessions', async () => {
    mockFindLoginSessionById.mockResolvedValueOnce({
      id: 'session_1',
      revokedAt: new Date(),
      verificationState: 'TRUSTED'
    })

    const response = await refresh(
      new Request('http://localhost/api/auth/refresh', {
        method: 'POST',
        headers: { cookie: 'refreshToken=abc' }
      })
    )

    expect(response.status).toBe(401)
  })

  it('rotates tokens for valid refresh requests', async () => {
    const response = await refresh(
      new Request('http://localhost/api/auth/refresh', {
        method: 'POST',
        headers: { cookie: 'refreshToken=abc' }
      })
    )

    expect(response.status).toBe(200)
    expect(mockRotateSessionTokens).toHaveBeenCalled()
    expect(mockAttachSessionCookies).toHaveBeenCalledWith(expect.anything(), 'new-access', 'new-refresh')
  })

  it('clears cookies even when logout is called without a refresh token', async () => {
    const response = await logout(new Request('http://localhost/api/auth/logout', { method: 'POST' }))
    expect(response.status).toBe(200)
    expect(mockClearSessionCookies).toHaveBeenCalled()
  })

  it('revokes both refresh token and session on logout', async () => {
    const response = await logout(
      new Request('http://localhost/api/auth/logout', {
        method: 'POST',
        headers: { cookie: 'refreshToken=abc' }
      })
    )

    expect(response.status).toBe(200)
    expect(mockRevokeRefreshToken).toHaveBeenCalledWith('hashed-refresh')
    expect(mockRevokeLoginSession).toHaveBeenCalledWith('session_1')
  })
})
