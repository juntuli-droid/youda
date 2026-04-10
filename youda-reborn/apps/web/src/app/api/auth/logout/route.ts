export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { clearSessionCookies } from '@/lib/auth-cookies';
import { hashOpaqueToken, verifyRefreshToken } from '@/lib/auth';
import { revokeLoginSession, revokeRefreshToken } from '@/lib/security-store';

export async function POST(request: Request) {
  const refreshToken = request.headers
    .get('cookie')
    ?.match(/refreshToken=([^;]+)/)?.[1]

  if (refreshToken) {
    const payload = await verifyRefreshToken(refreshToken)
    if (payload?.sub) {
      await revokeRefreshToken(await hashOpaqueToken(refreshToken))
      if (payload.sessionId) {
        await revokeLoginSession(payload.sessionId)
      }
    }
  }

  const response = NextResponse.json({ message: '登出成功' });
  clearSessionCookies(response)
  return response;
}
