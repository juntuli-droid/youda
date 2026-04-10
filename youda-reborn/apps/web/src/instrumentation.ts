import * as Sentry from '@sentry/nextjs'
import { env } from '@/lib/env'

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('../sentry.server.config')
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    Sentry.init({
      dsn: env.SENTRY_DSN,
      environment: env.APP_ENV,
      tracesSampleRate: 0.01
    })
  }
}
