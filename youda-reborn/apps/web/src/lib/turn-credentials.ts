import { createHmac } from 'node:crypto'
import { env } from '@/lib/env'

type TurnCredentialBundle = {
  username: string
  credential: string
  ttlSeconds: number
}

export function createTurnCredentialBundle(userId: string): TurnCredentialBundle | null {
  if (!env.TURN_SHARED_SECRET) {
    return null
  }

  const ttlSeconds = env.TURN_CREDENTIAL_TTL_SECONDS ?? 3600
  const expiresAt = Math.floor(Date.now() / 1000) + ttlSeconds
  const username = `${expiresAt}:${userId}`
  const credential = createHmac('sha1', env.TURN_SHARED_SECRET)
    .update(username)
    .digest('base64')

  return {
    username,
    credential,
    ttlSeconds
  }
}
