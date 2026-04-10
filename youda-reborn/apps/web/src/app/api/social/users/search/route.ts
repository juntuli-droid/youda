export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { captureRouteException } from '@/lib/monitoring'
import { enforceRouteRateLimit, requireRequestContext } from '@/lib/api-session'
import { searchUsersForFriendship } from '@/lib/social-store'

export async function GET(request: Request) {
  try {
    const context = await requireRequestContext(request)
    if (context instanceof Response) {
      return context
    }

    const rateLimitResponse = await enforceRouteRateLimit({
      key: `friend-search:${context.user.id}:${context.ipAddress}`,
      limit: 60,
      windowSeconds: 60,
      message: '搜索过于频繁，请稍后再试'
    })

    if (rateLimitResponse) {
      return rateLimitResponse
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')?.trim() ?? ''

    if (query.length < 2) {
      return NextResponse.json({
        results: []
      })
    }

    const results = await searchUsersForFriendship({
      userId: context.user.id,
      query
    })

    return NextResponse.json({
      results
    })
  } catch (error) {
    await captureRouteException(request, error, {
      event: 'social.users.search.failed'
    })

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : '搜索用户失败'
      },
      { status: 500 }
    )
  }
}
