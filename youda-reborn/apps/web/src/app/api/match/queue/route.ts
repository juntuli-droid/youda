export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { badRequest, internalServerError, notFound } from '@/lib/api-errors'
import { captureRouteException } from '@/lib/monitoring'
import { enforceRouteRateLimit, requireRequestContext } from '@/lib/api-session'
import {
  cancelMatchQueueEntry,
  enqueueMatchRequest,
  getMatchQueueStatus
} from '@/lib/matchmaking-service'

function serializeEntry(
  entry:
    | Awaited<ReturnType<typeof getMatchQueueStatus>>
    | Awaited<ReturnType<typeof enqueueMatchRequest>>
) {
  if (!entry) {
    return undefined
  }

  if (!('match' in entry)) {
    return {
      queueEntryId: entry.id,
      status: entry.status,
      expiresAt: entry.expiresAt.toISOString()
    }
  }

  return {
    queueEntryId: entry.id,
    status: entry.status,
    expiresAt: entry.expiresAt.toISOString(),
    matchedAt: entry.matchedAt?.toISOString(),
    matchId: entry.matchId ?? undefined,
    roomCode: entry.match?.roomCode ?? undefined,
    roomPersonality: entry.match?.personality ?? undefined,
    matchedUser: entry.matchedUser
      ? {
          id: entry.matchedUser.id,
          displayName: entry.matchedUser.nickname ?? entry.matchedUser.username,
          avatarUrl: entry.matchedUser.avatarUrl ?? undefined
        }
      : undefined
  }
}

export async function POST(request: Request) {
  let body:
    | {
        gameName?: string
        gender?: string
        ageMin?: number
        ageMax?: number
        interests?: string[]
        region?: string
        latitude?: number
        longitude?: number
        priorityScore?: number
      }
    | undefined

  try {
    const context = await requireRequestContext(request)
    if (context instanceof Response) {
      return context
    }

    const routeLimit = await enforceRouteRateLimit({
      key: `match:${context.user.id}:${context.ipAddress}`,
      limit: 12,
      windowSeconds: 60,
      message: '排队操作过于频繁，请稍后再试'
    })
    if (routeLimit) {
      return routeLimit
    }

    body = await request.json()
    if (!body?.gameName) {
      return badRequest('缺少游戏名称')
    }

    const entry = await enqueueMatchRequest({
      userId: context.user.id,
      gameName: body.gameName,
      gender: body.gender,
      ageMin: body.ageMin,
      ageMax: body.ageMax,
      interests: Array.isArray(body.interests) ? body.interests : [],
      region: body.region,
      latitude: body.latitude,
      longitude: body.longitude,
      priorityScore: body.priorityScore
    })

    const latestEntry = await getMatchQueueStatus(entry.id, context.user.id)

    return NextResponse.json(
      serializeEntry(latestEntry ?? entry)
    )
  } catch (error) {
    await captureRouteException(request, error, {
      event: 'match.queue.enqueue.failed',
      requestBody: body
    })
    return internalServerError(error)
  }
}

export async function GET(request: Request) {
  try {
    const context = await requireRequestContext(request)
    if (context instanceof Response) {
      return context
    }

    const entryId = new URL(request.url).searchParams.get('entryId')
    if (!entryId) {
      return badRequest('缺少队列条目 ID')
    }

    const entry = await getMatchQueueStatus(entryId, context.user.id)
    if (!entry) {
      return notFound('匹配条目不存在')
    }

    return NextResponse.json({
      entry: {
        id: entry.id,
        status: entry.status,
        matchedAt: entry.matchedAt?.toISOString(),
        matchId: entry.matchId ?? undefined,
        roomCode: entry.match?.roomCode ?? undefined,
        roomPersonality: entry.match?.personality ?? undefined,
        gameName: entry.gameName,
        matchedUser: entry.matchedUser
          ? {
              id: entry.matchedUser.id,
              displayName: entry.matchedUser.nickname ?? entry.matchedUser.username,
              avatarUrl: entry.matchedUser.avatarUrl ?? undefined
            }
          : undefined
      }
    })
  } catch (error) {
    await captureRouteException(request, error, {
      event: 'match.queue.status.failed'
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

    const entryId = new URL(request.url).searchParams.get('entryId')
    if (!entryId) {
      return badRequest('缺少队列条目 ID')
    }

    const result = await cancelMatchQueueEntry(entryId, context.user.id)
    return NextResponse.json({ result })
  } catch (error) {
    await captureRouteException(request, error, {
      event: 'match.queue.cancel.failed'
    })
    return internalServerError(error)
  }
}
