export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { requireRequestContext } from '@/lib/api-session'
import { markMessageRead } from '@/lib/social-store'
import { captureRouteException } from '@/lib/monitoring'
import { internalServerError } from '@/lib/api-errors'

export async function POST(
  request: Request,
  { params }: { params: { messageId: string } }
) {
  try {
    const context = await requireRequestContext(request)
    if (context instanceof Response) {
      return context
    }

    const receipt = await markMessageRead({
      messageId: params.messageId,
      userId: context.user.id,
      ipAddress: context.ipAddress,
      deviceFingerprint: context.deviceFingerprint
    })

    return NextResponse.json({ receipt })
  } catch (error) {
    await captureRouteException(request, error, {
      event: 'social.messages.read.failed'
    })
    return internalServerError(error)
  }
}
