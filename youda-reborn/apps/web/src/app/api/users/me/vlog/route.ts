import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getUsers, updateUser, Vlog } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const cookies = request.headers.get('cookie');
    const sessionTokenMatch = cookies?.match(/sessionToken=([^;]+)/);
    const token = sessionTokenMatch ? sessionTokenMatch[1] : null;

    if (!token) return NextResponse.json({ error: '未登录' }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload || !payload.id) return NextResponse.json({ error: '无效的会话' }, { status: 401 });

    const { title, gameName, videoUrl, content, type = 'video' } = await request.json();
    if (!title || !gameName) {
      return NextResponse.json({ error: '请填写所有必填字段' }, { status: 400 });
    }

    const users = getUsers();
    const user = users.find((u) => u.id === payload.id);
    if (!user) return NextResponse.json({ error: '用户不存在' }, { status: 404 });

    const newVlog: Vlog = {
      id: Math.random().toString(36).substring(2, 15),
      title,
      gameName,
      videoUrl,
      content,
      type,
      createdAt: new Date().toISOString()
    };

    const vlogs = user.vlogs || [];
    vlogs.push(newVlog);

    updateUser(user.id, { vlogs });

    return NextResponse.json({ message: '添加成功', vlog: newVlog });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}
