import { prisma, Prisma, MatchQueueStatus, MatchStatus } from '@/lib/db'
import { redis } from '@/lib/redis'
import { randomUUID } from 'node:crypto'
import { calculateMbtiCompatibility, MbtiType } from '@youda/game-assets'

const QUEUE_KEY_PREFIX = 'match:queue'
const QUEUE_DETAIL_PREFIX = 'match:detail'
const MATCH_LOCK_PREFIX = 'match:lock'
const MATCH_LOCK_TTL_MS = 5_000

const inMemoryMatchmakingLocks = new Map<string, string>()

type MatchFilterInput = {
  userId: string
  gameName: string
  gender?: string
  ageMin?: number
  ageMax?: number
  interests?: string[]
  region?: string
  latitude?: number
  longitude?: number
  priorityScore?: number
}

const enqueueScript = `
  local queueKey = KEYS[1]
  local detailKey = KEYS[2]
  local member = ARGV[1]
  local score = tonumber(ARGV[2])
  local detail = ARGV[3]
  local ttl = tonumber(ARGV[4])
  redis.call('ZADD', queueKey, score, member)
  redis.call('SET', detailKey, detail, 'EX', ttl)
  return 1
`

function queueKey(gameName: string) {
  return `${QUEUE_KEY_PREFIX}:${gameName}`
}

function detailKey(entryId: string) {
  return `${QUEUE_DETAIL_PREFIX}:${entryId}`
}

function matchLockKey(gameName: string) {
  return `${MATCH_LOCK_PREFIX}:${gameName}`
}

function overlapScore(left: string[], right: string[]) {
  if (left.length === 0 || right.length === 0) {
    return 0
  }

  const rightSet = new Set(right)
  const overlap = left.filter((item) => rightSet.has(item)).length
  return overlap / Math.max(left.length, right.length)
}

function sanitizeInterests(input: unknown) {
  return Array.isArray(input)
    ? input.filter((item): item is string => typeof item === 'string')
    : []
}

function extractMbtiType(interests: string[]) {
  const marker = interests.find((item) => item.startsWith('MBTI:'))
  if (!marker) {
    return undefined
  }

  const value = marker.slice(5).toUpperCase()
  if (!/^[A-Z]{4}$/.test(value)) {
    return undefined
  }

  return value as MbtiType
}

function filterSemanticInterests(interests: string[]) {
  return interests.filter((item) => !item.startsWith('MBTI:'))
}

function computeDistanceScore(leftRegion?: string | null, rightRegion?: string | null) {
  if (!leftRegion || !rightRegion) {
    return 0.3
  }

  return leftRegion === rightRegion ? 1 : 0.2
}

function resolveMatchThreshold(input: {
  queuedCount: number
  waitMs: number
}) {
  if (input.queuedCount <= 2) {
    return 0.55
  }

  if (input.waitMs >= 20_000) {
    return 0.68
  }

  if (input.waitMs >= 10_000) {
    return 0.76
  }

  return 0.85
}

function calculateCompatibility(
  entry: {
    interests: unknown
    region?: string | null
    ageMin?: number | null
    ageMax?: number | null
    gender?: string | null
  },
  candidate: {
    interests: unknown
    region?: string | null
    ageMin?: number | null
    ageMax?: number | null
    gender?: string | null
  }
) {
  const leftInterests = sanitizeInterests(entry.interests)
  const rightInterests = sanitizeInterests(candidate.interests)
  const leftMbtiType = extractMbtiType(leftInterests)
  const rightMbtiType = extractMbtiType(rightInterests)
  const semanticLeftInterests = filterSemanticInterests(leftInterests)
  const semanticRightInterests = filterSemanticInterests(rightInterests)

  const interestScore = overlapScore(semanticLeftInterests, semanticRightInterests)
  const regionScore = computeDistanceScore(entry.region, candidate.region)
  const genderScore =
    entry.gender && candidate.gender && entry.gender === candidate.gender ? 1 : 0.4
  const ageScore =
    entry.ageMin &&
    entry.ageMax &&
    candidate.ageMin &&
    candidate.ageMax &&
    entry.ageMin <= candidate.ageMax &&
    candidate.ageMin <= entry.ageMax
      ? 1
      : 0.3
  const mbtiScore =
    leftMbtiType && rightMbtiType
      ? calculateMbtiCompatibility(leftMbtiType, rightMbtiType).score
      : 0.72

  return Number(
    (
      mbtiScore * 0.45 +
      interestScore * 0.2 +
      regionScore * 0.2 +
      genderScore * 0.05 +
      ageScore * 0.1
    ).toFixed(4)
  )
}

