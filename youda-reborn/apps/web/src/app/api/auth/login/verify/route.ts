export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { attachSessionCookies } from '@/lib/auth-cookies';
import { verifyLoginChallenge } from '@/lib/session-service';
import { captureRouteException } from '@/lib/monitoring';

export async function POST(request: Request) {
  let body: { token?: string } | undefined

  try {
    body = await request.json()
    const { token } = body ?? {}

    if (!token) {
      return NextResponse.json({ error: '缺少验证令牌' }, { status: 400 })
    }

    const session = await verifyLoginChallenge(token)

    if (!session) {
      return NextResponse.json({ error: '验证链接无效或已过期' }, { status: 400 })
    }

    const response = NextResponse.json({
      message: '验证成功',
      user: session.user
    })

    attachSessionCookies(response, session.accessToken, session.refreshToken)
    return response
  } catch (error) {
    await captureRouteException(request, error, {
      event: 'auth.login.verify.failed',
      requestBody: body
    })

    return NextResponse.json(
      { error: '服务器内部错误', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
