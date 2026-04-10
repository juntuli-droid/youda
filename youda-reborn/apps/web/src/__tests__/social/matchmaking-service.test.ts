import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  mockQueueUpsert,
  mockQueueFindMany,
  mockQueueFindFirst,
  mockQueueUpdate,
  mockMatchCreate,
  mockMatchLogCreate,
  mockAuditCreate,
  mockTransaction,
  mockRedisConnect,
  mockRedisEval,
  mockRedisSet,
  mockRedisGet,
  mockRedisZrem,
  mockRedisDel
} = vi.hoisted(() => ({
  mockQueueUpsert: vi.fn(),
  mockQueueFindMany: vi.fn(),
  mockQueueFindFirst: vi.fn(),
  mockQueueUpdate: vi.fn(),
  mockMatchCreate: vi.fn(),
  mockMatchLogCreate: vi.fn(),
  mockAuditCreate: vi.fn(),
  mockTransaction: vi.fn(),
  mockRedisConnect: vi.fn(),
  mockRedisEval: vi.fn(),
  mockRedisSet: vi.fn(),
  mockRedisGet: vi.fn(),
  mockRedisZrem: vi.fn(),
  mockRedisDel: vi.fn()
}))

vi.mock('@/lib/db', () => ({
  prisma: {
    matchQueueEntry: {
      upsert: mockQueueUpsert,
      findMany: mockQueueFindMany,
      findFirst: mockQueueFindFirst,
      update: mockQueueUpdate,
      updateMany: vi.fn().mockResolvedValue({ count: 1 })
    },
    match: {
      create: mockMatchCreate
    },
    matchLog: {
      create: mockMatchLogCreate
    },
    auditEvent: {
      create: mockAuditCreate
    },
    $transaction: mockTransaction
  },
  Prisma: {},
  MatchQueueStatus: {
    QUEUED: 'QUEUED',
    MATCHED: 'MATCHED',
    CANCELLED: 'CANCELLED'
  },
  MatchStatus: {
    ACTIVE: 'ACTIVE'
  }
}))

vi.mock('@/lib/redis', () => ({
  redis: {
    connect: mockRedisConnect,
    eval: mockRedisEval,
    set: mockRedisSet,
    get: mockRedisGet,
    zrem: mockRedisZrem,
    del: mockRedisDel
  }
}))

import {
  cancelMatchQueueEntry,
  enqueueMatchRequest,
  getMatchQueueStatus,
  runMatchmakingPass
} from '@/lib/matchmaking-service'

