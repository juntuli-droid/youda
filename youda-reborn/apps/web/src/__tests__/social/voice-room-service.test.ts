import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  mockMatchQueueFindFirst,
  mockParticipantUpsert,
  mockParticipantFindMany,
  mockParticipantUpdateMany,
  mockSignalCreate,
  mockSignalFindMany,
  mockSignalDeleteMany,
  mockTransaction
} = vi.hoisted(() => ({
  mockMatchQueueFindFirst: vi.fn(),
  mockParticipantUpsert: vi.fn(),
  mockParticipantFindMany: vi.fn(),
  mockParticipantUpdateMany: vi.fn(),
  mockSignalCreate: vi.fn(),
  mockSignalFindMany: vi.fn(),
  mockSignalDeleteMany: vi.fn(),
  mockTransaction: vi.fn()
}))

vi.mock('@/lib/db', () => ({
  prisma: {
    matchQueueEntry: {
      findFirst: mockMatchQueueFindFirst
    },
    voiceRoomParticipant: {
      upsert: mockParticipantUpsert,
      findMany: mockParticipantFindMany,
      updateMany: mockParticipantUpdateMany
    },
    voiceRoomSignal: {
      create: mockSignalCreate,
      findMany: mockSignalFindMany,
      deleteMany: mockSignalDeleteMany
    },
    $transaction: mockTransaction
  },
  MatchQueueStatus: {
    MATCHED: 'MATCHED'
  },
  VoiceSignalType: {
    JOIN: 'JOIN',
    OFFER: 'OFFER',
    ANSWER: 'ANSWER',
    ICE: 'ICE',
    LEAVE: 'LEAVE'
  },
  Prisma: {}
}))

import {
  joinVoiceRoom,
  leaveVoiceRoom,
  listVoiceRoomState,
  publishVoiceSignal
} from '@/lib/voice-room-service'

describe('voice-room-service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockMatchQueueFindFirst.mockResolvedValue({
      id: 'queue_1',
      matchId: 'match_1',
      userId: 'user_1',
      status: 'MATCHED'
    })
    mockTransaction.mockResolvedValue(undefined)
    mockParticipantUpsert.mockResolvedValue({ id: 'participant_1' })
    mockParticipantUpdateMany.mockResolvedValue({ count: 1 })
    mockSignalDeleteMany.mockResolvedValue({ count: 0 })
    mockSignalCreate.mockResolvedValue({
      id: 'signal_1',
      createdAt: new Date('2026-04-09T10:00:00.000Z')
    })
  })

  it('joins a match voice room and announces the peer', async () => {
    mockParticipantFindMany.mockResolvedValueOnce([
      {
        id: 'participant_1',
        userId: 'user_1',
        peerId: 'peer-a',
        joinedAt: new Date('2026-04-09T10:00:00.000Z'),
        lastSeenAt: new Date('2026-04-09T10:00:00.000Z'),
        user: {
          id: 'user_1',
          username: 'alice',
          nickname: 'Alice',
          avatarUrl: null
        }
      }
    ])

    const result = await joinVoiceRoom({
      matchId: 'match_1',
      userId: 'user_1',
      peerId: 'peer-a',
      ipAddress: '127.0.0.1'
    })

    expect(mockParticipantUpsert).toHaveBeenCalled()
    expect(mockSignalCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          signalType: 'JOIN',
          senderPeerId: 'peer-a'
        })
      })
    )
    expect(result.participants).toHaveLength(1)
  })

  it('returns active peers and pending signals', async () => {
    mockSignalFindMany.mockResolvedValueOnce([
      {
        id: 'signal_1',
        senderId: 'user_2',
        senderPeerId: 'peer-b',
        targetPeerId: 'peer-a',
        signalType: 'OFFER',
        payload: { type: 'offer', sdp: 'mock' },
        createdAt: new Date('2026-04-09T10:00:00.000Z')
      }
    ])
    mockParticipantFindMany.mockResolvedValueOnce([
      {
        id: 'participant_1',
        userId: 'user_1',
        peerId: 'peer-a',
        joinedAt: new Date('2026-04-09T10:00:00.000Z'),
        lastSeenAt: new Date('2026-04-09T10:00:05.000Z'),
        user: {
          id: 'user_1',
          username: 'alice',
          nickname: 'Alice',
          avatarUrl: null
        }
      },
      {
        id: 'participant_2',
        userId: 'user_2',
        peerId: 'peer-b',
        joinedAt: new Date('2026-04-09T10:00:01.000Z'),
        lastSeenAt: new Date('2026-04-09T10:00:05.000Z'),
        user: {
          id: 'user_2',
          username: 'bob',
          nickname: 'Bob',
          avatarUrl: null
        }
      }
    ])

    const result = await listVoiceRoomState({
      matchId: 'match_1',
      userId: 'user_1',
      peerId: 'peer-a'
    })

    expect(mockParticipantUpdateMany).toHaveBeenCalled()
    expect(result.participants).toHaveLength(2)
    expect(result.signals[0]?.signalType).toBe('OFFER')
  })

  it('publishes targeted signaling messages', async () => {
    await publishVoiceSignal({
      matchId: 'match_1',
      userId: 'user_1',
      peerId: 'peer-a',
      signalType: 'ICE',
      targetPeerId: 'peer-b',
      payload: {
        candidate: 'mock-candidate'
      }
    })

    expect(mockSignalCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          signalType: 'ICE',
          targetPeerId: 'peer-b'
        })
      })
    )
  })

  it('marks a peer as left when leaving the room', async () => {
    await leaveVoiceRoom({
      matchId: 'match_1',
      userId: 'user_1',
      peerId: 'peer-a'
    })

    expect(mockParticipantUpdateMany).toHaveBeenCalled()
    expect(mockSignalCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          signalType: 'LEAVE'
        })
      })
    )
  })
})