async function writeAuditEvent(actorUserId: string, eventType: 'MATCH_ENQUEUED' | 'MATCH_FOUND' | 'MATCH_CANCELLED', payload: Record<string, unknown>) {
  await prisma.auditEvent.create({
    data: {
      actorUserId,
      eventType,
      payload: payload as Prisma.InputJsonValue
    }
  })
}

async function acquireMatchmakingLock(gameName: string) {
  const key = matchLockKey(gameName)
  const token = randomUUID()

  if (inMemoryMatchmakingLocks.has(key)) {
    return null
  }

  inMemoryMatchmakingLocks.set(key, token)

  try {
    await redis.connect().catch(() => undefined)
    const result = await redis.set(key, token, 'PX', MATCH_LOCK_TTL_MS, 'NX')

    if (result === 'OK') {
      return {
        key,
        token,
        usesRedis: true
      }
    }

    inMemoryMatchmakingLocks.delete(key)
    return null
  } catch {
    return {
      key,
      token,
      usesRedis: false
    }
  }
}

async function releaseMatchmakingLock(lock: Awaited<ReturnType<typeof acquireMatchmakingLock>>) {
  if (!lock) {
    return
  }

  try {
    if (lock.usesRedis) {
      const currentToken = await redis.get(lock.key)
      if (currentToken === lock.token) {
        await redis.del(lock.key)
      }
    }
  } catch {
    // Ignore lock release failures and rely on TTL.
  } finally {
    if (inMemoryMatchmakingLocks.get(lock.key) === lock.token) {
      inMemoryMatchmakingLocks.delete(lock.key)
    }
  }
}

export async function enqueueMatchRequest(input: MatchFilterInput) {
  const expiresAt = new Date(Date.now() + 30_000)
  const dedupeKey = `${input.userId}:${input.gameName}`

  const entry = await prisma.matchQueueEntry.upsert({
    where: { dedupeKey },
    update: {
      gameName: input.gameName,
      gender: input.gender,
      ageMin: input.ageMin,
      ageMax: input.ageMax,
      interests: (input.interests ?? []) as Prisma.InputJsonValue,
      region: input.region,
      latitude: input.latitude,
      longitude: input.longitude,
      priorityScore: input.priorityScore ?? 0,
      status: MatchQueueStatus.QUEUED,
      expiresAt,
      matchedAt: null,
      matchId: null,
      matchedUserId: null
    },
    create: {
      userId: input.userId,
      gameName: input.gameName,
      gender: input.gender,
      ageMin: input.ageMin,
      ageMax: input.ageMax,
      interests: (input.interests ?? []) as Prisma.InputJsonValue,
      region: input.region,
      latitude: input.latitude,
      longitude: input.longitude,
      priorityScore: input.priorityScore ?? 0,
      expiresAt,
      dedupeKey
    }
  })

  try {
    await redis.connect().catch(() => undefined)
    await redis.eval(
      enqueueScript,
      2,
      queueKey(input.gameName),
      detailKey(entry.id),
      entry.id,
      String(Date.now() - (input.priorityScore ?? 0) * 1000),
      JSON.stringify({
        id: entry.id,
        userId: input.userId,
        gameName: input.gameName,
        gender: input.gender,
        ageMin: input.ageMin,
        ageMax: input.ageMax,
        interests: input.interests ?? [],
        region: input.region,
        priorityScore: input.priorityScore ?? 0
      }),
      '30'
    )
  } catch {
    // Fail-open to DB-only matching.
  }

  await writeAuditEvent(input.userId, 'MATCH_ENQUEUED', {
    queueEntryId: entry.id,
    gameName: input.gameName
  })

  return entry
}