describe('matchmaking-service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockQueueUpsert.mockResolvedValue({
      id: 'queue_1',
      status: 'QUEUED',
      expiresAt: new Date('2026-04-09T10:00:30.000Z')
    })
    mockRedisConnect.mockResolvedValue(undefined)
    mockRedisEval.mockResolvedValue(1)
    mockRedisSet.mockResolvedValue('OK')
    mockRedisGet.mockResolvedValue(undefined)
    mockAuditCreate.mockResolvedValue({ id: 'audit_1' })
    mockTransaction.mockResolvedValue(undefined)
    mockMatchLogCreate.mockResolvedValue({ id: 'log_1' })
    mockMatchCreate.mockResolvedValue({ id: 'match_1', roomCode: 'ROOM1234' })
    mockQueueUpdate.mockResolvedValue({ id: 'queue_1', status: 'MATCHED' })
  })

  it('enqueues a user and writes queue detail to redis', async () => {
    const entry = await enqueueMatchRequest({
      userId: 'user_1',
      gameName: '无畏契约',
      interests: ['枪法', '沟通'],
      region: '国服'
    })

    expect(entry.id).toBe('queue_1')
    expect(mockQueueUpsert).toHaveBeenCalled()
    expect(mockRedisEval).toHaveBeenCalled()
    expect(mockAuditCreate).toHaveBeenCalled()
  })

  it('matches two compatible queue entries', async () => {
    mockRedisGet.mockResolvedValueOnce('redis-lock-token')
    mockQueueFindMany.mockResolvedValueOnce([
      {
        id: 'queue_1',
        userId: 'user_1',
        gameName: '无畏契约',
        interests: ['沟通', '枪法'],
        region: '国服',
        ageMin: 18,
        ageMax: 25,
        gender: '不限',
        priorityScore: 2
      },
      {
        id: 'queue_2',
        userId: 'user_2',
        gameName: '无畏契约',
        interests: ['沟通', '枪法'],
        region: '国服',
        ageMin: 20,
        ageMax: 26,
        gender: '不限',
        priorityScore: 1
      }
    ])

    const matches = await runMatchmakingPass('无畏契约')

    expect(matches).toHaveLength(1)
    expect(mockMatchCreate).toHaveBeenCalled()
    expect(mockTransaction).toHaveBeenCalled()
  })

  it('relaxes the threshold when only two players are in queue', async () => {
    mockRedisGet.mockResolvedValueOnce('redis-lock-token')
    mockQueueFindMany.mockResolvedValueOnce([
      {
        id: 'queue_1',
        userId: 'user_1',
        gameName: '无畏契约',
        interests: ['英雄联盟'],
        region: '国服',
        ageMin: null,
        ageMax: null,
        gender: null,
        priorityScore: 1,
        createdAt: new Date('2026-04-09T10:00:00.000Z')
      },
      {
        id: 'queue_2',
        userId: 'user_2',
        gameName: '无畏契约',
        interests: ['中文 (普通话)'],
        region: '国服',
        ageMin: null,
        ageMax: null,
        gender: null,
        priorityScore: 1,
        createdAt: new Date('2026-04-09T10:00:01.000Z')
      }
    ])

    const matches = await runMatchmakingPass('无畏契约')

    expect(matches).toHaveLength(1)
    expect(matches[0]?.score).toBeGreaterThanOrEqual(0.55)
    expect(mockMatchCreate).toHaveBeenCalled()
  })

  it('skips a concurrent matchmaking pass for the same game', async () => {
    mockRedisGet.mockResolvedValueOnce('redis-lock-token')

    let releaseFindMany: (() => void) | undefined
    mockQueueFindMany.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          releaseFindMany = () => resolve([])
        })
    )

    const firstPassPromise = runMatchmakingPass('无畏契约')
    await Promise.resolve()
    await Promise.resolve()
    const secondPassMatches = await runMatchmakingPass('无畏契约')

    expect(secondPassMatches).toEqual([])
    expect(mockQueueFindMany).toHaveBeenCalledTimes(1)

    releaseFindMany?.()
    await firstPassPromise
  })

  it('returns an updated queue entry after a lazy matchmaking pass', async () => {
    mockQueueFindFirst
      .mockResolvedValueOnce({
        id: 'queue_1',
        status: 'QUEUED',
        gameName: '无畏契约'
      })
      .mockResolvedValueOnce({
        id: 'queue_1',
        status: 'MATCHED',
        matchedUser: { id: 'user_2', username: 'bob', nickname: 'Bob', avatarUrl: null },
        match: { id: 'match_1', roomCode: 'ROOM1234' }
      })
    mockQueueFindMany.mockResolvedValueOnce([])

    const entry = await getMatchQueueStatus('queue_1', 'user_1')

    expect(entry?.status).toBe('MATCHED')
  })

  it('cancels a queue entry and clears redis detail', async () => {
    mockQueueFindFirst.mockResolvedValueOnce({
      id: 'queue_1',
      userId: 'user_1',
      gameName: '无畏契约'
    })

    await cancelMatchQueueEntry('queue_1', 'user_1')

    expect(mockRedisZrem).toHaveBeenCalled()
    expect(mockRedisDel).toHaveBeenCalled()
    expect(mockAuditCreate).toHaveBeenCalled()
  })
})
