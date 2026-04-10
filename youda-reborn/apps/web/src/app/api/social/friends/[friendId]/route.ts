export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { badRequest, internalServerError } from '@/lib/api-errors'
import { requireRequestContext } from '@/lib/api-session'
import { removeFriend } from '@/lib/social-store'
import { captureRouteException } from '@/lib/monitoring'

export async function DELETE(
  request: Request,
  { params }: { params: { friendId: string } }
) {
  let body: { retentionPolicy?: 'PRESERVE' | 'DELETE' } | undefined

  try {
    const context = await requireRequestContext(request)
    if (context instanceof Response) {
      return context
    }

    if (!params.friendId) {
      return badRequest('缺少好友 ID')
    }

    if (request.headers.get('content-type')?.includes('application/json')) {
      body = await request.json()
    }

    const result = await removeFriend({
      userId: context.user.id,
      friendId: params.friendId,
      ipAddress: context.ipAddress,
      deviceFingerprint: context.deviceFingerprint
    })

    return NextResponse.json({
      message: '好友已删除',
      retentionPolicy: body?.retentionPolicy ?? 'FOLLOW_RELATION_POLICY',
      result
    })
  } catch (error) {
    await captureRouteException(request, error, {
      event: 'social.friends.remove.failed',
      requestBody: body
    })
    return internalServerError(error)
  }
}