export async function runMatchmakingPass(gameName: string) {
  const lock = await acquireMatchmakingLock(gameName)
  if (!lock) {
    return []
  }

  try {
    const queuedEntries = await prisma.matchQueueEntry.findMany({
      where: {
        gameName,
        status: MatchQueueStatus.QUEUED,
        expiresAt: {
          gt: new Date()
        }
      },
      orderBy: [{ priorityScore: 'desc' }, { createdAt: 'asc' }],
      take: 50
    })

    const matches: Array<{ leftId: string; rightId: string; score: number }> = []
    const used = new Set<string>()
    const now = Date.now()

    for (const entry of queuedEntries) {
      if (used.has(entry.id)) {
        continue
      }

      let bestCandidate:
        | {
            id: string
            score: number
          }
        | undefined

      for (const candidate of queuedEntries) {
        if (
          candidate.id === entry.id ||
          used.has(candidate.id) ||
          candidate.userId === entry.userId
        ) {
          continue
        }

        const score = calculateCompatibility(entry, candidate)
        if (!bestCandidate || score > bestCandidate.score) {
          bestCandidate = {
            id: candidate.id,
            score
          }
        }
      }

      if (bestCandidate) {
        const candidateEntry = queuedEntries.find((item) => item.id === bestCandidate.id)
        const threshold = resolveMatchThreshold({
          queuedCount: queuedEntries.length,
          waitMs: Math.max(
            entry.createdAt ? now - entry.createdAt.getTime() : 0,
            candidateEntry?.createdAt ? now - candidateEntry.createdAt.getTime() : 0
          )
        })

        if (bestCandidate.score < threshold) {
          continue
        }

        used.add(entry.id)
        used.add(bestCandidate.id)
        matches.push({
          leftId: entry.id,
          rightId: bestCandidate.id,
          score: bestCandidate.score
        })
      }
    }

    for (const pair of matches) {
      const left = queuedEntries.find((item) => item.id === pair.leftId)
      const right = queuedEntries.find((item) => item.id === pair.rightId)

      if (!left || !right) {
        continue
      }

      const match = await prisma.match.create({
        data: {
          hostUserId: left.userId,
          gameName: left.gameName,
          status: MatchStatus.ACTIVE,
          personality: [
            extractMbtiType(sanitizeInterests(left.interests)),
            extractMbtiType(sanitizeInterests(right.interests))
          ]
            .filter(Boolean)
            .join(' x ') || '智能匹配',
          duration: '30 分钟',
          roomCode: randomUUID().slice(0, 8).toUpperCase()
        }
      })

      await prisma.$transaction([
        prisma.matchQueueEntry.update({
          where: { id: left.id },
          data: {
            status: MatchQueueStatus.MATCHED,
            matchedUserId: right.userId,
            matchId: match.id,
            matchedAt: new Date()
          }
        }),
        prisma.matchQueueEntry.update({
          where: { id: right.id },
          data: {
            status: MatchQueueStatus.MATCHED,
            matchedUserId: left.userId,
            matchId: match.id,
            matchedAt: new Date()
          }
        }),
        prisma.matchLog.create({
          data: {
            queueEntryId: left.id,
            userId: left.userId,
            matchedUserId: right.userId,
            gameName,
            score: pair.score,
            filters: {
              region: left.region,
              interests: left.interests
            } as Prisma.InputJsonValue
          }
        }),
        prisma.matchLog.create({
          data: {
            queueEntryId: right.id,
            userId: right.userId,
            matchedUserId: left.userId,
            gameName,
            score: pair.score,
            filters: {
              region: right.region,
              interests: right.interests
            } as Prisma.InputJsonValue
          }
        })
      ])

      await writeAuditEvent(left.userId, 'MATCH_FOUND', {
        queueEntryId: left.id,
        matchedUserId: right.userId,
        score: pair.score
      })
      await writeAuditEvent(right.userId, 'MATCH_FOUND', {
        queueEntryId: right.id,
        matchedUserId: left.userId,
        score: pair.score
      })
    }

    return matches
  } finally {
    await releaseMatchmakingLock(lock)
  }
}

export async function getMatchQueueStatus(entryId: string, userId: string) {
  const entry = await prisma.matchQueueEntry.findFirst({
    where: {
      id: entryId,
      userId
    },
    include: {
      matchedUser: {
        select: {
          id: true,
          username: true,
          nickname: true,
          avatarUrl: true
        }
      },
      match: true
    }
  })

  if (!entry) {
    return null
  }

  if (entry.status === MatchQueueStatus.QUEUED) {
    await runMatchmakingPass(entry.gameName)
    return prisma.matchQueueEntry.findFirst({
      where: {
        id: entryId,
        userId
      },
      include: {
        matchedUser: {
          select: {
            id: true,
            username: true,
            nickname: true,
            avatarUrl: true
          }
        },
        match: true
      }
    })
  }

  return entry
}

export async function cancelMatchQueueEntry(entryId: string, userId: string) {
  const entry = await prisma.matchQueueEntry.updateMany({
    where: {
      id: entryId,
      userId,
      status: MatchQueueStatus.QUEUED
    },
    data: {
      status: MatchQueueStatus.CANCELLED
    }
  })

  try {
    const existing = await prisma.matchQueueEntry.findFirst({
      where: {
        id: entryId,
        userId
      }
    })

    if (existing) {
      await redis.connect().catch(() => undefined)
      await redis.zrem(queueKey(existing.gameName), entryId)
      await redis.del(detailKey(entryId))
    }
  } catch {
    // Ignore redis failures.
  }

  await writeAuditEvent(userId, 'MATCH_CANCELLED', {
    queueEntryId: entryId
  })

  return entry
}
