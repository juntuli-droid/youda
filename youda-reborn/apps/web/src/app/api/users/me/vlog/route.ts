import { NextResponse } from 'next/server';
import { addVlogToUser } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/current-user';
import { badRequest, internalServerError, unauthorized } from '@/lib/api-errors';
import { captureRouteException } from '@/lib/monitoring';

export async function POST(request: Request) {
  let body:
    | { title?: string; gameName?: string; videoUrl?: string; content?: string; type?: 'video' | 'log' }
    | undefined

  try {
    const user = await getAuthenticatedUser(request)
    if (!user) return unauthorized();

    body = await request.json();
    const { title, gameName, videoUrl, content, type = 'video' } = body ?? {};
    if (!title || !gameName) {
      return badRequest('请填写所有必填字段');
    }

    const newVlog = await addVlogToUser(user.id, {
      title,
      gameName,
      videoUrl,
      content,
      type,
      coverUrl: undefined
    });

    return NextResponse.json({ message: '添加成功', vlog: newVlog });
  } catch (error) {
    await captureRouteException(request, error, {
      event: 'user.vlog.create.failed',
      requestBody: body
    })

    return internalServerError(error);
  }
}
