export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { acceptFriendRequest } from '@/lib/social-store'
import { requireRequestContext } from '@/lib/api-session'
import { internalServerError } from '@/lib/api-errors'
import { captureRouteException } from '@/lib/monitoring'

export async function POST(
  request: Request,
  { params }: { params: { friendId: string } }
) {
  try {
    const context = await requireRequestContext(request)
    if (context instanceof Response) {
      return context
    }

    await acceptFriendRequest({
      requesterId: params.friendId,
      accepterId: context.user.id,
      ipAddress: context.ipAddress,
      deviceFingerprint: context.deviceFingerprint
    })

    return NextResponse.json({ message: '已接受好友申请' })
  } catch (error) {
    await captureRouteException(request, error, {
      event: 'social.friends.accept.failed'
    })
    return internalServerError(error)
  }
}
