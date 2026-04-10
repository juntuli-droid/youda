import * as Sentry from '@sentry/nextjs'
import { logger } from '@/lib/logger'
import { getRequestIp, getRequestUserAgent } from '@/lib/request-meta'

type CaptureRouteExceptionInput = {
  event: string
  userId?: string
  requestBody?: unknown
  metadata?: Record<string, unknown>
}

export async function captureRouteException(
  request: Request,
  error: unknown,
  input: CaptureRouteExceptionInput
) {
  const errorMessage = error instanceof Error ? error.message : String(error)
  const path = new URL(request.url).pathname

  Sentry.withScope((scope) => {
    scope.setTag('route.event', input.event)
    scope.setTag('route.path', path)
    scope.setContext('request', {
      method: request.method,
      path,
      ipAddress: getRequestIp(request),
      userAgent: getRequestUserAgent(request),
      body: input.requestBody
    })

    if (input.userId) {
      scope.setUser({ id: input.userId })
    }

    if (input.metadata) {
      scope.setContext('metadata', input.metadata)
    }

    Sentry.captureException(error)
  })

  logger.error({
    event: input.event,
    userId: input.userId,
    path,
    method: request.method,
    metadata: {
      ...input.metadata,
      requestBody: input.requestBody,
      error: errorMessage
    }
  })
}
