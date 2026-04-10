export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { badRequest, internalServerError } from '@/lib/api-errors'
import { requireRequestContext } from '@/lib/api-session'
import { blockUser, listBlockedUsers, unblockUser } from '@/lib/social-store'
import { captureRouteException } from '@/lib/monitoring'
import { logger } from '@/lib/logger'

export async function GET(request: Request) {
  try {
    const context = await requireRequestContext(request)
    if (context instanceof Response) {
      return context
    }

    const blockList = await listBlockedUsers(context.user.id)
    return NextResponse.json({
      blockedUsers: blockList.map((item) => ({
        id: item.id,
        blockedId: item.blockedId,
        displayName: item.blocked.nickname ?? item.blocked.username,
        avatarUrl: item.blocked.avatarUrl ?? undefined,
        reason: item.reason ?? undefined,
        createdAt: item.createdAt.toISOString()
      }))
    })
  } catch (error) {
    await captureRouteException(request, error, {
      event: 'social.blocks.list.failed'
    })
    return internalServerError(error)
  }
}

export async function POST(request: Request) {
  let body: { blockedId?: string; reason?: string } | undefined

  try {
    const context = await requireRequestContext(request)
    if (context instanceof Response) {
      return context
    }

    body = await request.json()
    if (!body?.blockedId) {
      return badRequest('缺少被拉黑用户 ID')
    }

    const relation = await blockUser({
      blockerId: context.user.id,
      blockedId: body.blockedId,
      reason: body.reason,
      ipAddress: context.ipAddress,
      deviceFingerprint: context.deviceFingerprint
    })

    logger.warn({
      event: 'risk.block.created',
      userId: context.user.id,
      metadata: {
        blockedId: body.blockedId,
        ipAddress: context.ipAddress,
        deviceFingerprint: context.deviceFingerprint
      }
    })

    return NextResponse.json({ relation })
  } catch (error) {
    await captureRouteException(request, error, {
      event: 'social.blocks.create.failed',
      requestBody: body
    })
    return internalServerError(error)
  }
}

export async function DELETE(request: Request) {
  try {
    const context = await requireRequestContext(request)
    if (context instanceof Response) {
      return context
    }

    const blockedId = new URL(request.url).searchParams.get('blockedId')
    if (!blockedId) {
      return badRequest('缺少被拉黑用户 ID')
    }

    const result = await unblockUser({
      blockerId: context.user.id,
      blockedId,
      ipAddress: context.ipAddress,
      deviceFingerprint: context.deviceFingerprint
    })

    return NextResponse.json({ result })
  } catch (error) {
    await captureRouteException(request, error, {
      event: 'social.blocks.delete.failed'
    })
    return internalServerError(error)
  }
}
