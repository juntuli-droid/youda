import { getAuthenticatedUser } from '@/lib/current-user'
import { buildDeviceFingerprint, getRequestIp } from '@/lib/request-meta'
import { enforceRateLimit } from '@/lib/rate-limit'
import { rateLimited, unauthorized } from '@/lib/api-errors'

export type AuthenticatedRequestContext = {
  user: NonNullable<Awaited<ReturnType<typeof getAuthenticatedUser>>>
  ipAddress: string
  deviceFingerprint: string
}

export async function requireRequestContext(
  request: Request
): Promise<AuthenticatedRequestContext | Response> {
  const user = await getAuthenticatedUser(request)

  if (!user) {
    return unauthorized()
  }

  return {
    user,
    ipAddress: getRequestIp(request),
    deviceFingerprint: await buildDeviceFingerprint(request)
  }
}

export async function enforceRouteRateLimit(input: {
  key: string
  limit: number
  windowSeconds: number
  message: string
}) {
  const result = await enforceRateLimit(input.key, input.limit, input.windowSeconds)

  if (!result.allowed) {
    return rateLimited(input.message, result.resetSeconds)
  }

  return null
}
