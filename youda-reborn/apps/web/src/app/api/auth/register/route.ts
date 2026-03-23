export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { findUserByEmail, findUserByUsername, createUser } from '@/lib/db';
import { signToken } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { username, email, password } = await request.json();

    if (!username || !email || !password) {
      return NextResponse.json({ error: '请填写所有必填字段' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: '密码长度至少需要 6 个字符' }, { status: 400 });
    }

    const existingEmail = findUserByEmail(email);
    if (existingEmail) {
      return NextResponse.json({ error: '该邮箱已被注册' }, { status: 400 });
    }

    const existingUsername = findUserByUsername(username);
    if (existingUsername) {
      return NextResponse.json({ error: '该用户名已被占用' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = {
      id: Math.random().toString(36).substring(2, 15),
      username,
      email,
      passwordHash,
      unlockedBadges: ['BADGE_005', 'BADGE_006', 'BADGE_007'], // Give some default achievement badges to select from
      badges: [],
      createdAt: new Date().toISOString()
    };

    createUser(newUser);

    const token = await signToken({ id: newUser.id, username: newUser.username });

    const response = NextResponse.json({
      message: '注册成功',
      user: { id: newUser.id, username: newUser.username, email: newUser.email }
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
    console.error('Register error:', error);
    // @ts-ignore
    return NextResponse.json({ error: '服务器内部错误', details: error?.message || String(error) }, { status: 500 });
  }
}
