import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  mockFindUserSnapshotByEmail,
  mockCreatePasswordResetToken,
  mockGenerateOpaqueToken,
  mockHashOpaqueToken,
  mockSendPasswordResetEmail,
  mockFindPasswordResetToken,
  mockMarkPasswordResetTokenUsed,
  mockBcryptHash,
  mockTransaction,
  mockUserUpdate,
  mockPasswordResetTokenUpdate,
  mockAttachSessionCookies,
  mockVerifyLoginChallenge,
  mockCaptureRouteException
} = vi.hoisted(() => ({
  mockFindUserSnapshotByEmail: vi.fn(),
  mockCreatePasswordResetToken: vi.fn(),
  mockGenerateOpaqueToken: vi.fn(),
  mockHashOpaqueToken: vi.fn(),
  mockSendPasswordResetEmail: vi.fn(),
  mockFindPasswordResetToken: vi.fn(),
  mockMarkPasswordResetTokenUsed: vi.fn(),
  mockBcryptHash: vi.fn(),
  mockTransaction: vi.fn(),
  mockUserUpdate: vi.fn(),
  mockPasswordResetTokenUpdate: vi.fn(),
  mockAttachSessionCookies: vi.fn(),
  mockVerifyLoginChallenge: vi.fn(),
  mockCaptureRouteException: vi.fn()
}))

vi.mock('bcryptjs', () => ({
  default: {
    hash: mockBcryptHash
  }
}))

vi.mock('@/lib/db', () => ({
  findUserSnapshotByEmail: mockFindUserSnapshotByEmail,
  prisma: {
    $transaction: mockTransaction,
    user: {
      update: mockUserUpdate
    },
    passwordResetToken: {
      update: mockPasswordResetTokenUpdate
    }
  }
}))

vi.mock('@/lib/security-store', () => ({
  createPasswordResetToken: mockCreatePasswordResetToken,
  findPasswordResetToken: mockFindPasswordResetToken,
  markPasswordResetTokenUsed: mockMarkPasswordResetTokenUsed
}))

vi.mock('@/lib/auth', () => ({
  generateOpaqueToken: mockGenerateOpaqueToken,
  hashOpaqueToken: mockHashOpaqueToken
}))

vi.mock('@/lib/mailer', () => ({
  sendPasswordResetEmail: mockSendPasswordResetEmail
}))

vi.mock('@/lib/env', () => ({
  env: {
    APP_BASE_URL: 'https://youda.example.com'
  }
}))

vi.mock('@/lib/auth-cookies', () => ({
  attachSessionCookies: mockAttachSessionCookies
}))

vi.mock('@/lib/session-service', () => ({
  verifyLoginChallenge: mockVerifyLoginChallenge
}))

vi.mock('@/lib/monitoring', () => ({
  captureRouteException: mockCaptureRouteException
}))

import { POST as forgotPassword } from '@/app/api/auth/password/forgot/route'
import { POST as resetPassword } from '@/app/api/auth/password/reset/route'
import { POST as verifyLogin } from '@/app/api/auth/login/verify/route'

