import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  test: {
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: [
        'src/app/api/auth/login/route.ts',
        'src/app/api/auth/login/verify/route.ts',
        'src/app/api/auth/logout/route.ts',
        'src/app/api/auth/password/forgot/route.ts',
        'src/app/api/auth/password/reset/route.ts',
        'src/app/api/auth/refresh/route.ts',
        'src/app/api/auth/register/route.ts',
        'src/lib/friendships.ts'
      ],
      thresholds: {
        branches: 90,
        functions: 90,
        lines: 90,
        statements: 90
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})
