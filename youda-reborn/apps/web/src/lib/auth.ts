import { JWTPayload, SignJWT, jwtVerify } from 'jose'
import { env } from '@/lib/env'

const accessKey = new TextEncoder().encode(env.JWT_SECRET)
const refreshKey = new TextEncoder().encode(env.JWT_REFRESH_SECRET)

export const ACCESS_TOKEN_COOKIE = 'sessionToken'
export const REFRESH_TOKEN_COOKIE = 'refreshToken'

export type SessionPayload = JWTPayload & {
  sub: string
  username: string
  type: 'access' | 'refresh'
  sessionId?: string
}

export async function signAccessToken(payload: {
  sub: string
  username: string
  sessionId?: string
}) {
  return new SignJWT({
    username: payload.username,
    type: 'access',
    sessionId: payload.sessionId
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(accessKey)
}

export async function signRefreshToken(payload: {
  sub: string
  username: string
  sessionId?: string
}) {
  return new SignJWT({
    username: payload.username,
    type: 'refresh',
    sessionId: payload.sessionId
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(refreshKey)
}

export async function verifyAccessToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, accessKey)
    return payload as SessionPayload
  } catch {
    return null
  }
}

export async function verifyRefreshToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, refreshKey)
    return payload as SessionPayload
  } catch {
    return null
  }
}

export async function verifyToken(token: string) {
  return verifyAccessToken(token)
}

const encoder = new TextEncoder()

const bytesToHex = (bytes: Uint8Array) =>
  Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')

const bytesToBase64Url = (bytes: Uint8Array) =>
  btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join(''))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')

export async function hashOpaqueToken(token: string) {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(token))
  return bytesToHex(new Uint8Array(digest))
}

export function generateOpaqueToken() {
  const bytes = new Uint8Array(48)
  crypto.getRandomValues(bytes)
  return bytesToBase64Url(bytes)
}

export async function getDeviceFingerprint(input: string) {
  return (await hashOpaqueToken(input)).slice(0, 40)
}
