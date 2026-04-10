import { redis } from '@/lib/redis'

type RateLimitResult = {
  allowed: boolean
  remaining: number
  resetSeconds: number
}

export async function enforceRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  if (process.env.NODE_ENV !== 'production') {
    return {
      allowed: true,
      remaining: limit,
      resetSeconds: windowSeconds
    }
  }

  try {
    await redis.connect().catch(() => undefined)

    const current = await redis.incr(key)

    if (current === 1) {
      await redis.expire(key, windowSeconds)
    }

    const ttl = await redis.ttl(key)
    const remaining = Math.max(limit - current, 0)

    return {
      allowed: current <= limit,
      remaining,
      resetSeconds: ttl > 0 ? ttl : windowSeconds
    }
  } catch {
    return {
      allowed: true,
      remaining: limit,
      resetSeconds: windowSeconds
    }
  }
}
