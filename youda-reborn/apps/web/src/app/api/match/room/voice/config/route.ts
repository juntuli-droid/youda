export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { requireRequestContext } from '@/lib/api-session'
import { internalServerError } from '@/lib/api-errors'
import { captureRouteException } from '@/lib/monitoring'
import { getRtcIceServers } from '@/lib/rtc-config'

export async function GET(request: Request) {
  try {
    const context = await requireRequestContext(request)
    if (context instanceof Response) {
      return context
    }

    return NextResponse.json({
      iceServers: getRtcIceServers(context.user.id)
    })
  } catch (error) {
    await captureRouteException(request, error, {
      event: 'match.room.voice.config.failed'
    })
    return internalServerError(error)
  }
}
