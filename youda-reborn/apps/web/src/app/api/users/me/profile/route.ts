import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/current-user';
import { updateUser } from '@/lib/db';
import { badRequest, internalServerError, unauthorized } from '@/lib/api-errors';
import { captureRouteException } from '@/lib/monitoring';

export async function PUT(request: Request) {
  let body:
    | { nickname?: string; avatarUrl?: string; personalityCode?: string; unlockedBadges?: string[] }
    | undefined

  try {
    const user = await getAuthenticatedUser(request)
    if (!user) return unauthorized()

    body = await request.json()
    const { nickname, avatarUrl, personalityCode, unlockedBadges } = body ?? {}

    if (unlockedBadges !== undefined && !Array.isArray(unlockedBadges)) {
      return badRequest('徽章解锁列表格式错误')
    }

    const updates: Parameters<typeof updateUser>[1] = {}
    if (nickname !== undefined) updates.nickname = nickname
    if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl
    if (personalityCode !== undefined) updates.personalityCode = personalityCode
    if (unlockedBadges !== undefined) {
      updates.unlockedBadges = Array.from(new Set([...(user.unlockedBadges || []), ...unlockedBadges]))
    }

    await updateUser(user.id, updates)

    return NextResponse.json({ message: '更新成功' });
  } catch (error) {
    await captureRouteException(request, error, {
      event: 'user.profile.update.failed',
      requestBody: body
    })

    return internalServerError(error);
  }
}
