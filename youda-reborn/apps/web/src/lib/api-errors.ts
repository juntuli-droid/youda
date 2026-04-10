import { NextResponse } from 'next/server'

export const ErrorCodes = {
  UNAUTHORIZED: 'AUTH_401_UNAUTHORIZED',
  FORBIDDEN: 'AUTH_403_FORBIDDEN',
  INVALID_REQUEST: 'REQ_400_INVALID_REQUEST',
  RATE_LIMITED: 'AUTH_429_RATE_LIMITED',
  INVALID_CREDENTIALS: 'AUTH_401_INVALID_CREDENTIALS',
  LOGIN_CHALLENGE_REQUIRED: 'AUTH_403_LOGIN_CHALLENGE_REQUIRED',
  TOKEN_INVALID: 'AUTH_401_TOKEN_INVALID',
  TOKEN_EXPIRED: 'AUTH_400_TOKEN_EXPIRED',
  CONFLICT: 'DATA_409_CONFLICT',
  NOT_FOUND: 'DATA_404_NOT_FOUND',
  INTERNAL_ERROR: 'SYS_500_INTERNAL_ERROR'
} as const

type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes]

type ErrorResponseInput = {
  code: ErrorCode
  message: string
  status: number
  details?: string
  extra?: Record<string, unknown>
  headers?: HeadersInit
}

export function jsonError(input: ErrorResponseInput) {
  return NextResponse.json(
    {
      error: input.message,
      code: input.code,
      ...(input.details ? { details: input.details } : {}),
      ...(input.extra ?? {})
    },
    {
      status: input.status,
      headers: input.headers
    }
  )
}

export function unauthorized(message = '未登录') {
  return jsonError({
    code: ErrorCodes.UNAUTHORIZED,
    message,
    status: 401
  })
}

export function badRequest(message: string, extra?: Record<string, unknown>) {
  return jsonError({
    code: ErrorCodes.INVALID_REQUEST,
    message,
    status: 400,
    extra
  })
}

export function forbidden(message: string) {
  return jsonError({
    code: ErrorCodes.FORBIDDEN,
    message,
    status: 403
  })
}

export function conflict(message: string) {
  return jsonError({
    code: ErrorCodes.CONFLICT,
    message,
    status: 409
  })
}

export function notFound(message: string) {
  return jsonError({
    code: ErrorCodes.NOT_FOUND,
    message,
    status: 404
  })
}

export function rateLimited(message: string, retryAfterSeconds?: number) {
  return jsonError({
    code: ErrorCodes.RATE_LIMITED,
    message,
    status: 429,
    headers:
      retryAfterSeconds !== undefined
        ? {
            'Retry-After': String(retryAfterSeconds)
          }
        : undefined
  })
}

export function internalServerError(error: unknown) {
  return jsonError({
    code: ErrorCodes.INTERNAL_ERROR,
    message: '服务器内部错误',
    status: 500,
    details: error instanceof Error ? error.message : String(error)
  })
}
