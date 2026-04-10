export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import {
  badRequest,
  conflict,
  internalServerError
} from '@/lib/api-errors'
import { requireRequestContext } from '@/lib/api-session'
import { captureRouteException } from '@/lib/monitoring'
import { getRequestUserAgent } from '@/lib/request-meta'
import {
  joinVoiceRoom,
  leaveVoiceRoom,
  listVoiceRoomState,
  publishVoiceSignal
} from '@/lib/voice-room-service'

export async function GET(request: Request) {
  try {
    const context = await requireRequestContext(request)
    if (context instanceof Response) {
      return context
    }

    const url = new URL(request.url)
    const matchId = url.searchParams.get('matchId')
    const peerId = url.searchParams.get('peerId')
    const since = url.searchParams.get('since')

    if (!matchId || !peerId) {
      return badRequest('缺少房间 ID 或 Peer ID')
    }

    const state = await listVoiceRoomState({
      matchId,
      userId: context.user.id,
      peerId,
      since: since ? new Date(since) : undefined
    })

    return NextResponse.json(state)
  } catch (error) {
    await captureRouteException(request, error, {
      event: 'match.room.voice.state.failed'
    })

    if (error instanceof Error && error.message === 'match_membership_required') {
      return conflict('仅匹配房间成员可以接入语音房')
    }

    return internalServerError(error)
  }
}

export async function POST(request: Request) {
  let body:
    | {
        action?: 'join' | 'signal' | 'leave'
        matchId?: string
        peerId?: string
        signalType?: 'OFFER' | 'ANSWER' | 'ICE'
        targetPeerId?: string
        payload?: Record<string, unknown>
        metadata?: Record<string, unknown>
      }
    | undefined

  try {
    const context = await requireRequestContext(request)
    if (context instanceof Response) {
      return context
    }

    body = await request.json()

    if (!body?.action || !body.matchId || !body.peerId) {
      return badRequest('缺少必要的语音房参数')
    }

    if (body.action === 'join') {
      const result = await joinVoiceRoom({
        matchId: body.matchId,
        userId: context.user.id,
        peerId: body.peerId,
        ipAddress: context.ipAddress,
        userAgent: getRequestUserAgent(request),
        deviceFingerprint: context.deviceFingerprint,
        metadata: body.metadata
      })

      return NextResponse.json(result)
    }

    if (body.action === 'signal') {
      if (!body.signalType) {
        return badRequest('缺少信令类型')
      }

      const result = await publishVoiceSignal({
        matchId: body.matchId,
        userId: context.user.id,
        peerId: body.peerId,
        signalType: body.signalType,
        targetPeerId: body.targetPeerId,
        payload: body.payload
      })

      return NextResponse.json({ signal: result })
    }

    if (body.action === 'leave') {
      await leaveVoiceRoom({
        matchId: body.matchId,
        userId: context.user.id,
        peerId: body.peerId
      })

      return NextResponse.json({ ok: true })
    }

    return badRequest('不支持的语音房动作')
  } catch (error) {
    await captureRouteException(request, error, {
      event: 'match.room.voice.action.failed',
      requestBody: body
    })

    if (error instanceof Error && error.message === 'match_membership_required') {
      return conflict('仅匹配房间成员可以接入语音房')
    }

    return internalServerError(error)
  }
}
