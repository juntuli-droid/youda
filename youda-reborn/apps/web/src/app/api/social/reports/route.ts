export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { badRequest, internalServerError } from '@/lib/api-errors'
import { requireRequestContext } from '@/lib/api-session'
import { captureRouteException } from '@/lib/monitoring'
import { createUserReport } from '@/lib/social-store'
import { logger } from '@/lib/logger'
import { ReportCategory } from '@/lib/db'

const allowedCategories = new Set(Object.values(ReportCategory))

export async function POST(request: Request) {
  let body:
    | {
        reportedUserId?: string
        messageId?: string
        matchId?: string
        category?: ReportCategory
        description?: string
        evidenceUrls?: string[]
      }
    | undefined

  try {
    const context = await requireRequestContext(request)
    if (context instanceof Response) {
      return context
    }

    body = await request.json()

    if (!body?.category || !allowedCategories.has(body.category)) {
      return badRequest('举报类型不合法')
    }

    if (!body.reportedUserId && !body.messageId && !body.matchId) {
      return badRequest('举报对象不能为空')
    }

    const report = await createUserReport({
      reporterId: context.user.id,
      reportedUserId: body.reportedUserId,
      messageId: body.messageId,
      matchId: body.matchId,
      category: body.category,
      description: body.description,
      evidenceUrls: Array.isArray(body.evidenceUrls) ? body.evidenceUrls : [],
      ipAddress: context.ipAddress,
      deviceFingerprint: context.deviceFingerprint
    })

    logger.warn({
      event: 'risk.report.created',
      userId: context.user.id,
      metadata: {
        reportId: report.id,
        category: body.category,
        ipAddress: context.ipAddress,
        deviceFingerprint: context.deviceFingerprint
      }
    })

    return NextResponse.json({
      message: '举报已提交，系统已进入审核队列',
      reportId: report.id,
      reviewSlaHours: 24
    })
  } catch (error) {
    await captureRouteException(request, error, {
      event: 'social.reports.create.failed',
      requestBody: body
    })
    return internalServerError(error)
  }
}
