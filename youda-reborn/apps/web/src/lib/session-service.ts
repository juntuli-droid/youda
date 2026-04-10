import {
  generateOpaqueToken,
  hashOpaqueToken,
  signAccessToken,
  signRefreshToken
} from '@/lib/auth'
import { env } from '@/lib/env'
import { touchUserLastLogin, type User } from '@/lib/db'
import {
  bindRefreshTokenToLoginSession,
  createLoginSession,
  createLoginChallengeToken,
  findLoginSession,
  findLoginChallengeToken,
  markLoginChallengeTokenUsed,
  markRefreshTokenUsed,
  revokeRefreshToken,
  revokeAllRefreshTokensForUser,
  revokeLoginSessionsForUser,
  touchLoginSession,
  storeRefreshToken
} from '@/lib/security-store'
import { buildDeviceFingerprint, getRequestIp, getRequestUserAgent } from '@/lib/request-meta'
import { sendLoginChallengeEmail, sendSuspiciousLoginEmail } from '@/lib/mailer'

export async function createSessionForUser(user: User, request: Request) {
  const ipAddress = getRequestIp(request)
  const userAgent = getRequestUserAgent(request)
  const deviceFingerprint = await buildDeviceFingerprint(request)
  const existingSession = await findLoginSession(user.id, deviceFingerprint)
  const suspiciousLogin =
    existingSession &&
    existingSession.ipAddress &&
    existingSession.ipAddress !== ipAddress

  if (suspiciousLogin) {
    await revokeAllRefreshTokensForUser(user.id)
    await revokeLoginSessionsForUser(user.id)
    await sendSuspiciousLoginEmail(user.email, ipAddress, userAgent)
  }

  const session = await createLoginSession({
    userId: user.id,
    ipAddress,
    userAgent,
    deviceFingerprint,
    verificationState: suspiciousLogin ? 'PENDING_REVERIFY' : 'TRUSTED'
  })

  if (suspiciousLogin) {
    const rawChallengeToken = generateOpaqueToken()

    await createLoginChallengeToken({
      userId: user.id,
      loginSessionId: session.id,
      tokenHash: await hashOpaqueToken(rawChallengeToken),
      expiresAt: new Date(Date.now() + 1000 * 60 * 15),
      ipAddress,
      userAgent,
      deviceFingerprint
    })

    await sendLoginChallengeEmail(
      user.email,
      `${env.APP_BASE_URL}/login?challenge=${rawChallengeToken}`
    )

    return {
      suspiciousLogin,
      sessionId: session.id
    }
  }

  const tokenBundle = await issueSessionTokens({
    userId: user.id,
    username: user.username,
    sessionId: session.id,
    ipAddress,
    userAgent,
    deviceFingerprint
  })

  await touchUserLastLogin(user.id)

  return {
    ...tokenBundle,
    suspiciousLogin,
    sessionId: session.id
  }
}

async function issueSessionTokens(input: {
  userId: string
  username: string
  sessionId: string
  ipAddress: string
  userAgent: string
  deviceFingerprint: string
}) {
  const accessToken = await signAccessToken({
    sub: input.userId,
    username: input.username,
    sessionId: input.sessionId
  })

  const refreshToken = await signRefreshToken({
    sub: input.userId,
    username: input.username,
    sessionId: input.sessionId
  })

  const storedRefreshToken = await storeRefreshToken({
    userId: input.userId,
    tokenHash: await hashOpaqueToken(refreshToken),
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
    ipAddress: input.ipAddress,
    userAgent: input.userAgent,
    deviceFingerprint: input.deviceFingerprint
  })

  await bindRefreshTokenToLoginSession(input.sessionId, storedRefreshToken.id)

  return {
    accessToken,
    refreshToken
  }
}

export async function verifyLoginChallenge(rawToken: string) {
  const tokenHash = await hashOpaqueToken(rawToken)
  const challenge = await findLoginChallengeToken(tokenHash)

  if (!challenge || challenge.usedAt || challenge.expiresAt < new Date()) {
    return null
  }

  const { user, loginSession } = challenge

  if (!user || !loginSession || loginSession.revokedAt) {
    return null
  }

  await markLoginChallengeTokenUsed(tokenHash)
  await touchLoginSession(loginSession.id, { verificationState: 'TRUSTED' })

  const tokenBundle = await issueSessionTokens({
    userId: user.id,
    username: user.username,
    sessionId: loginSession.id,
    ipAddress: challenge.ipAddress ?? 'unknown',
    userAgent: challenge.userAgent ?? 'unknown',
    deviceFingerprint: challenge.deviceFingerprint ?? 'unknown'
  })

  await touchUserLastLogin(user.id)

  return {
    ...tokenBundle,
    user: {
      id: user.id,
      username: user.username,
      email: user.email
    }
  }
}

export async function rotateSessionTokens(input: {
  userId: string
  username: string
  sessionId: string
  currentRefreshTokenHash: string
  ipAddress?: string
  userAgent?: string
  deviceFingerprint?: string
}) {
  await revokeRefreshToken(input.currentRefreshTokenHash)
  await markRefreshTokenUsed(input.currentRefreshTokenHash).catch(() => undefined)

  return issueSessionTokens({
    userId: input.userId,
    username: input.username,
    sessionId: input.sessionId,
    ipAddress: input.ipAddress ?? 'unknown',
    userAgent: input.userAgent ?? 'unknown',
    deviceFingerprint: input.deviceFingerprint ?? 'unknown'
  })
}
