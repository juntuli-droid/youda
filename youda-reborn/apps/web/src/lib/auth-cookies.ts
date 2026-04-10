import { NextResponse } from 'next/server'
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from '@/lib/auth'

const cookieBase = {
  httpOnly: true as const,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/'
}

export function attachSessionCookies(
  response: NextResponse,
  accessToken: string,
  refreshToken: string
) {
  response.cookies.set(ACCESS_TOKEN_COOKIE, accessToken, {
    ...cookieBase,
    maxAge: 60 * 15
  })

  response.cookies.set(REFRESH_TOKEN_COOKIE, refreshToken, {
    ...cookieBase,
    maxAge: 60 * 60 * 24 * 30
  })
}

export function clearSessionCookies(response: NextResponse) {
  response.cookies.delete(ACCESS_TOKEN_COOKIE)
  response.cookies.delete(REFRESH_TOKEN_COOKIE)
}
