import './env.mjs'
import { withSentryConfig } from '@sentry/nextjs'

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@youda/game-assets', '@youda/database'],
  experimental: {
    optimizePackageImports: ['@youda/game-assets', '@youda/database'],
  },
};

const shouldUploadSentryArtifacts =
  process.env.SENTRY_UPLOAD_ENABLED === 'true' &&
  Boolean(process.env.SENTRY_AUTH_TOKEN) &&
  Boolean(process.env.SENTRY_ORG) &&
  Boolean(process.env.SENTRY_PROJECT)

export default shouldUploadSentryArtifacts
  ? withSentryConfig(nextConfig, {
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  widenClientFileUpload: true
})
  : nextConfig;
