export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { findPasswordResetToken, markPasswordResetTokenUsed } from '@/lib/security-store';
import { hashOpaqueToken } from '@/lib/auth';
import { captureRouteException } from '@/lib/monitoring';

export async function POST(request: Request) {
  let body: { token?: string; password?: string } | undefined

  try {
    body = await request.json()
    const { token, password } = body ?? {}

    if (!token || !password) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: '密码长度至少为 8 位' }, { status: 400 })
    }

    const tokenHash = await hashOpaqueToken(token)
    const resetToken = await findPasswordResetToken(tokenHash)

    if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
      return NextResponse.json({ error: '重置链接无效或已过期' }, { status: 400 })
    }

    const passwordHash = await bcrypt.hash(password, 12)

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash }
      }),
      prisma.passwordResetToken.update({
        where: { tokenHash: resetToken.tokenHash },
        data: { usedAt: new Date() }
      })
    ])

    await markPasswordResetTokenUsed(resetToken.tokenHash).catch(() => undefined)

    return NextResponse.json({ message: '密码重置成功' })
  } catch (error) {
    await captureRouteException(request, error, {
      event: 'auth.password.reset.failed',
      requestBody: body
    })

    return NextResponse.json(
      { error: '服务器内部错误', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
