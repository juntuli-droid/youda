import { getDeviceFingerprint } from '@/lib/auth'

export function getRequestIp(request: Request) {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  )
}

export function getRequestUserAgent(request: Request) {
  return request.headers.get('user-agent') ?? 'unknown'
}

export async function buildDeviceFingerprint(request: Request) {
  const userAgent = getRequestUserAgent(request)

  return getDeviceFingerprint(
    [
      getRequestIp(request),
      userAgent,
      request.headers.get('accept-language') ?? 'unknown-language',
      request.headers.get('sec-ch-ua-platform') ?? 'unknown-platform'
    ].join('|')
  )
}
