import { env } from '@/lib/env'
import { createTurnCredentialBundle } from '@/lib/turn-credentials'

type SerializableIceServer = {
  urls: string[]
  username?: string
  credential?: string
}

function normalizeIceServer(input: unknown): SerializableIceServer | null {
  if (!input || typeof input !== 'object' || !('urls' in input)) {
    return null
  }

  const candidate = input as {
    urls?: unknown
    username?: unknown
    credential?: unknown
  }
  const urls = candidate.urls
  const normalizedUrls = Array.isArray(urls)
    ? urls.filter((item): item is string => typeof item === 'string' && item.length > 0)
    : typeof urls === 'string'
      ? [urls]
      : []

  if (normalizedUrls.length === 0) {
    return null
  }

  const username = typeof candidate.username === 'string' ? candidate.username : undefined
  const credential =
    typeof candidate.credential === 'string' ? candidate.credential : undefined

  return {
    urls: normalizedUrls,
    username,
    credential
  }
}

function getStaticIceServers(): RTCIceServer[] {
  if (!env.RTC_ICE_SERVERS_JSON) {
    return [{ urls: ['stun:stun.l.google.com:19302'] }]
  }

  try {
    const parsed = JSON.parse(env.RTC_ICE_SERVERS_JSON) as unknown
    if (!Array.isArray(parsed)) {
      return [{ urls: ['stun:stun.l.google.com:19302'] }]
    }

    const servers = parsed
      .map((item) => normalizeIceServer(item))
      .filter((item): item is SerializableIceServer => Boolean(item))

    return servers.length > 0
      ? servers
      : [{ urls: ['stun:stun.l.google.com:19302'] }]
  } catch {
    return [{ urls: ['stun:stun.l.google.com:19302'] }]
  }
}

export function getRtcIceServers(userId?: string): RTCIceServer[] {
  const staticServers = getStaticIceServers()
  if (!userId) {
    return staticServers
  }

  const turnBundle = createTurnCredentialBundle(userId)
  if (!turnBundle) {
    return staticServers
  }

  const turnUrls = [env.TURN_UDP_URL, env.TURN_TLS_URL].filter(
    (item): item is string => Boolean(item)
  )

  if (turnUrls.length === 0) {
    return staticServers
  }

  return [
    ...staticServers,
    {
      urls: turnUrls,
      username: turnBundle.username,
      credential: turnBundle.credential
    }
  ]
}
