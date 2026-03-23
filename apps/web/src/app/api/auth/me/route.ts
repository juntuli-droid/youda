import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getUsers } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const cookies = request.headers.get('cookie');
    const sessionTokenMatch = cookies?.match(/sessionToken=([^;]+)/);
    const token = sessionTokenMatch ? sessionTokenMatch[1] : null;

    if (!token) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload || !payload.id) {
      return NextResponse.json({ error: '无效的会话' }, { status: 401 });
    }

    const users = getUsers();
    const user = users.find((u) => u.id === payload.id);

    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        nickname: user.nickname,
        avatarUrl: user.avatarUrl,
        badges: user.badges || [],
        unlockedBadges: user.unlockedBadges || [],
        careers: user.careers || [],
        vlogs: user.vlogs || []
      }
    });
  } catch (error) {
    console.error('Me error:', error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}
