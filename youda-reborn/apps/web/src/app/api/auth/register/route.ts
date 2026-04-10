export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { Prisma, createUser, findUserSnapshotByEmail, findUserSnapshotByUsername } from '@/lib/db';
import { attachSessionCookies } from '@/lib/auth-cookies';
import { createSessionForUser } from '@/lib/session-service';
import { enforceRateLimit } from '@/lib/rate-limit';
import { getRequestIp } from '@/lib/request-meta';
import { captureRouteException } from '@/lib/monitoring';

export async function POST(request: Request) {
  let body:
    | { username?: string; email?: string; password?: string }
    | undefined

  try {
    body = await request.json();
    const { username, email, password } = body ?? {};
    const ipAddress = getRequestIp(request);

    if (!username || !email || !password) {
      return NextResponse.json({ error: '请填写所有必填字段' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: '密码长度至少需要 6 个字符' }, { status: 400 });
    }

    const ipRateLimit = await enforceRateLimit(`register:ip:${ipAddress}`, 5, 60 * 60);
    if (!ipRateLimit.allowed) {
      return NextResponse.json({ error: '注册过于频繁，请稍后再试' }, { status: 429 });
    }

    const accountRateLimit = await enforceRateLimit(`register:email:${email}`, 5, 60 * 60);
    if (!accountRateLimit.allowed) {
      return NextResponse.json({ error: '该账号尝试次数过多，请稍后再试' }, { status: 429 });
    }

    const existingEmail = await findUserSnapshotByEmail(email);
    if (existingEmail) {
      return NextResponse.json({ error: '该邮箱已被注册' }, { status: 400 });
    }

    const existingUsername = await findUserSnapshotByUsername(username);
    if (existingUsername) {
      return NextResponse.json({ error: '该用户名已被占用' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = await createUser({
      username,
      email,
      passwordHash,
      unlockedBadges: ['BADGE_005', 'BADGE_006', 'BADGE_007'],
      badges: []
    });
    const session = await createSessionForUser(newUser, request);

    if (!('accessToken' in session) || !('refreshToken' in session)) {
      return NextResponse.json({ error: '注册成功，但会话初始化失败，请重新登录' }, { status: 202 });
    }

    const response = NextResponse.json({
      message: '注册成功',
      user: { id: newUser.id, username: newUser.username, email: newUser.email }
    });

    attachSessionCookies(response, session.accessToken, session.refreshToken)
    return response;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ error: '邮箱或用户名已存在' }, { status: 409 });
    }

    await captureRouteException(request, error, {
      event: 'auth.register.failed',
      requestBody: body
    })

    return NextResponse.json({ error: '服务器内部错误', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
