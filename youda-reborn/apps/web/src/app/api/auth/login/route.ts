export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { findUserByEmail, findUserByUsername } from '@/lib/db';
import { signToken } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { identifier, password } = await request.json();

    if (!identifier || !password) {
      return NextResponse.json({ error: '请填写账号和密码' }, { status: 400 });
    }

    // Check if identifier is email or username
    let user = findUserByEmail(identifier);
    if (!user) {
      user = findUserByUsername(identifier);
    }

    if (!user) {
      return NextResponse.json({ error: '账号或密码错误' }, { status: 401 });
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return NextResponse.json({ error: '账号或密码错误' }, { status: 401 });
    }

    const token = await signToken({ id: user.id, username: user.username });

    const response = NextResponse.json({
      message: '登录成功',
      user: { id: user.id, username: user.username, email: user.email }
    });

    response.cookies.set('sessionToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    // @ts-expect-error
    return NextResponse.json({ error: '服务器内部错误', details: error?.message || String(error) }, { status: 500 });
  }
}
