export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { badRequest, internalServerError } from '@/lib/api-errors'
import { captureRouteException } from '@/lib/monitoring'
import { getAuthenticatedUserId } from '@/lib/current-user'
import { logEmptyStateEvent } from '@/lib/social-store'

export async function POST(request: Request) {
  let body:
    | {
        scenario?: string
        action?: 'EMPTY_STATE_EXPOSED' | 'EMPTY_STATE_CLICKED'
        locale?: string
        durationMs?: number
      }
    | undefined

  try {
    if (process.env.NODE_ENV !== 'production') {
      return NextResponse.json({ ok: true, skipped: true })
    }

    body = await request.json()
    if (!body?.scenario || !body.action || !body.locale) {
      return badRequest('空态埋点字段缺失')
    }

    const userId = await getAuthenticatedUserId(request)

    await logEmptyStateEvent({
      userId: userId ?? undefined,
      scenario: body.scenario,
      action: body.action,
      locale: body.locale,
      durationMs: body.durationMs
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    await captureRouteException(request, error, {
      event: 'telemetry.empty-state.failed',
      requestBody: body
    })
    return internalServerError(error)
  }
}
