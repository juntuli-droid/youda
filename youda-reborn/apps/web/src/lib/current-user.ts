import { getUserById, getUserSnapshotById } from '@/lib/db'
import { verifyAccessToken } from '@/lib/auth'

export async function getAuthenticatedUserId(request: Request) {
  const accessToken = request.headers
    .get('cookie')
    ?.match(/sessionToken=([^;]+)/)?.[1]

  if (!accessToken) {
    return null
  }

  const payload = await verifyAccessToken(accessToken)

  if (!payload?.sub) {
    return null
  }

  return payload.sub
}

export async function getAuthenticatedUser(request: Request) {
  const userId = await getAuthenticatedUserId(request)

  if (!userId) {
    return null
  }

  return getUserSnapshotById(userId)
}

export async function getAuthenticatedUserProfile(request: Request) {
  const userId = await getAuthenticatedUserId(request)

  if (!userId) {
    return null
  }

  return getUserById(userId)
}
