export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { captureRouteException } from '@/lib/monitoring'
import { badRequest, internalServerError } from '@/lib/api-errors'
import { enforceRouteRateLimit, requireRequestContext } from '@/lib/api-session'
import { findUserByPublicId, findUserByUsername, getUserById } from '@/lib/db'
import {
  createFriendRequest,
  listFriendsForUser,
  listPendingFriendRequestsForUser
} from '@/lib/social-store'

export async function GET(request: Request) {
  try {
    const context = await requireRequestContext(request)
    if (context instanceof Response) {
      return context
    }

    const [friends, pendingRequests] = await Promise.all([
      listFriendsForUser(context.user.id),
      listPendingFriendRequestsForUser(context.user.id)
    ])

    return NextResponse.json({
      friends,
      pendingRequests: pendingRequests.map((item) => ({
        id: item.id,
        requesterId: item.userId,
        requester: {
          id: item.user.id,
          publicId: item.user.publicId,
          displayName: item.user.nickname ?? item.user.username,
          avatarUrl: item.user.avatarUrl ?? undefined
        },
        createdAt: item.createdAt.toISOString()
      }))
    })
  } catch (error) {
    await captureRouteException(request, error, {
      event: 'social.friends.list.failed'
    })
    return internalServerError(error)
  }
}

export async function POST(request: Request) {
  let body: { friendId?: string; friendPublicId?: string; identifier?: string } | undefined
  let currentUserId: string | undefined

  try {
    const context = await requireRequestContext(request)
    if (context instanceof Response) {
      return context
    }
    currentUserId = context.user.id

    const rateLimitResponse = await enforceRouteRateLimit({
      key: `friend-request:${context.user.id}:${context.ipAddress}`,
      limit: 20,
      windowSeconds: 60 * 60,
      message: '好友申请过于频繁，请稍后再试'
    })

    if (rateLimitResponse) {
      return rateLimitResponse
    }

    body = await request.json()
    const rawIdentifier = body?.friendId ?? body?.friendPublicId ?? body?.identifier
    const trimmedIdentifier = rawIdentifier?.trim()

    if (!trimmedIdentifier) {
      return badRequest('缺少好友 ID 或有搭 ID')
    }

    const targetUser =
      (await getUserById(trimmedIdentifier)) ??
      (await findUserByPublicId(trimmedIdentifier)) ??
      (await findUserByUsername(trimmedIdentifier))

    if (!targetUser) {
      return NextResponse.json({ error: '没有找到这个用户，请检查有搭 ID 或用户名' }, { status: 404 })
    }

    const friendship = await createFriendRequest({
      userId: context.user.id,
      friendId: targetUser.id,
      ipAddress: context.ipAddress,
      deviceFingerprint: context.deviceFingerprint
    })

    return NextResponse.json({
      message: '好友申请已发送',
      friendship
    })
  } catch (error) {
    await captureRouteException(request, error, {
      event: 'social.friends.create.failed',
      userId: currentUserId,
      requestBody: body
    })

    if (error instanceof Error && error.message === 'blocked') {
      return NextResponse.json({ error: '对方在你的黑名单关系中，无法添加好友' }, { status: 403 })
    }

    if (error instanceof Error && error.message === 'cannot friend self') {
      return badRequest('不能添加自己为好友')
    }

    if (error instanceof Error && error.message === 'already_friends') {
      return NextResponse.json({ error: '你们已经是好友了' }, { status: 409 })
    }

    if (error instanceof Error && error.message === 'request_pending') {
      return NextResponse.json({ error: '好友申请已经发出，等对方通过即可' }, { status: 409 })
    }

    if (error instanceof Error && error.message === 'pending_incoming') {
      return NextResponse.json({ error: '对方已经向你发起申请，去待处理列表里接受即可' }, { status: 409 })
    }

    return internalServerError(error)
  }
}
