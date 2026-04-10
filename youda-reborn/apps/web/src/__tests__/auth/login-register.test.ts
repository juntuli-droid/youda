import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  mockCreateUser,
  mockFindUserSnapshotByEmail,
  mockFindUserSnapshotByUsername,
  mockEnforceRateLimit,
  mockGetRequestIp,
  mockAttachSessionCookies,
  mockCreateSessionForUser,
  mockHash,
  mockCompare,
  mockLoggerError,
  mockCaptureRouteException
} = vi.hoisted(() => ({
  mockCreateUser: vi.fn(),
  mockFindUserSnapshotByEmail: vi.fn(),
  mockFindUserSnapshotByUsername: vi.fn(),
  mockEnforceRateLimit: vi.fn(),
  mockGetRequestIp: vi.fn(),
  mockAttachSessionCookies: vi.fn(),
  mockCreateSessionForUser: vi.fn(),
  mockHash: vi.fn(),
  mockCompare: vi.fn(),
  mockLoggerError: vi.fn(),
  mockCaptureRouteException: vi.fn()
}))

vi.mock('bcryptjs', () => ({
  default: {
    hash: mockHash,
    compare: mockCompare
  }
}))

vi.mock('@/lib/db', () => ({
  Prisma: {
    PrismaClientKnownRequestError: class PrismaClientKnownRequestError extends Error {
      code: string

      constructor(message: string, { code }: { code: string }) {
        super(message)
        this.code = code
      }
    }
  },
  createUser: mockCreateUser,
  findUserSnapshotByEmail: mockFindUserSnapshotByEmail,
  findUserSnapshotByUsername: mockFindUserSnapshotByUsername
}))

vi.mock('@/lib/rate-limit', () => ({
  enforceRateLimit: mockEnforceRateLimit
}))

vi.mock('@/lib/request-meta', () => ({
  getRequestIp: mockGetRequestIp
}))

vi.mock('@/lib/auth-cookies', () => ({
  attachSessionCookies: mockAttachSessionCookies
}))

vi.mock('@/lib/session-service', () => ({
  createSessionForUser: mockCreateSessionForUser
}))

vi.mock('@/lib/logger', () => ({
  logger: {
    error: mockLoggerError
  }
}))

vi.mock('@/lib/monitoring', () => ({
  captureRouteException: mockCaptureRouteException
}))

import { POST as register } from '@/app/api/auth/register/route'
import { POST as login } from '@/app/api/auth/login/route'

