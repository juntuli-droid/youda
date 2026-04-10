export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { badRequest, conflict, internalServerError } from '@/lib/api-errors'
import { requireRequestContext } from '@/lib/api-session'
import { captureRouteException } from '@/lib/monitoring'
import { listMatchMessages, sendMatchMessage } from '@/lib/social-store'

export async function GET(request: Request) {
  try {
    const context = await requireRequestContext(request)
    if (context instanceof Response) {
      return context
    }

    const url = new URL(request.url)
    const matchId = url.searchParams.get('matchId')
    const since = url.searchParams.get('since')

    if (!matchId) {
      return badRequest('缺少房间 ID')
    }

    const messages = await listMatchMessages({
      userId: context.user.id,
      matchId,
      since: since ? new Date(since) : undefined
    })

    return NextResponse.json({ messages })
  } catch (error) {
    await captureRouteException(request, error, {
      event: 'match.room.messages.list.failed'
    })

    if (error instanceof Error && error.message === 'match_membership_required') {
      return conflict('仅匹配房间成员可以读取消息')
    }

    return internalServerError(error)
  }
}

export async function POST(request: Request) {
  let body:
    | {
        matchId?: string
        content?: string
        contentType?: 'TEXT' | 'IMAGE' | 'VOICE'
        attachmentUrl?: string
        attachmentMeta?: Record<string, unknown>
        clientMessageId?: string
      }
    | undefined

  try {
    const context = await requireRequestContext(request)
    if (context instanceof Response) {
      return context
    }

    body = await request.json()
    if (!body?.matchId || !body.content?.trim()) {
      return badRequest('缺少房间 ID 或消息内容')
    }

    const message = await sendMatchMessage({
      senderId: context.user.id,
      matchId: body.matchId,
      content: body.content.trim(),
      contentType: body.contentType,
      attachmentUrl: body.attachmentUrl,
      attachmentMeta: body.attachmentMeta,
      clientMessageId: body.clientMessageId,
      ipAddress: context.ipAddress,
      deviceFingerprint: context.deviceFingerprint
    })

    return NextResponse.json({ message })
  } catch (error) {
    await captureRouteException(request, error, {
      event: 'match.room.messages.send.failed',
      requestBody: body
    })

    if (error instanceof Error && error.message === 'match_membership_required') {
      return conflict('仅匹配房间成员可以发送消息')
    }

    return internalServerError(error)
  }
}
