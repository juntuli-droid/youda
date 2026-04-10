export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { badRequest, conflict, forbidden, internalServerError } from '@/lib/api-errors'
import { captureRouteException } from '@/lib/monitoring'
import { enforceRouteRateLimit, requireRequestContext } from '@/lib/api-session'
import { listConversationMessages, sendDirectMessage } from '@/lib/social-store'

export async function GET(request: Request) {
  try {
    const context = await requireRequestContext(request)
    if (context instanceof Response) {
      return context
    }

    const url = new URL(request.url)
    const peerId = url.searchParams.get('peerId')
    const limit = Number(url.searchParams.get('limit') ?? '50')
    const since = url.searchParams.get('since')

    if (!peerId) {
      return badRequest('缺少聊天对象 ID')
    }

    const messages = await listConversationMessages({
      userId: context.user.id,
      peerId,
      limit: Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 200) : 50,
      since: since ? new Date(since) : undefined
    })

    return NextResponse.json({ messages })
  } catch (error) {
    await captureRouteException(request, error, {
      event: 'social.messages.list.failed'
    })
    return internalServerError(error)
  }
}

export async function POST(request: Request) {
  let body:
    | {
        receiverId?: string
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

    const routeLimit = await enforceRouteRateLimit({
      key: `message:${context.user.id}:${context.ipAddress}:${context.deviceFingerprint}`,
      limit: 120,
      windowSeconds: 60,
      message: '消息发送过于频繁，请稍后再试'
    })
    if (routeLimit) {
      return routeLimit
    }

    body = await request.json()

    if (!body?.receiverId || !body.content?.trim()) {
      return badRequest('缺少聊天对象或消息内容')
    }

    const message = await sendDirectMessage({
      senderId: context.user.id,
      receiverId: body.receiverId,
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
      event: 'social.messages.send.failed',
      requestBody: body
    })

    if (error instanceof Error && error.message === 'blocked') {
      return forbidden('拉黑关系下无法发送消息')
    }

    if (error instanceof Error && error.message === 'friendship_required') {
      return conflict('仅支持已建立好友关系的用户私聊')
    }

    if (
      error instanceof Error &&
      /Unique constraint failed|duplicate/i.test(error.message)
    ) {
      return conflict('客户端消息 ID 已存在')
    }

    return internalServerError(error)
  }
}
