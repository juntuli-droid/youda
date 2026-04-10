import { prisma } from '@/lib/db'

export async function storeRefreshToken(input: {
  userId: string
  tokenHash: string
  expiresAt: Date
  ipAddress?: string
  userAgent?: string
  deviceFingerprint?: string
}) {
  return prisma.refreshToken.create({
    data: input
  })
}

export async function findRefreshToken(tokenHash: string) {
  return prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: {
      user: true
    }
  })
}

export async function revokeRefreshToken(tokenHash: string) {
  return prisma.refreshToken.updateMany({
    where: {
      tokenHash,
      revokedAt: null
    },
    data: {
      revokedAt: new Date()
    }
  })
}

export async function revokeAllRefreshTokensForUser(userId: string) {
  return prisma.refreshToken.updateMany({
    where: {
      userId,
      revokedAt: null
    },
    data: {
      revokedAt: new Date()
    }
  })
}

export async function markRefreshTokenUsed(tokenHash: string) {
  return prisma.refreshToken.update({
    where: { tokenHash },
    data: {
      lastUsedAt: new Date()
    }
  })
}

export async function createPasswordResetToken(input: {
  userId: string
  tokenHash: string
  expiresAt: Date
}) {
  return prisma.passwordResetToken.create({
    data: input
  })
}

export async function findPasswordResetToken(tokenHash: string) {
  return prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: {
      user: true
    }
  })
}

export async function markPasswordResetTokenUsed(tokenHash: string) {
  return prisma.passwordResetToken.update({
    where: { tokenHash },
    data: {
      usedAt: new Date()
    }
  })
}

export async function createLoginSession(input: {
  userId: string
  refreshTokenId?: string
  ipAddress?: string
  userAgent?: string
  deviceFingerprint: string
  verificationState?: string
}) {
  return prisma.loginSession.create({
    data: {
      userId: input.userId,
      refreshTokenId: input.refreshTokenId,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      deviceFingerprint: input.deviceFingerprint,
      verificationState: input.verificationState ?? 'TRUSTED',
      verifiedAt: input.verificationState === 'PENDING_REVERIFY' ? null : new Date()
    }
  })
}

export async function findLoginSession(userId: string, deviceFingerprint: string) {
  return prisma.loginSession.findFirst({
    where: {
      userId,
      deviceFingerprint,
      revokedAt: null
    },
    orderBy: {
      createdAt: 'desc'
    }
  })
}

export async function touchLoginSession(id: string, updates?: { verificationState?: string }) {
  return prisma.loginSession.update({
    where: { id },
    data: {
      lastSeenAt: new Date(),
      verifiedAt: updates?.verificationState === 'TRUSTED' ? new Date() : undefined,
      verificationState: updates?.verificationState
    }
  })
}

export async function bindRefreshTokenToLoginSession(id: string, refreshTokenId: string) {
  return prisma.loginSession.update({
    where: { id },
    data: {
      refreshTokenId
    }
  })
}

export async function findLoginSessionById(id: string) {
  return prisma.loginSession.findUnique({
    where: { id }
  })
}

export async function revokeLoginSession(id: string) {
  return prisma.loginSession.updateMany({
    where: {
      id,
      revokedAt: null
    },
    data: {
      revokedAt: new Date()
    }
  })
}

export async function revokeLoginSessionsForUser(userId: string) {
  return prisma.loginSession.updateMany({
    where: {
      userId,
      revokedAt: null
    },
    data: {
      revokedAt: new Date()
    }
  })
}

export async function createLoginChallengeToken(input: {
  userId: string
  loginSessionId?: string
  tokenHash: string
  expiresAt: Date
  ipAddress?: string
  userAgent?: string
  deviceFingerprint?: string
}) {
  return prisma.loginChallengeToken.create({
    data: input
  })
}

export async function findLoginChallengeToken(tokenHash: string) {
  return prisma.loginChallengeToken.findUnique({
    where: { tokenHash },
    include: {
      user: true,
      loginSession: true
    }
  })
}

export async function markLoginChallengeTokenUsed(tokenHash: string) {
  return prisma.loginChallengeToken.update({
    where: { tokenHash },
    data: {
      usedAt: new Date()
    }
  })
}
