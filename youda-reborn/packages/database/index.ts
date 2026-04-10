import { PrismaClient } from '@prisma/client'
import { performance } from 'node:perf_hooks'

declare global {
  var __youdaPrisma__: PrismaClient | undefined
}

export const prisma =
  globalThis.__youdaPrisma__ ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error']
  })

if (process.env.NODE_ENV !== 'production') {
  globalThis.__youdaPrisma__ = prisma
}

export async function warmDatabaseConnection() {
  await prisma.$connect()
  await prisma.$queryRaw`SELECT 1`
}

export async function benchmarkDatabaseColdStart() {
  const startedAt = performance.now()
  await warmDatabaseConnection()
  const completedAt = performance.now()

  return {
    coldStartMs: Number((completedAt - startedAt).toFixed(2))
  }
}

export * from '@prisma/client'
