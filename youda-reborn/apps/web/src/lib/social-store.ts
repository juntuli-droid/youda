import {
  prisma,
  Prisma,
  FriendStatus,
  MessageContentType,
  ReportCategory
} from '@/lib/db'
import { deleteFriendship } from '@/lib/friendships'
import { getPersonalityMeta } from '@youda/game-assets'

type AuditInput = {
  actorUserId?: string
  targetUserId?: string
  eventType:
    | 'FRIEND_REQUESTED'
    | 'FRIEND_ACCEPTED'
    | 'FRIEND_REMOVED'
    | 'MESSAGE_SENT'
    | 'MESSAGE_READ'
    | 'MESSAGE_RECALLED'
    | 'USER_BLOCKED'
    | 'USER_UNBLOCKED'
    | 'USER_REPORTED'
    | 'EMPTY_STATE_EXPOSED'
    | 'EMPTY_STATE_CLICKED'
  ipAddress?: string
  deviceFingerprint?: string
  payload?: Record<string, unknown>
}

export type FriendListItem = {
  id: string
  userId: string
  friendId: string
  counterpartUserId: string
  publicId: string
  displayName: string
  avatarUrl?: string
  status: 'online' | 'offline' | 'gaming'
  personality?: string
  unreadCount: number
}

export type FriendSearchItem = {
  id: string
  publicId: string
  displayName: string
  avatarUrl?: string
  status: 'online' | 'offline' | 'gaming'
  relationStatus: 'friend' | 'pending_incoming' | 'pending_outgoing' | 'none'
}

export type ConversationMessage = {
  id: string
  senderId: string
  matchId?: string
  receiverId?: string
  content: string
  contentType: 'TEXT' | 'IMAGE' | 'VOICE'
  attachmentUrl?: string
  attachmentMeta?: Record<string, unknown>
  recalledAt?: string
  recallReason?: string
  createdAt: string
  receipts: Array<{
    userId: string
    deliveredAt?: string
    readAt?: string
  }>
}

async function createAuditEvent(input: AuditInput) {
  await prisma.auditEvent.create({
    data: {
      actorUserId: input.actorUserId,
      targetUserId: input.targetUserId,
      eventType: input.eventType,
      ipAddress: input.ipAddress,
      deviceFingerprint: input.deviceFingerprint,
      payload: input.payload as Prisma.InputJsonValue | undefined
    }
  })
}

function resolvePresenceStatus(lastLoginAt: Date | null): FriendListItem['status'] {
  return lastLoginAt ? 'online' : 'offline'
}

async function getBlockedIdsForUser(userId: string) {
  const blockedRelations = await prisma.blockRelation.findMany({
    where: {
      OR: [{ blockerId: userId }, { blockedId: userId }]
    }
  })

  return new Set(
    blockedRelations.map((relation) =>
      relation.blockerId === userId ? relation.blockedId : relation.blockerId
    )
  )
}

async function getUnreadCountBySender(userId: string) {
  const unreadReceipts = await prisma.chatMessageReceipt.findMany({
    where: {
      userId,
      readAt: null,
      message: {
        messageType: 'DIRECT',
        receiverId: userId,
        recalledAt: null
      }
    },
    select: {
      message: {
        select: {
          senderId: true
        }
      }
    }
  })

  return unreadReceipts.reduce<Record<string, number>>((counts, receipt) => {
    counts[receipt.message.senderId] = (counts[receipt.message.senderId] ?? 0) + 1
    return counts
  }, {})
}

export async function usersAreBlocked(userId: string, otherUserId: string) {
  const relation = await prisma.blockRelation.findFirst({
    where: {
      OR: [
        { blockerId: userId, blockedId: otherUserId },
        { blockerId: otherUserId, blockedId: userId }
      ]
    }
  })

  return Boolean(relation)
}

