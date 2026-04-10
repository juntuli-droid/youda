export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getAuthenticatedUser, getAuthenticatedUserProfile } from '@/lib/current-user';
import { captureRouteException } from '@/lib/monitoring';

export async function GET(request: Request) {
  try {
    const includeProfile = new URL(request.url).searchParams.get('include') === 'profile'
    const user = includeProfile
      ? await getAuthenticatedUserProfile(request)
      : await getAuthenticatedUser(request)

    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        publicId: user.publicId,
        nickname: user.nickname,
        avatarUrl: user.avatarUrl,
        personalityCode: user.personalityCode,
        badges: user.badges || [],
        unlockedBadges: user.unlockedBadges || [],
        careers: includeProfile ? user.careers || [] : [],
        vlogs: includeProfile ? user.vlogs || [] : []
      }
    });
  } catch (error) {
    await captureRouteException(request, error, {
      event: 'auth.me.failed'
    })

    return NextResponse.json({ error: '服务器内部错误', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
