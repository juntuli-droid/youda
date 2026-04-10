export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createPasswordResetToken } from '@/lib/security-store';
import { findUserSnapshotByEmail } from '@/lib/db';
import { generateOpaqueToken, hashOpaqueToken } from '@/lib/auth';
import { sendPasswordResetEmail } from '@/lib/mailer';
import { env } from '@/lib/env';
import { captureRouteException } from '@/lib/monitoring';

export async function POST(request: Request) {
  let body: { email?: string } | undefined

  try {
    body = await request.json()
    const { email } = body ?? {}

    if (!email) {
      return NextResponse.json({ error: '邮箱不能为空' }, { status: 400 })
    }

    const user = await findUserSnapshotByEmail(email)

    if (!user) {
      return NextResponse.json({ message: '如果邮箱存在，我们已发送重置邮件' })
    }

    const rawToken = generateOpaqueToken()
    const tokenHash = await hashOpaqueToken(rawToken)

    await createPasswordResetToken({
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + 1000 * 60 * 15)
    })

    const resetUrl = `${env.APP_BASE_URL}/reset-password?token=${rawToken}`
    await sendPasswordResetEmail(user.email, resetUrl)

    return NextResponse.json({ message: '如果邮箱存在，我们已发送重置邮件' })
  } catch (error) {
    await captureRouteException(request, error, {
      event: 'auth.password.forgot.failed',
      requestBody: body
    })

    return NextResponse.json(
      { error: '服务器内部错误', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
