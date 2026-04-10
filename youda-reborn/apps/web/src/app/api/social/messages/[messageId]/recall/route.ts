export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { requireRequestContext } from '@/lib/api-session'
import { recallMessage } from '@/lib/social-store'
import { captureRouteException } from '@/lib/monitoring'
import { badRequest, internalServerError } from '@/lib/api-errors'

export async function POST(
  request: Request,
  { params }: { params: { messageId: string } }
) {
  let body: { reason?: string } | undefined

  try {
    const context = await requireRequestContext(request)
    if (context instanceof Response) {
      return context
    }

    body = request.headers.get('content-type')?.includes('application/json')
      ? await request.json()
      : undefined

    const result = await recallMessage({
      messageId: params.messageId,
      userId: context.user.id,
      reason: body?.reason,
      ipAddress: context.ipAddress,
      deviceFingerprint: context.deviceFingerprint
    })

    if (result.count === 0) {
      return badRequest('消息不存在或已撤回')
    }

    return NextResponse.json({ message: '消息已撤回' })
  } catch (error) {
    await captureRouteException(request, error, {
      event: 'social.messages.recall.failed',
      requestBody: body
    })
    return internalServerError(error)
  }
}
