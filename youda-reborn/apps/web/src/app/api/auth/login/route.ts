export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { findUserSnapshotByEmail, findUserSnapshotByUsername } from '@/lib/db';
import { attachSessionCookies } from '@/lib/auth-cookies';
import { createSessionForUser } from '@/lib/session-service';
import { enforceRateLimit } from '@/lib/rate-limit';
import { getRequestIp } from '@/lib/request-meta';
import { captureRouteException } from '@/lib/monitoring';

export async function POST(request: Request) {
  let body: { identifier?: string; password?: string } | undefined

  try {
    body = await request.json();
    const { identifier, password } = body ?? {};
    const ipAddress = getRequestIp(request);

    if (!identifier || !password) {
      return NextResponse.json({ error: '请填写账号和密码' }, { status: 400 });
    }

    const ipRateLimit = await enforceRateLimit(`login:ip:${ipAddress}`, 10, 60);
    if (!ipRateLimit.allowed) {
      return NextResponse.json({ error: '登录过于频繁，请稍后再试' }, { status: 429 });
    }

    const accountRateLimit = await enforceRateLimit(`login:account:${identifier}`, 10, 60);
    if (!accountRateLimit.allowed) {
      return NextResponse.json({ error: '该账号尝试次数过多，请稍后再试' }, { status: 429 });
    }

    let user = await findUserSnapshotByEmail(identifier);
    if (!user) {
      user = await findUserSnapshotByUsername(identifier);
    }

    if (!user) {
      return NextResponse.json({ error: '账号或密码错误' }, { status: 401 });
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return NextResponse.json({ error: '账号或密码错误' }, { status: 401 });
    }

    const session = await createSessionForUser(user, request);

    if (session.suspiciousLogin || !('accessToken' in session) || !('refreshToken' in session)) {
      return NextResponse.json({
        error: '检测到新的登录环境，请先前往邮箱完成验证',
        requiresChallenge: true
      }, { status: 403 });
    }

    const response = NextResponse.json({
      message: '登录成功',
      user: { id: user.id, username: user.username, email: user.email }
    });

    attachSessionCookies(response, session.accessToken, session.refreshToken)
    return response;
  } catch (error) {
    await captureRouteException(request, error, {
      event: 'auth.login.failed',
      requestBody: body
    })

    return NextResponse.json({ error: '服务器内部错误', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