describe('password recovery and login verification routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGenerateOpaqueToken.mockReturnValue('raw-token')
    mockHashOpaqueToken.mockResolvedValue('hashed-token')
    mockBcryptHash.mockResolvedValue('new-password-hash')
    mockUserUpdate.mockReturnValue({ id: 'user_1' })
    mockPasswordResetTokenUpdate.mockReturnValue({ tokenHash: 'hashed-token' })
    mockTransaction.mockResolvedValue(undefined)
    mockMarkPasswordResetTokenUsed.mockResolvedValue(undefined)
    mockVerifyLoginChallenge.mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      user: {
        id: 'user_1',
        username: 'alice',
        email: 'alice@example.com'
      }
    })
  })

  it('rejects forgot-password requests without email', async () => {
    const response = await forgotPassword(
      new Request('http://localhost/api/auth/password/forgot', {
        method: 'POST',
        body: JSON.stringify({})
      })
    )

    expect(response.status).toBe(400)
  })

  it('returns a neutral response for unknown emails', async () => {
    mockFindUserSnapshotByEmail.mockResolvedValueOnce(null)

    const response = await forgotPassword(
      new Request('http://localhost/api/auth/password/forgot', {
        method: 'POST',
        body: JSON.stringify({ email: 'missing@example.com' })
      })
    )

    expect(response.status).toBe(200)
    expect(mockSendPasswordResetEmail).not.toHaveBeenCalled()
  })

  it('stores a reset token and sends an email for known users', async () => {
    mockFindUserSnapshotByEmail.mockResolvedValueOnce({
      id: 'user_1',
      email: 'alice@example.com'
    })

    const response = await forgotPassword(
      new Request('http://localhost/api/auth/password/forgot', {
        method: 'POST',
        body: JSON.stringify({ email: 'alice@example.com' })
      })
    )

    expect(response.status).toBe(200)
    expect(mockCreatePasswordResetToken).toHaveBeenCalled()
    expect(mockSendPasswordResetEmail).toHaveBeenCalledWith(
      'alice@example.com',
      'https://youda.example.com/reset-password?token=raw-token'
    )
  })

  it('returns 500 when forgot-password email sending fails', async () => {
    mockFindUserSnapshotByEmail.mockResolvedValueOnce({
      id: 'user_1',
      email: 'alice@example.com'
    })
    mockSendPasswordResetEmail.mockRejectedValueOnce(new Error('sendgrid down'))

    const response = await forgotPassword(
      new Request('http://localhost/api/auth/password/forgot', {
        method: 'POST',
        body: JSON.stringify({ email: 'alice@example.com' })
      })
    )

    expect(response.status).toBe(500)
    expect(mockCaptureRouteException).toHaveBeenCalled()
  })

  it('rejects reset-password requests with missing params', async () => {
    const response = await resetPassword(
      new Request('http://localhost/api/auth/password/reset', {
        method: 'POST',
        body: JSON.stringify({ token: '', password: '' })
      })
    )

    expect(response.status).toBe(400)
  })

  it('rejects expired reset tokens', async () => {
    mockFindPasswordResetToken.mockResolvedValueOnce(null)

    const response = await resetPassword(
      new Request('http://localhost/api/auth/password/reset', {
        method: 'POST',
        body: JSON.stringify({ token: 'raw-token', password: 'password123' })
      })
    )

    expect(response.status).toBe(400)
  })

  it('rejects reset-password requests with passwords shorter than 8 characters', async () => {
    const response = await resetPassword(
      new Request('http://localhost/api/auth/password/reset', {
        method: 'POST',
        body: JSON.stringify({ token: 'raw-token', password: '1234567' })
      })
    )

    expect(response.status).toBe(400)
  })

  it('updates the password inside a transaction for valid reset tokens', async () => {
    mockFindPasswordResetToken.mockResolvedValueOnce({
      userId: 'user_1',
      tokenHash: 'hashed-token',
      expiresAt: new Date(Date.now() + 60_000),
      usedAt: null
    })

    const response = await resetPassword(
      new Request('http://localhost/api/auth/password/reset', {
        method: 'POST',
        body: JSON.stringify({ token: 'raw-token', password: 'password123' })
      })
    )

    expect(response.status).toBe(200)
    expect(mockUserUpdate).toHaveBeenCalled()
    expect(mockPasswordResetTokenUpdate).toHaveBeenCalled()
    expect(mockTransaction).toHaveBeenCalled()
    expect(mockMarkPasswordResetTokenUsed).toHaveBeenCalledWith('hashed-token')
  })

  it('returns 500 when reset-password raises an unexpected error', async () => {
    mockFindPasswordResetToken.mockResolvedValueOnce({
      userId: 'user_1',
      tokenHash: 'hashed-token',
      expiresAt: new Date(Date.now() + 60_000),
      usedAt: null
    })
    mockTransaction.mockRejectedValueOnce(new Error('transaction failed'))

    const response = await resetPassword(
      new Request('http://localhost/api/auth/password/reset', {
        method: 'POST',
        body: JSON.stringify({ token: 'raw-token', password: 'password123' })
      })
    )

    expect(response.status).toBe(500)
    expect(mockCaptureRouteException).toHaveBeenCalled()
  })

  it('rejects login verification when token is missing', async () => {
    const response = await verifyLogin(
      new Request('http://localhost/api/auth/login/verify', {
        method: 'POST',
        body: JSON.stringify({})
      })
    )

    expect(response.status).toBe(400)
  })

  it('rejects invalid login verification links', async () => {
    mockVerifyLoginChallenge.mockResolvedValueOnce(null)

    const response = await verifyLogin(
      new Request('http://localhost/api/auth/login/verify', {
        method: 'POST',
        body: JSON.stringify({ token: 'challenge' })
      })
    )

    expect(response.status).toBe(400)
  })

  it('attaches cookies when login verification succeeds', async () => {
    const response = await verifyLogin(
      new Request('http://localhost/api/auth/login/verify', {
        method: 'POST',
        body: JSON.stringify({ token: 'challenge' })
      })
    )

    expect(response.status).toBe(200)
    expect(mockAttachSessionCookies).toHaveBeenCalledWith(
      expect.anything(),
      'access-token',
      'refresh-token'
    )
  })

  it('returns 500 when login verification throws unexpectedly', async () => {
    mockVerifyLoginChallenge.mockRejectedValueOnce(new Error('challenge store unavailable'))

    const response = await verifyLogin(
      new Request('http://localhost/api/auth/login/verify', {
        method: 'POST',
        body: JSON.stringify({ token: 'challenge' })
      })
    )

    expect(response.status).toBe(500)
    expect(mockCaptureRouteException).toHaveBeenCalled()
  })
})
