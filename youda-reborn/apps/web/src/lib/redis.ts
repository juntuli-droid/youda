import Redis from 'ioredis'
import { env } from '@/lib/env'

declare global {
  interface GlobalThis {
    __youdaRedis__?: Redis
  }
}

const globalForRedis = globalThis as typeof globalThis & {
  __youdaRedis__?: Redis
}

export const redis =
  globalForRedis.__youdaRedis__ ??
  new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 1,
    enableReadyCheck: true,
    lazyConnect: true
  })

if (process.env.NODE_ENV !== 'production') {
  globalForRedis.__youdaRedis__ = redis
}
