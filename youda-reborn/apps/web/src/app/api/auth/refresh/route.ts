export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { attachSessionCookies } from '@/lib/auth-cookies';
import { hashOpaqueToken, verifyRefreshToken } from '@/lib/auth';
import { findLoginSessionById, findRefreshToken, touchLoginSession } from '@/lib/security-store';
import { rotateSessionTokens } from '@/lib/session-service';
import { buildDeviceFingerprint, getRequestIp, getRequestUserAgent } from '@/lib/request-meta';

export async function POST(request: Request) {
  const refreshToken = request.headers
    .get('cookie')
    ?.match(/refreshToken=([^;]+)/)?.[1]

  if (!refreshToken) {
    return NextResponse.json({ error: '缺少刷新令牌' }, { status: 401 })
  }

  const payload = await verifyRefreshToken(refreshToken)
  if (!payload?.sub || payload.type !== 'refresh' || !payload.sessionId) {
    return NextResponse.json({ error: '刷新令牌无效' }, { status: 401 })
  }

  const refreshTokenHash = await hashOpaqueToken(refreshToken)
  const storedToken = await findRefreshToken(refreshTokenHash)
  const loginSession = await findLoginSessionById(payload.sessionId)

  if (
    !storedToken ||
    storedToken.userId !== payload.sub ||
    storedToken.revokedAt ||
    storedToken.expiresAt < new Date() ||
    !loginSession ||
    loginSession.revokedAt ||
    loginSession.verificationState !== 'TRUSTED'
  ) {
    return NextResponse.json({ error: '刷新令牌已失效' }, { status: 401 })
  }

  await touchLoginSession(payload.sessionId).catch(() => undefined)

  const rotated = await rotateSessionTokens({
    userId: storedToken.user.id,
    username: storedToken.user.username,
    sessionId: payload.sessionId,
    currentRefreshTokenHash: refreshTokenHash,
    ipAddress: getRequestIp(request),
    userAgent: getRequestUserAgent(request),
    deviceFingerprint: await buildDeviceFingerprint(request)
  })

  const response = NextResponse.json({ message: '刷新成功' })
  attachSessionCookies(response, rotated.accessToken, rotated.refreshToken)
  return response
}
