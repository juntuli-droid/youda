import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getUsers, updateUser, Career } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const cookies = request.headers.get('cookie');
    const sessionTokenMatch = cookies?.match(/sessionToken=([^;]+)/);
    const token = sessionTokenMatch ? sessionTokenMatch[1] : null;

    if (!token) return NextResponse.json({ error: '未登录' }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload || !payload.id) return NextResponse.json({ error: '无效的会话' }, { status: 401 });

    const { gameName, hours, rank } = await request.json();
    if (!gameName || hours === undefined || !rank) {
      return NextResponse.json({ error: '请填写所有必填字段' }, { status: 400 });
    }

    const users = getUsers();
    const user = users.find((u) => u.id === payload.id);
    if (!user) return NextResponse.json({ error: '用户不存在' }, { status: 404 });

    const newCareer: Career = {
      id: Math.random().toString(36).substring(2, 15),
      gameName,
      hours: Number(hours),
      rank
    };

    const careers = user.careers || [];
    careers.push(newCareer);

    // Auto-unlock rank badges based on rank logic
    const unlockedBadges = user.unlockedBadges || [];
    const rankMapping: Record<string, string> = {
      '辐射': 'BADGE_012',
      '超凡入圣': 'BADGE_004',
      '大师': 'BADGE_011',
      '钻石': 'BADGE_015',
      '白金': 'BADGE_003',
      '黄金': 'BADGE_013',
      '白银': 'BADGE_002',
      '青铜': 'BADGE_014',
      '黑铁': 'BADGE_001',
    };

    // Very simple auto-unlock logic based on string match
    for (const [key, badgeId] of Object.entries(rankMapping)) {
      if (rank.includes(key) && !unlockedBadges.includes(badgeId)) {
        unlockedBadges.push(badgeId);
      }
    }

    updateUser(user.id, { careers, unlockedBadges });

    return NextResponse.json({ message: '添加成功', career: newCareer, unlockedBadges });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}
