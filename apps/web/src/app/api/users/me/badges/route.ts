import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getUsers, updateUser } from '@/lib/db';

export async function PUT(request: Request) {
  try {
    const cookies = request.headers.get('cookie');
    const sessionTokenMatch = cookies?.match(/sessionToken=([^;]+)/);
    const token = sessionTokenMatch ? sessionTokenMatch[1] : null;

    if (!token) return NextResponse.json({ error: '未登录' }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload || !payload.id) return NextResponse.json({ error: '无效的会话' }, { status: 401 });

    const { badges } = await request.json(); // array of active badge IDs
    if (!Array.isArray(badges)) {
      return NextResponse.json({ error: '参数错误' }, { status: 400 });
    }

    const users = getUsers();
    const user = users.find((u) => u.id === payload.id);
    if (!user) return NextResponse.json({ error: '用户不存在' }, { status: 404 });

    // Validate that user is only activating badges they have unlocked
    const unlockedBadges = user.unlockedBadges || [];
    const validBadges = badges.filter(id => unlockedBadges.includes(id));

    // Limit to max 3 badges active
    const activeBadges = validBadges.slice(0, 3);

    updateUser(user.id, { badges: activeBadges });

    return NextResponse.json({ message: '更新成功', badges: activeBadges });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}
