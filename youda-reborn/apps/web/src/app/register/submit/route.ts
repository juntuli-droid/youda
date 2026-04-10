export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import { Prisma, createUser, findUserSnapshotByEmail, findUserSnapshotByUsername } from '@/lib/db';
import { attachSessionCookies } from '@/lib/auth-cookies';
import { createSessionForUser } from '@/lib/session-service';
import { enforceRateLimit } from '@/lib/rate-limit';
import { getRequestIp } from '@/lib/request-meta';
import { captureRouteException } from '@/lib/monitoring';

const buildRedirect = (request: Request, input: {
  callbackUrl?: string;
  error?: string;
  username?: string;
  email?: string;
}) => {
  const url = new URL('/register', request.url);

  if (input.callbackUrl) {
    url.searchParams.set('callbackUrl', input.callbackUrl);
  }

  if (input.error) {
    url.searchParams.set('error', input.error);
  }

  if (input.username) {
    url.searchParams.set('username', input.username);
  }

  if (input.email) {
    url.searchParams.set('email', input.email);
  }

  return NextResponse.redirect(url, { status: 303 });
};

export async function POST(request: Request) {
  let body:
    | {
        username?: string;
        email?: string;
        password?: string;
        confirmPassword?: string;
        callbackUrl?: string;
      }
    | undefined;

  try {
    const formData = await request.formData();
    body = {
      username: String(formData.get('username') ?? '').trim(),
      email: String(formData.get('email') ?? '').trim(),
      password: String(formData.get('password') ?? ''),
      confirmPassword: String(formData.get('confirmPassword') ?? ''),
      callbackUrl: String(formData.get('callbackUrl') ?? '/personality')
    };

    const { username, email, password, confirmPassword, callbackUrl } = body;
    const ipAddress = getRequestIp(request);

    if (!username || !email || !password || !confirmPassword) {
      return buildRedirect(request, {
        callbackUrl,
        username,
        email,
        error: '请填写所有必填字段'
      });
    }

    if (password !== confirmPassword) {
      return buildRedirect(request, {
        callbackUrl,
        username,
        email,
        error: '两次输入的密码不一致'
      });
    }

    if (password.length < 6) {
      return buildRedirect(request, {
        callbackUrl,
        username,
        email,
        error: '密码长度至少需要 6 个字符'
      });
    }

    const ipRateLimit = await enforceRateLimit(`register:ip:${ipAddress}`, 5, 60 * 60);
    if (!ipRateLimit.allowed) {
      return buildRedirect(request, {
        callbackUrl,
        username,
        email,
        error: '注册过于频繁，请稍后再试'
      });
    }

    const accountRateLimit = await enforceRateLimit(`register:email:${email}`, 5, 60 * 60);
    if (!accountRateLimit.allowed) {
      return buildRedirect(request, {
        callbackUrl,
        username,
        email,
        error: '该账号尝试次数过多，请稍后再试'
      });
    }

    const existingEmail = await findUserSnapshotByEmail(email);
    if (existingEmail) {
      return buildRedirect(request, {
        callbackUrl,
        username,
        email,
        error: '该邮箱已被注册'
      });
    }

    const existingUsername = await findUserSnapshotByUsername(username);
    if (existingUsername) {
      return buildRedirect(request, {
        callbackUrl,
        username,
        email,
        error: '该用户名已被占用'
      });
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
      return buildRedirect(request, {
        callbackUrl,
        username,
        email,
        error: '注册成功，但会话初始化失败，请重新登录'
      });
    }

    const targetUrl = new URL(callbackUrl || '/personality', request.url);
    const response = NextResponse.redirect(targetUrl, { status: 303 });
    attachSessionCookies(response, session.accessToken, session.refreshToken);
    return response;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return buildRedirect(request, {
        callbackUrl: body?.callbackUrl,
        username: body?.username,
        email: body?.email,
        error: '邮箱或用户名已存在'
      });
    }

    await captureRouteException(request, error, {
      event: 'auth.register.form.failed',
      requestBody: body
    });

    return buildRedirect(request, {
      callbackUrl: body?.callbackUrl,
      username: body?.username,
      email: body?.email,
      error: error instanceof Error ? error.message : '服务器内部错误'
    });
  }
}