export async function listFriendsForUser(userId: string): Promise<FriendListItem[]> {
  const [blockedIds, unreadCountBySender, friendships] = await Promise.all([
    getBlockedIdsForUser(userId),
    getUnreadCountBySender(userId),
    prisma.friend.findMany({
      where: {
        status: FriendStatus.ACCEPTED,
        OR: [{ userId }, { friendId: userId }]
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            nickname: true,
            avatarUrl: true,
            publicId: true,
            lastLoginAt: true,
            personalityCode: true
          }
        },
        friend: {
          select: {
            id: true,
            username: true,
            nickname: true,
            avatarUrl: true,
            publicId: true,
            lastLoginAt: true,
            personalityCode: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
  ])

  const uniqueFriends = new Map<string, FriendListItem>()

  for (const item of friendships) {
    const counterpart = item.userId === userId ? item.friend : item.user
    if (blockedIds.has(counterpart.id) || uniqueFriends.has(counterpart.id)) {
      continue
    }

    uniqueFriends.set(counterpart.id, {
      id: item.id,
      userId: item.userId,
      friendId: item.friendId,
      counterpartUserId: counterpart.id,
      publicId: counterpart.publicId,
      displayName: counterpart.nickname ?? counterpart.username,
      avatarUrl: counterpart.avatarUrl ?? undefined,
      status: resolvePresenceStatus(counterpart.lastLoginAt),
      personality: counterpart.personalityCode
        ? getPersonalityMeta(counterpart.personalityCode).title
        : undefined,
      unreadCount: unreadCountBySender[counterpart.id] ?? 0
    })
  }

  return Array.from(uniqueFriends.values())
}

export async function listPendingFriendRequestsForUser(userId: string) {
  return prisma.friend.findMany({
    where: {
      friendId: userId,
      status: FriendStatus.PENDING
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          nickname: true,
          avatarUrl: true,
          publicId: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })
}

export async function createFriendRequest(input: {
  userId: string
  friendId: string
  ipAddress?: string
  deviceFingerprint?: string
}) {
  if (input.userId === input.friendId) {
    throw new Error('cannot friend self')
  }

  if (await usersAreBlocked(input.userId, input.friendId)) {
    throw new Error('blocked')
  }

  const existingRelations = await prisma.friend.findMany({
    where: {
      OR: [
        {
          userId: input.userId,
          friendId: input.friendId
        },
        {
          userId: input.friendId,
          friendId: input.userId
        }
      ]
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  if (existingRelations.some((item) => item.status === FriendStatus.ACCEPTED)) {
    throw new Error('already_friends')
  }

  const directPending = existingRelations.find(
    (item) =>
      item.userId === input.userId &&
      item.friendId === input.friendId &&
      item.status === FriendStatus.PENDING
  )
  if (directPending) {
    throw new Error('request_pending')
  }

  const reversePending = existingRelations.find(
    (item) =>
      item.userId === input.friendId &&
      item.friendId === input.userId &&
      item.status === FriendStatus.PENDING
  )
  if (reversePending) {
    throw new Error('pending_incoming')
  }

  const friendRequest = await prisma.friend.upsert({
    where: {
      userId_friendId: {
        userId: input.userId,
        friendId: input.friendId
      }
    },
    update: {
      status: FriendStatus.PENDING
    },
    create: {
      userId: input.userId,
      friendId: input.friendId,
      status: FriendStatus.PENDING
    }
  })

  await createAuditEvent({
    actorUserId: input.userId,
    targetUserId: input.friendId,
    eventType: 'FRIEND_REQUESTED',
    ipAddress: input.ipAddress,
    deviceFingerprint: input.deviceFingerprint
  })

  return friendRequest
}

export async function searchUsersForFriendship(input: {
  userId: string
  query: string
}): Promise<FriendSearchItem[]> {
  const trimmedQuery = input.query.trim()
  if (!trimmedQuery) {
    return []
  }

  const blockedIds = await getBlockedIdsForUser(input.userId)
  const normalizedPublicId = trimmedQuery.toUpperCase()

  const candidates = await prisma.user.findMany({
    where: {
      id: {
        not: input.userId
      },
      OR: [
        {
          publicId: {
            contains: normalizedPublicId
          }
        },
        {
          username: {
            contains: trimmedQuery
          }
        },
        {
          nickname: {
            contains: trimmedQuery
          }
        }
      ]
    },
    select: {
      id: true,
      username: true,
      nickname: true,
      avatarUrl: true,
      publicId: true,
      lastLoginAt: true
    },
    take: 8
  })

  const filteredCandidates = candidates.filter((candidate) => !blockedIds.has(candidate.id))
  if (filteredCandidates.length === 0) {
    return []
  }

  const candidateIds = filteredCandidates.map((candidate) => candidate.id)
  const relations = await prisma.friend.findMany({
    where: {
      OR: [
        {
          userId: input.userId,
          friendId: {
            in: candidateIds
          }
        },
        {
          userId: {
            in: candidateIds
          },
          friendId: input.userId
        }
      ]
    }
  })

  const relationMap = new Map<
    string,
    FriendSearchItem['relationStatus']
  >()

  for (const relation of relations) {
    const counterpartId =
      relation.userId === input.userId ? relation.friendId : relation.userId

    if (relation.status === FriendStatus.ACCEPTED) {
      relationMap.set(counterpartId, 'friend')
      continue
    }

    if (relation.status === FriendStatus.PENDING) {
      relationMap.set(
        counterpartId,
        relation.userId === input.userId ? 'pending_outgoing' : 'pending_incoming'
      )
    }
  }

  return filteredCandidates
    .sort((left, right) => {
      const leftExact = left.publicId === normalizedPublicId ? 1 : 0
      const rightExact = right.publicId === normalizedPublicId ? 1 : 0
      if (leftExact !== rightExact) {
        return rightExact - leftExact
      }

      const leftStartsWith =
        left.publicId.startsWith(normalizedPublicId) ||
        left.username.startsWith(trimmedQuery) ||
        Boolean(left.nickname?.startsWith(trimmedQuery))
      const rightStartsWith =
        right.publicId.startsWith(normalizedPublicId) ||
        right.username.startsWith(trimmedQuery) ||
        Boolean(right.nickname?.startsWith(trimmedQuery))

      if (leftStartsWith !== rightStartsWith) {
        return Number(rightStartsWith) - Number(leftStartsWith)
      }

      return left.username.localeCompare(right.username, 'zh-CN')
    })
    .map((candidate) => ({
      id: candidate.id,
      publicId: candidate.publicId,
      displayName: candidate.nickname ?? candidate.username,
      avatarUrl: candidate.avatarUrl ?? undefined,
      status: resolvePresenceStatus(candidate.lastLoginAt),
      relationStatus: relationMap.get(candidate.id) ?? 'none'
    }))
}

export async function acceptFriendRequest(input: {
  requesterId: string
  accepterId: string
  ipAddress?: string
  deviceFingerprint?: string
}) {
  const result = await prisma.$transaction(async (tx) => {
    await tx.friend.updateMany({
      where: {
        userId: input.requesterId,
        friendId: input.accepterId,
        status: FriendStatus.PENDING
      },
      data: {
        status: FriendStatus.ACCEPTED
      }
    })

    await tx.friend.upsert({
      where: {
        userId_friendId: {
          userId: input.accepterId,
          friendId: input.requesterId
        }
      },
      update: {
        status: FriendStatus.ACCEPTED
      },
      create: {
        userId: input.accepterId,
        friendId: input.requesterId,
        status: FriendStatus.ACCEPTED
      }
    })
  })

  await createAuditEvent({
    actorUserId: input.accepterId,
    targetUserId: input.requesterId,
    eventType: 'FRIEND_ACCEPTED',
    ipAddress: input.ipAddress,
    deviceFingerprint: input.deviceFingerprint
  })

  return result
}

export async function removeFriend(input: {
  userId: string
  friendId: string
  ipAddress?: string
  deviceFingerprint?: string
}) {
  const result = await deleteFriendship(input.userId, input.friendId)

  await createAuditEvent({
    actorUserId: input.userId,
    targetUserId: input.friendId,
    eventType: 'FRIEND_REMOVED',
    ipAddress: input.ipAddress,
    deviceFingerprint: input.deviceFingerprint,
    payload: {
      deletedFriendships: result.deletedFriendships,
      deletedMessages: result.deletedMessages
    }
  })

  return result
}

export async function listConversationMessages(input: {
  userId: string
  peerId: string
  limit?: number
  since?: Date
}) {
  const rows = await prisma.chatMessage.findMany({
    where: {
      OR: [
        { senderId: input.userId, receiverId: input.peerId },
        { senderId: input.peerId, receiverId: input.userId }
      ],
      ...(input.since
        ? {
            createdAt: {
              gte: input.since
            }
          }
        : {})
    },
    include: {
      receipts: true
    },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: input.limit ?? 50
  })

  return rows
    .reverse()
    .map(
      (row): ConversationMessage => ({
        id: row.id,
        senderId: row.senderId,
        matchId: row.matchId ?? undefined,
        receiverId: row.receiverId ?? undefined,
        content: row.content,
        contentType: row.contentType,
        attachmentUrl: row.attachmentUrl ?? undefined,
        attachmentMeta:
          row.attachmentMeta && typeof row.attachmentMeta === 'object'
            ? (row.attachmentMeta as Record<string, unknown>)
            : undefined,
        recalledAt: row.recalledAt?.toISOString(),
        recallReason: row.recallReason ?? undefined,
        createdAt: row.createdAt.toISOString(),
        receipts: row.receipts.map((receipt) => ({
          userId: receipt.userId,
          deliveredAt: receipt.deliveredAt?.toISOString(),
          readAt: receipt.readAt?.toISOString()
        }))
      })
    )
}

export async function sendDirectMessage(input: {
  senderId: string
  receiverId: string
  content: string
  contentType?: 'TEXT' | 'IMAGE' | 'VOICE'
  attachmentUrl?: string
  attachmentMeta?: Record<string, unknown>
  clientMessageId?: string
  ipAddress?: string
  deviceFingerprint?: string
}) {
  if (await usersAreBlocked(input.senderId, input.receiverId)) {
    throw new Error('blocked')
  }

  const friendship = await prisma.friend.findFirst({
    where: {
      status: FriendStatus.ACCEPTED,
      OR: [
        { userId: input.senderId, friendId: input.receiverId },
        { userId: input.receiverId, friendId: input.senderId }
      ]
    }
  })

  if (!friendship) {
    throw new Error('friendship_required')
  }

  const message = await prisma.chatMessage.create({
    data: {
      senderId: input.senderId,
      receiverId: input.receiverId,
      content: input.content,
      contentType: input.contentType ?? MessageContentType.TEXT,
      attachmentUrl: input.attachmentUrl,
      attachmentMeta: input.attachmentMeta as Prisma.InputJsonValue | undefined,
      clientMessageId: input.clientMessageId,
      messageType: 'DIRECT',
      receipts: {
        create: {
          userId: input.receiverId,
          deliveredAt: new Date()
        }
      }
    },
    include: {
      receipts: true
    }
  })

  await createAuditEvent({
    actorUserId: input.senderId,
    targetUserId: input.receiverId,
    eventType: 'MESSAGE_SENT',
    ipAddress: input.ipAddress,
    deviceFingerprint: input.deviceFingerprint,
    payload: {
      messageId: message.id,
      contentType: input.contentType ?? MessageContentType.TEXT
    }
  })

  return message
}

export async function listMatchMessages(input: {
  userId: string
  matchId: string
  limit?: number
  since?: Date
}) {
  const membership = await prisma.matchQueueEntry.findFirst({
    where: {
      matchId: input.matchId,
      userId: input.userId,
      status: 'MATCHED'
    }
  })

  if (!membership) {
    throw new Error('match_membership_required')
  }

  const rows = await prisma.chatMessage.findMany({
    where: {
      matchId: input.matchId,
      messageType: 'MATCH',
      ...(input.since
        ? {
            createdAt: {
              gte: input.since
            }
          }
        : {})
    },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    take: input.limit ?? 100
  })

  return rows.map(
    (row): ConversationMessage => ({
      id: row.id,
      senderId: row.senderId,
      matchId: row.matchId ?? undefined,
      receiverId: row.receiverId ?? undefined,
      content: row.content,
      contentType: row.contentType,
      attachmentUrl: row.attachmentUrl ?? undefined,
      attachmentMeta:
        row.attachmentMeta && typeof row.attachmentMeta === 'object'
          ? (row.attachmentMeta as Record<string, unknown>)
          : undefined,
      recalledAt: row.recalledAt?.toISOString(),
      recallReason: row.recallReason ?? undefined,
      createdAt: row.createdAt.toISOString(),
      receipts: []
    })
  )
}

export async function sendMatchMessage(input: {
  senderId: string
  matchId: string
  content: string
  contentType?: 'TEXT' | 'IMAGE' | 'VOICE'
  attachmentUrl?: string
  attachmentMeta?: Record<string, unknown>
  clientMessageId?: string
  ipAddress?: string
  deviceFingerprint?: string
}) {
  const membership = await prisma.matchQueueEntry.findFirst({
    where: {
      matchId: input.matchId,
      userId: input.senderId,
      status: 'MATCHED'
    }
  })

  if (!membership) {
    throw new Error('match_membership_required')
  }

  const message = await prisma.chatMessage.create({
    data: {
      matchId: input.matchId,
      senderId: input.senderId,
      content: input.content,
      contentType: input.contentType ?? MessageContentType.TEXT,
      attachmentUrl: input.attachmentUrl,
      attachmentMeta: input.attachmentMeta as Prisma.InputJsonValue | undefined,
      clientMessageId: input.clientMessageId,
      messageType: 'MATCH'
    }
  })

  await createAuditEvent({
    actorUserId: input.senderId,
    eventType: 'MESSAGE_SENT',
    ipAddress: input.ipAddress,
    deviceFingerprint: input.deviceFingerprint,
    payload: {
      matchId: input.matchId,
      messageId: message.id,
      contentType: input.contentType ?? MessageContentType.TEXT
    }
  })

  return message
}

export async function markMessageRead(input: {
  messageId: string
  userId: string
  ipAddress?: string
  deviceFingerprint?: string
}) {
  const receipt = await prisma.chatMessageReceipt.upsert({
    where: {
      messageId_userId: {
        messageId: input.messageId,
        userId: input.userId
      }
    },
    update: {
      readAt: new Date(),
      deliveredAt: new Date()
    },
    create: {
      messageId: input.messageId,
      userId: input.userId,
      deliveredAt: new Date(),
      readAt: new Date()
    }
  })

  await createAuditEvent({
    actorUserId: input.userId,
    eventType: 'MESSAGE_READ',
    ipAddress: input.ipAddress,
    deviceFingerprint: input.deviceFingerprint,
    payload: {
      messageId: input.messageId
    }
  })

  return receipt
}

export async function recallMessage(input: {
  messageId: string
  userId: string
  reason?: string
  ipAddress?: string
  deviceFingerprint?: string
}) {
  const result = await prisma.chatMessage.updateMany({
    where: {
      id: input.messageId,
      senderId: input.userId,
      recalledAt: null
    },
    data: {
      recalledAt: new Date(),
      recallReason: input.reason
    }
  })

  await createAuditEvent({
    actorUserId: input.userId,
    eventType: 'MESSAGE_RECALLED',
    ipAddress: input.ipAddress,
    deviceFingerprint: input.deviceFingerprint,
    payload: {
      messageId: input.messageId,
      reason: input.reason
    }
  })

  return result
}

export async function listBlockedUsers(userId: string) {
  return prisma.blockRelation.findMany({
    where: {
      blockerId: userId
    },
    include: {
      blocked: true
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 1000
  })
}

export async function blockUser(input: {
  blockerId: string
  blockedId: string
  reason?: string
  ipAddress?: string
  deviceFingerprint?: string
}) {
  const relation = await prisma.blockRelation.upsert({
    where: {
      blockerId_blockedId: {
        blockerId: input.blockerId,
        blockedId: input.blockedId
      }
    },
    update: {
      reason: input.reason
    },
    create: {
      blockerId: input.blockerId,
      blockedId: input.blockedId,
      reason: input.reason
    }
  })

  await createAuditEvent({
    actorUserId: input.blockerId,
    targetUserId: input.blockedId,
    eventType: 'USER_BLOCKED',
    ipAddress: input.ipAddress,
    deviceFingerprint: input.deviceFingerprint,
    payload: {
      reason: input.reason
    }
  })

  return relation
}

export async function unblockUser(input: {
  blockerId: string
  blockedId: string
  ipAddress?: string
  deviceFingerprint?: string
}) {
  const result = await prisma.blockRelation.deleteMany({
    where: {
      blockerId: input.blockerId,
      blockedId: input.blockedId
    }
  })

  await createAuditEvent({
    actorUserId: input.blockerId,
    targetUserId: input.blockedId,
    eventType: 'USER_UNBLOCKED',
    ipAddress: input.ipAddress,
    deviceFingerprint: input.deviceFingerprint
  })

  return result
}

export async function createUserReport(input: {
  reporterId: string
  reportedUserId?: string
  messageId?: string
  matchId?: string
  category: ReportCategory
  description?: string
  evidenceUrls?: string[]
  ipAddress?: string
  deviceFingerprint?: string
}) {
  const report = await prisma.userReport.create({
    data: {
      reporterId: input.reporterId,
      reportedUserId: input.reportedUserId,
      messageId: input.messageId,
      matchId: input.matchId,
      category: input.category,
      description: input.description,
      evidenceUrls: (input.evidenceUrls ?? []) as Prisma.InputJsonValue,
      ipAddress: input.ipAddress,
      deviceFingerprint: input.deviceFingerprint
    }
  })

  await createAuditEvent({
    actorUserId: input.reporterId,
    targetUserId: input.reportedUserId,
    eventType: 'USER_REPORTED',
    ipAddress: input.ipAddress,
    deviceFingerprint: input.deviceFingerprint,
    payload: {
      reportId: report.id,
      category: input.category,
      evidenceUrls: input.evidenceUrls ?? []
    }
  })

  return report
}

export async function logEmptyStateEvent(input: {
  userId?: string
  scenario: string
  action: 'EMPTY_STATE_EXPOSED' | 'EMPTY_STATE_CLICKED'
  locale: string
  durationMs?: number
}) {
  await createAuditEvent({
    actorUserId: input.userId,
    eventType: input.action,
    payload: {
      scenario: input.scenario,
      locale: input.locale,
      durationMs: input.durationMs
    }
  })
}
