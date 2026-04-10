import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  mockBlockFindFirst,
  mockBlockFindMany,
  mockFriendFindMany,
  mockFriendFindFirst,
  mockFriendUpsert,
  mockChatMessageFindMany,
  mockChatMessageCreate,
  mockChatMessageReceiptFindMany,
  mockChatMessageReceiptUpsert,
  mockUserFindMany,
  mockAuditCreate
} = vi.hoisted(() => ({
  mockBlockFindFirst: vi.fn(),
  mockBlockFindMany: vi.fn(),
  mockFriendFindMany: vi.fn(),
  mockFriendFindFirst: vi.fn(),
  mockFriendUpsert: vi.fn(),
  mockChatMessageFindMany: vi.fn(),
  mockChatMessageCreate: vi.fn(),
  mockChatMessageReceiptFindMany: vi.fn(),
  mockChatMessageReceiptUpsert: vi.fn(),
  mockUserFindMany: vi.fn(),
  mockAuditCreate: vi.fn()
}))

vi.mock('@/lib/db', () => ({
  prisma: {
    blockRelation: {
      findFirst: mockBlockFindFirst,
      findMany: mockBlockFindMany
    },
    friend: {
      findMany: mockFriendFindMany,
      findFirst: mockFriendFindFirst,
      upsert: mockFriendUpsert
    },
    chatMessage: {
      findMany: mockChatMessageFindMany,
      create: mockChatMessageCreate
    },
    chatMessageReceipt: {
      findMany: mockChatMessageReceiptFindMany,
      upsert: mockChatMessageReceiptUpsert
    },
    user: {
      findMany: mockUserFindMany
    },
    auditEvent: {
      create: mockAuditCreate
    }
  },
  Prisma: {},
  FriendStatus: {
    ACCEPTED: 'ACCEPTED',
    PENDING: 'PENDING'
  },
  MessageContentType: {
    TEXT: 'TEXT'
  },
  ReportCategory: {
    OTHER: 'OTHER'
  }
}))

vi.mock('@/lib/friendships', () => ({
  deleteFriendship: vi.fn()
}))

import {
  createFriendRequest,
  listConversationMessages,
  listFriendsForUser,
  markMessageRead,
  sendDirectMessage
} from '@/lib/social-store'

