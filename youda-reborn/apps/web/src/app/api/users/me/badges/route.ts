import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/current-user';
import { updateUser } from '@/lib/db';
import { badRequest, internalServerError, unauthorized } from '@/lib/api-errors';
import { captureRouteException } from '@/lib/monitoring';

export async function PUT(request: Request) {
  let body: { badges?: string[] } | undefined

  try {
    const user = await getAuthenticatedUser(request)
    if (!user) return unauthorized();

    body = await request.json();
    const { badges } = body ?? {}; // array of active badge IDs
    if (!Array.isArray(badges)) {
      return badRequest('参数错误');
    }

    // Validate that user is only activating badges they have unlocked
    const unlockedBadges = user.unlockedBadges || [];
    const validBadges = badges.filter(id => unlockedBadges.includes(id));

    // Limit to max 3 badges active
    const activeBadges = validBadges.slice(0, 3);

    await updateUser(user.id, { badges: activeBadges });

    return NextResponse.json({ message: '更新成功', badges: activeBadges });
  } catch (error) {
    await captureRouteException(request, error, {
      event: 'user.badges.update.failed',
      requestBody: body
    })

    return internalServerError(error);
  }
}
