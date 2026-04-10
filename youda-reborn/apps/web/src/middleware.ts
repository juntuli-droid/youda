import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const protectedRoutes = ['/personality', '/profile', '/match']
const accessKey = new TextEncoder().encode(process.env.JWT_SECRET ?? '')

const decodeBase64Url = (value: string) => {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
  return atob(padded)
}

const encodeBase64Url = (value: string) =>
  btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')

async function verifyAccessToken(token: string) {
  const [encodedHeader, encodedPayload, encodedSignature] = token.split('.')

  if (!encodedHeader || !encodedPayload || !encodedSignature) {
    return false
  }

  const header = JSON.parse(decodeBase64Url(encodedHeader)) as {
    alg?: string
    typ?: string
  }

  if (header.alg !== 'HS256') {
    return false
  }

  const payload = JSON.parse(decodeBase64Url(encodedPayload)) as {
    sub?: string
    exp?: number
    type?: string
  }

  if (!payload.sub || payload.type !== 'access') {
    return false
  }

  if (payload.exp && payload.exp * 1000 <= Date.now()) {
    return false
  }

  const signedContent = `${encodedHeader}.${encodedPayload}`
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    accessKey,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign(
    'HMAC',
    cryptoKey,
    new TextEncoder().encode(signedContent)
  )
  const expectedSignature = encodeBase64Url(
    String.fromCharCode(...Array.from(new Uint8Array(signature)))
  )

  return expectedSignature === encodedSignature
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))

  if (!isProtectedRoute) {
    return NextResponse.next()
  }

  const token = request.cookies.get('sessionToken')?.value

  if (!token || !(await verifyAccessToken(token))) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
}
