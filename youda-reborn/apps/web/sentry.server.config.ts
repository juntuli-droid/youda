import * as Sentry from '@sentry/nextjs'
import { env } from '@/lib/env'

Sentry.init({
  dsn: env.SENTRY_DSN,
  environment: env.APP_ENV,
  tracesSampleRate: 0.01,
  profilesSampleRate: 0.01
})