describe('auth register/login routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockHash.mockResolvedValue('hashed-password')
    mockCompare.mockResolvedValue(true)
    mockFindUserSnapshotByEmail.mockResolvedValue(null)
    mockFindUserSnapshotByUsername.mockResolvedValue(null)
    mockCreateUser.mockResolvedValue({
      id: 'user_1',
      username: 'alice',
      email: 'alice@example.com'
    })
    mockCreateSessionForUser.mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      suspiciousLogin: false,
      sessionId: 'session_1'
    })
    mockGetRequestIp.mockReturnValue('127.0.0.1')
    mockEnforceRateLimit.mockResolvedValue({
      allowed: true,
      remaining: 10,
      resetSeconds: 60
    })
  })

  it('rejects incomplete registration payloads', async () => {
    const response = await register(
      new Request('http://localhost/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username: '', email: '', password: '' })
      })
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ error: '请填写所有必填字段' })
  })

  it('returns 429 when registration is rate limited', async () => {
    mockEnforceRateLimit.mockResolvedValueOnce({
      allowed: false,
      remaining: 0,
      resetSeconds: 3600
    })

    const response = await register(
      new Request('http://localhost/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username: 'alice', email: 'alice@example.com', password: 'password123' })
      })
    )

    expect(response.status).toBe(429)
  })

  it('rejects registration passwords shorter than 6 characters', async () => {
    const response = await register(
      new Request('http://localhost/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username: 'alice', email: 'alice@example.com', password: '12345' })
      })
    )

    expect(response.status).toBe(400)
  })

  it('returns 400 when email is already registered', async () => {
    mockFindUserSnapshotByEmail.mockResolvedValueOnce({
      id: 'existing',
      email: 'alice@example.com'
    })

    const response = await register(
      new Request('http://localhost/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username: 'alice', email: 'alice@example.com', password: 'password123' })
      })
    )

    expect(response.status).toBe(400)
    expect(mockCreateUser).not.toHaveBeenCalled()
  })

  it('returns 400 when username is already taken', async () => {
    mockFindUserSnapshotByUsername.mockResolvedValueOnce({
      id: 'existing',
      username: 'alice'
    })

    const response = await register(
      new Request('http://localhost/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username: 'alice', email: 'alice@example.com', password: 'password123' })
      })
    )

    expect(response.status).toBe(400)
  })

  it('creates a session after successful registration', async () => {
    const response = await register(
      new Request('http://localhost/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username: 'alice', email: 'alice@example.com', password: 'password123' })
      })
    )

    expect(response.status).toBe(200)
    expect(mockCreateUser).toHaveBeenCalled()
    expect(mockAttachSessionCookies).toHaveBeenCalledWith(
      expect.anything(),
      'access-token',
      'refresh-token'
    )
  })

  it('returns 202 when registration succeeds but session bootstrap does not', async () => {
    mockCreateSessionForUser.mockResolvedValueOnce({
      suspiciousLogin: false,
      sessionId: 'session_1'
    })

    const response = await register(
      new Request('http://localhost/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username: 'alice', email: 'alice@example.com', password: 'password123' })
      })
    )

    expect(response.status).toBe(202)
    expect(mockAttachSessionCookies).not.toHaveBeenCalled()
  })

  it('returns 500 when registration throws an unexpected error', async () => {
    mockCreateUser.mockRejectedValueOnce(new Error('db down'))

    const response = await register(
      new Request('http://localhost/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username: 'alice', email: 'alice@example.com', password: 'password123' })
      })
    )

    expect(response.status).toBe(500)
    expect(mockCaptureRouteException).toHaveBeenCalled()
  })

  it('rejects incomplete login payloads', async () => {
    const response = await login(
      new Request('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ identifier: '', password: '' })
      })
    )

    expect(response.status).toBe(400)
  })

  it('returns 429 when login is rate limited by IP', async () => {
    mockEnforceRateLimit.mockResolvedValueOnce({
      allowed: false,
      remaining: 0,
      resetSeconds: 60
    })

    const response = await login(
      new Request('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ identifier: 'alice', password: 'password123' })
      })
    )

    expect(response.status).toBe(429)
  })

  it('returns 429 when login is rate limited by account', async () => {
    mockEnforceRateLimit
      .mockResolvedValueOnce({
        allowed: true,
        remaining: 9,
        resetSeconds: 60
      })
      .mockResolvedValueOnce({
        allowed: false,
        remaining: 0,
        resetSeconds: 60
      })

    const response = await login(
      new Request('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ identifier: 'alice', password: 'password123' })
      })
    )

    expect(response.status).toBe(429)
  })

  it('returns 401 when user cannot be found', async () => {
    const response = await login(
      new Request('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ identifier: 'missing', password: 'password123' })
      })
    )

    expect(response.status).toBe(401)
  })

  it('returns 403 when suspicious login requires email verification', async () => {
    mockFindUserSnapshotByUsername.mockResolvedValueOnce({
      id: 'user_1',
      username: 'alice',
      email: 'alice@example.com',
      passwordHash: 'stored'
    })
    mockCreateSessionForUser.mockResolvedValueOnce({
      suspiciousLogin: true,
      sessionId: 'session_1'
    })

    const response = await login(
      new Request('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ identifier: 'alice', password: 'password123' })
      })
    )

    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toMatchObject({ requiresChallenge: true })
  })

  it('returns 401 when password verification fails', async () => {
    mockFindUserSnapshotByEmail.mockResolvedValueOnce({
      id: 'user_1',
      username: 'alice',
      email: 'alice@example.com',
      passwordHash: 'stored'
    })
    mockCompare.mockResolvedValueOnce(false)

    const response = await login(
      new Request('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ identifier: 'alice@example.com', password: 'bad-password' })
      })
    )

    expect(response.status).toBe(401)
  })

  it('returns 200 and attaches cookies for a successful login', async () => {
    mockFindUserSnapshotByEmail.mockResolvedValueOnce({
      id: 'user_1',
      username: 'alice',
      email: 'alice@example.com',
      passwordHash: 'stored'
    })

    const response = await login(
      new Request('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ identifier: 'alice@example.com', password: 'password123' })
      })
    )

    expect(response.status).toBe(200)
    expect(mockAttachSessionCookies).toHaveBeenCalledWith(
      expect.anything(),
      'access-token',
      'refresh-token'
    )
  })

  it('returns 500 when login throws unexpectedly', async () => {
    mockFindUserSnapshotByEmail.mockResolvedValueOnce({
      id: 'user_1',
      username: 'alice',
      email: 'alice@example.com',
      passwordHash: 'stored'
    })
    mockCreateSessionForUser.mockRejectedValueOnce(new Error('session init failed'))

    const response = await login(
      new Request('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ identifier: 'alice@example.com', password: 'password123' })
      })
    )

    expect(response.status).toBe(500)
    expect(mockCaptureRouteException).toHaveBeenCalled()
  })
})
