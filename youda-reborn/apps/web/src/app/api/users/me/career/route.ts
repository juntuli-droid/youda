import { NextResponse } from 'next/server';
import { addCareerToUser, updateUser } from '@/lib/db';
import { rankBadgeMatchOrder } from '@/lib/badges';
import { getAuthenticatedUser } from '@/lib/current-user';
import { badRequest, internalServerError, unauthorized } from '@/lib/api-errors';
import { captureRouteException } from '@/lib/monitoring';

export async function POST(request: Request) {
  let body:
    | { gameName?: string; hours?: number | string; rank?: string }
    | undefined

  try {
    const user = await getAuthenticatedUser(request)
    if (!user) return unauthorized();

    body = await request.json();
    const { gameName, hours, rank } = body ?? {};
    if (!gameName || hours === undefined || !rank) {
      return badRequest('请填写所有必填字段');
    }

    const newCareer = await addCareerToUser(user.id, {
      gameName,
      hours: Number(hours),
      rank
    });

    const unlockedBadges = [...(user.unlockedBadges || [])];
    for (const [key, badgeId] of rankBadgeMatchOrder) {
      if (rank.includes(key) && !unlockedBadges.includes(badgeId)) {
        unlockedBadges.push(badgeId);
      }
    }

    await updateUser(user.id, { unlockedBadges });

    return NextResponse.json({ message: '添加成功', career: newCareer, unlockedBadges });
  } catch (error) {
    await captureRouteException(request, error, {
      event: 'user.career.create.failed',
      requestBody: body
    })

    return internalServerError(error);
  }
}