describe('social-store', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockBlockFindFirst.mockResolvedValue(null)
    mockBlockFindMany.mockResolvedValue([])
    mockFriendFindMany.mockResolvedValue([])
    mockFriendFindFirst.mockResolvedValue({ id: 'friendship_1' })
    mockFriendUpsert.mockResolvedValue({ id: 'friendship_1' })
    mockChatMessageFindMany.mockResolvedValue([])
    mockChatMessageCreate.mockResolvedValue({
      id: 'message_1',
      receipts: [{ userId: 'user_2', deliveredAt: new Date('2026-04-09T10:00:00.000Z') }]
    })
    mockChatMessageReceiptFindMany.mockResolvedValue([])
    mockChatMessageReceiptUpsert.mockResolvedValue({
      id: 'receipt_1',
      userId: 'user_1'
    })
    mockUserFindMany.mockResolvedValue([])
    mockAuditCreate.mockResolvedValue({ id: 'audit_1' })
  })

  it('filters blocked users from friend list', async () => {
    mockBlockFindMany.mockResolvedValueOnce([
      { blockerId: 'user_1', blockedId: 'user_3' }
    ])
    mockFriendFindMany.mockResolvedValueOnce([
      {
        id: 'friendship_1',
        userId: 'user_1',
        friendId: 'user_2',
        user: { id: 'user_1' },
        friend: {
          id: 'user_2',
          username: 'alice',
          nickname: 'Alice',
          avatarUrl: null,
          lastLoginAt: new Date('2026-04-09T10:00:00.000Z')
        }
      },
      {
        id: 'friendship_2',
        userId: 'user_1',
        friendId: 'user_3',
        user: { id: 'user_1' },
        friend: {
          id: 'user_3',
          username: 'bob',
          nickname: 'Bob',
          avatarUrl: null,
          lastLoginAt: null
        }
      }
    ])

    await expect(listFriendsForUser('user_1')).resolves.toEqual([
      expect.objectContaining({
        counterpartUserId: 'user_2',
        displayName: 'Alice',
        status: 'online'
      })
    ])
  })

  it('deduplicates reciprocal friendships and carries unread counts', async () => {
    mockFriendFindMany.mockResolvedValueOnce([
      {
        id: 'friendship_1',
        userId: 'user_1',
        friendId: 'user_2',
        user: {
          id: 'user_1',
          username: 'self',
          nickname: 'Self',
          avatarUrl: null,
          publicId: 'YDSELF001',
          lastLoginAt: new Date('2026-04-09T10:00:00.000Z')
        },
        friend: {
          id: 'user_2',
          username: 'alice',
          nickname: 'Alice',
          avatarUrl: null,
          publicId: 'YDALICE01',
          lastLoginAt: new Date('2026-04-09T10:00:00.000Z')
        }
      },
      {
        id: 'friendship_2',
        userId: 'user_2',
        friendId: 'user_1',
        user: {
          id: 'user_2',
          username: 'alice',
          nickname: 'Alice',
          avatarUrl: null,
          publicId: 'YDALICE01',
          lastLoginAt: new Date('2026-04-09T10:00:00.000Z')
        },
        friend: {
          id: 'user_1',
          username: 'self',
          nickname: 'Self',
          avatarUrl: null,
          publicId: 'YDSELF001',
          lastLoginAt: new Date('2026-04-09T10:00:00.000Z')
        }
      }
    ])
    mockChatMessageReceiptFindMany.mockResolvedValueOnce([
      { message: { senderId: 'user_2' } },
      { message: { senderId: 'user_2' } }
    ])

    await expect(listFriendsForUser('user_1')).resolves.toEqual([
      expect.objectContaining({
        counterpartUserId: 'user_2',
        publicId: 'YDALICE01',
        unreadCount: 2
      })
    ])
  })

  it('creates a friend request and writes an audit event', async () => {
    await createFriendRequest({
      userId: 'user_1',
      friendId: 'user_2',
      ipAddress: '127.0.0.1',
      deviceFingerprint: 'device_1'
    })

    expect(mockFriendUpsert).toHaveBeenCalled()
    expect(mockAuditCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          eventType: 'FRIEND_REQUESTED',
          actorUserId: 'user_1',
          targetUserId: 'user_2'
        })
      })
    )
  })

  it('rejects duplicate friend requests when users are already friends', async () => {
    mockFriendFindMany.mockResolvedValueOnce([
      {
        id: 'friendship_accepted',
        userId: 'user_2',
        friendId: 'user_1',
        status: 'ACCEPTED'
      }
    ])

    await expect(
      createFriendRequest({
        userId: 'user_1',
        friendId: 'user_2'
      })
    ).rejects.toThrow('already_friends')
  })

  it('maps conversation messages with receipts and recall metadata', async () => {
    mockChatMessageFindMany.mockResolvedValueOnce([
      {
        id: 'message_1',
        matchId: null,
        senderId: 'user_1',
        receiverId: 'user_2',
        content: 'hello',
        contentType: 'TEXT',
        attachmentUrl: null,
        attachmentMeta: null,
        recalledAt: new Date('2026-04-09T10:05:00.000Z'),
        recallReason: 'user action',
        createdAt: new Date('2026-04-09T10:00:00.000Z'),
        receipts: [
          {
            userId: 'user_2',
            deliveredAt: new Date('2026-04-09T10:00:01.000Z'),
            readAt: new Date('2026-04-09T10:00:02.000Z')
          }
        ]
      }
    ])

    await expect(
      listConversationMessages({ userId: 'user_1', peerId: 'user_2' })
    ).resolves.toEqual([
      expect.objectContaining({
        id: 'message_1',
        recalledAt: '2026-04-09T10:05:00.000Z',
        recallReason: 'user action',
        receipts: [
          expect.objectContaining({
            readAt: '2026-04-09T10:00:02.000Z'
          })
        ]
      })
    ])
  })

  it('requires friendship before sending a direct message', async () => {
    mockFriendFindFirst.mockResolvedValueOnce(null)

    await expect(
      sendDirectMessage({
        senderId: 'user_1',
        receiverId: 'user_2',
        content: 'hello'
      })
    ).rejects.toThrow('friendship_required')
  })

  it('marks message receipts as read', async () => {
    await markMessageRead({
      messageId: 'message_1',
      userId: 'user_2'
    })

    expect(mockChatMessageReceiptUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          messageId_userId: {
            messageId: 'message_1',
            userId: 'user_2'
          }
        }
      })
    )
  })
})
