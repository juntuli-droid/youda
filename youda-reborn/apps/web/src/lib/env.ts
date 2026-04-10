import { z } from 'zod'

const envSchema = z.object({
  APP_ENV: z.enum(['development', 'staging', 'production']),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  APP_BASE_URL: z.string().url(),
  DATABASE_URL: z.string().min(1),
  DIRECT_DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  REDIS_URL: z.string().min(1),
  SENDGRID_API_KEY: z.string().min(1),
  SENDGRID_FROM_EMAIL: z.string().email(),
  SENDGRID_PASSWORD_RESET_TEMPLATE_ID: z.string().min(1).optional(),
  SENDGRID_SUSPICIOUS_LOGIN_TEMPLATE_ID: z.string().min(1).optional(),
  SENDGRID_LOGIN_CHALLENGE_TEMPLATE_ID: z.string().min(1).optional(),
  SENTRY_DSN: z.string().min(1),
  NEXT_PUBLIC_SENTRY_DSN: z.string().min(1),
  SENTRY_ORG: z.string().min(1).optional(),
  SENTRY_PROJECT: z.string().min(1).optional(),
  SENTRY_AUTH_TOKEN: z.string().min(1).optional(),
  SLACK_WEBHOOK_URL: z.string().url().optional(),
  ALERT_EMAIL_TO: z.string().email().optional(),
  RTC_ICE_SERVERS_JSON: z.string().min(1).optional(),
  TURN_SHARED_SECRET: z.string().min(1).optional(),
  TURN_UDP_URL: z.string().min(1).optional(),
  TURN_TLS_URL: z.string().min(1).optional(),
  TURN_CREDENTIAL_TTL_SECONDS: z.coerce.number().int().positive().optional()
})

const parsed = envSchema.safeParse({
  APP_ENV: process.env.APP_ENV,
  NODE_ENV: process.env.NODE_ENV,
  APP_BASE_URL: process.env.APP_BASE_URL,
  DATABASE_URL: process.env.DATABASE_URL,
  DIRECT_DATABASE_URL: process.env.DIRECT_DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  REDIS_URL: process.env.REDIS_URL,
  SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
  SENDGRID_FROM_EMAIL: process.env.SENDGRID_FROM_EMAIL,
  SENDGRID_PASSWORD_RESET_TEMPLATE_ID: process.env.SENDGRID_PASSWORD_RESET_TEMPLATE_ID,
  SENDGRID_SUSPICIOUS_LOGIN_TEMPLATE_ID: process.env.SENDGRID_SUSPICIOUS_LOGIN_TEMPLATE_ID,
  SENDGRID_LOGIN_CHALLENGE_TEMPLATE_ID: process.env.SENDGRID_LOGIN_CHALLENGE_TEMPLATE_ID,
  SENTRY_DSN: process.env.SENTRY_DSN,
  NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
  SENTRY_ORG: process.env.SENTRY_ORG,
  SENTRY_PROJECT: process.env.SENTRY_PROJECT,
  SENTRY_AUTH_TOKEN: process.env.SENTRY_AUTH_TOKEN,
  SLACK_WEBHOOK_URL: process.env.SLACK_WEBHOOK_URL,
  ALERT_EMAIL_TO: process.env.ALERT_EMAIL_TO,
  RTC_ICE_SERVERS_JSON: process.env.RTC_ICE_SERVERS_JSON,
  TURN_SHARED_SECRET: process.env.TURN_SHARED_SECRET,
  TURN_UDP_URL: process.env.TURN_UDP_URL,
  TURN_TLS_URL: process.env.TURN_TLS_URL,
  TURN_CREDENTIAL_TTL_SECONDS: process.env.TURN_CREDENTIAL_TTL_SECONDS
})

if (!parsed.success) {
  throw new Error(`Invalid environment configuration: ${parsed.error.message}`)
}

export const env = parsed.data
