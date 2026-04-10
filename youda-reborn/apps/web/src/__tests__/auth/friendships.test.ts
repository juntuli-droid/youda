import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockTransaction } = vi.hoisted(() => ({
  mockTransaction: vi.fn()
}))

vi.mock('@/lib/db', () => ({
  prisma: {
    $transaction: mockTransaction
  }
}))

import { deleteFriendship } from '@/lib/friendships'

describe('deleteFriendship', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns zero counts when no friendship exists', async () => {
    mockTransaction.mockImplementation(async (callback) =>
      callback({
        friend: {
          findMany: vi.fn().mockResolvedValue([]),
          deleteMany: vi.fn()
        },
        chatMessage: {
          deleteMany: vi.fn()
        }
      })
    )

    await expect(deleteFriendship('user_1', 'user_2')).resolves.toEqual({
      deletedFriendships: 0,
      deletedMessages: 0,
      retentionPolicy: 'PRESERVE'
    })
  })

  it('preserves messages by default when policy is PRESERVE', async () => {
    const findMany = vi.fn().mockResolvedValue([
      { messageRetentionPolicy: 'PRESERVE' }
    ])
    const deleteManyFriends = vi.fn().mockResolvedValue({ count: 2 })
    const deleteManyMessages = vi.fn().mockResolvedValue({ count: 99 })

    mockTransaction.mockImplementation(async (callback) =>
      callback({
        friend: {
          findMany,
          deleteMany: deleteManyFriends
        },
        chatMessage: {
          deleteMany: deleteManyMessages
        }
      })
    )

    await expect(deleteFriendship('user_1', 'user_2')).resolves.toEqual({
      deletedFriendships: 2,
      deletedMessages: 0,
      retentionPolicy: 'PRESERVE'
    })

    expect(deleteManyMessages).not.toHaveBeenCalled()
  })

  it('deletes direct messages when explicit DELETE mode is passed', async () => {
    const deleteManyFriends = vi.fn().mockResolvedValue({ count: 2 })
    const deleteManyMessages = vi.fn().mockResolvedValue({ count: 8 })

    mockTransaction.mockImplementation(async (callback) =>
      callback({
        friend: {
          findMany: vi.fn().mockResolvedValue([{ messageRetentionPolicy: 'PRESERVE' }]),
          deleteMany: deleteManyFriends
        },
        chatMessage: {
          deleteMany: deleteManyMessages
        }
      })
    )

    await expect(deleteFriendship('user_1', 'user_2', 'DELETE')).resolves.toEqual({
      deletedFriendships: 2,
      deletedMessages: 8,
      retentionPolicy: 'DELETE'
    })
  })

  it('deletes direct messages when stored friendship policy requires deletion', async () => {
    const deleteManyFriends = vi.fn().mockResolvedValue({ count: 2 })
    const deleteManyMessages = vi.fn().mockResolvedValue({ count: 3 })

    mockTransaction.mockImplementation(async (callback) =>
      callback({
        friend: {
          findMany: vi.fn().mockResolvedValue([{ messageRetentionPolicy: 'DELETE' }]),
          deleteMany: deleteManyFriends
        },
        chatMessage: {
          deleteMany: deleteManyMessages
        }
      })
    )

    await expect(deleteFriendship('user_1', 'user_2')).resolves.toEqual({
      deletedFriendships: 2,
      deletedMessages: 3,
      retentionPolicy: 'DELETE'
    })
  })
})
