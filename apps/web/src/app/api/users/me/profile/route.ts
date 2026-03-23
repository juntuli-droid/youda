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

    const { nickname, avatarUrl, unlockedBadges } = await request.json(); 

    const users = getUsers();
    const user = users.find((u) => u.id === payload.id);
    if (!user) return NextResponse.json({ error: '用户不存在' }, { status: 404 });

    const updates: Record<string, unknown> = {};
    if (nickname !== undefined) updates.nickname = nickname;
    if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl;
    if (unlockedBadges !== undefined) updates.unlockedBadges = Array.from(new Set([...(user.unlockedBadges || []), ...unlockedBadges]));

    updateUser(user.id, updates);

    return NextResponse.json({ message: '更新成功' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}
