import {
  MatchQueueStatus,
  Prisma,
  VoiceSignalType,
  prisma
} from '@/lib/db'

const ACTIVE_PARTICIPANT_WINDOW_MS = 20_000
const SIGNAL_TTL_MS = 30_000

export type VoiceRoomParticipantSnapshot = {
  id: string
  userId: string
  peerId: string
  displayName: string
  avatarUrl?: string
  joinedAt: string
  lastSeenAt: string
  isSelf: boolean
}

export type VoiceSignalSnapshot = {
  id: string
  senderId: string
  senderPeerId: string
  targetPeerId?: string
  signalType: 'JOIN' | 'OFFER' | 'ANSWER' | 'ICE' | 'LEAVE'
  payload?: Record<string, unknown>
  createdAt: string
}

async function assertMatchMembership(matchId: string, userId: string) {
  const membership = await prisma.matchQueueEntry.findFirst({
    where: {
      matchId,
      userId,
      status: MatchQueueStatus.MATCHED
    }
  })

  if (!membership) {
    throw new Error('match_membership_required')
  }

  return membership
}

async function cleanupExpiredVoiceState(matchId: string) {
  const now = new Date()
  const staleParticipantThreshold = new Date(
    now.getTime() - ACTIVE_PARTICIPANT_WINDOW_MS
  )

  await prisma.$transaction([
    prisma.voiceRoomParticipant.updateMany({
      where: {
        matchId,
        leftAt: null,
        lastSeenAt: {
          lt: staleParticipantThreshold
        }
      },
      data: {
        leftAt: now
      }
    }),
    prisma.voiceRoomSignal.deleteMany({
      where: {
        matchId,
        expiresAt: {
          lt: now
        }
      }
    })
  ])
}

async function listActiveParticipants(matchId: string, currentUserId: string) {
  const threshold = new Date(Date.now() - ACTIVE_PARTICIPANT_WINDOW_MS)
  const participants = await prisma.voiceRoomParticipant.findMany({
    where: {
      matchId,
      leftAt: null,
      lastSeenAt: {
        gte: threshold
      }
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          nickname: true,
          avatarUrl: true
        }
      }
    },
    orderBy: [{ joinedAt: 'asc' }, { id: 'asc' }]
  })

  return participants.map(
    (participant): VoiceRoomParticipantSnapshot => ({
      id: participant.id,
      userId: participant.userId,
      peerId: participant.peerId,
      displayName: participant.user.nickname ?? participant.user.username,
      avatarUrl: participant.user.avatarUrl ?? undefined,
      joinedAt: participant.joinedAt.toISOString(),
      lastSeenAt: participant.lastSeenAt.toISOString(),
      isSelf: participant.userId === currentUserId
    })
  )
}

function serializeSignalPayload(payload: unknown) {
  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    return payload as Record<string, unknown>
  }

  return undefined
}

async function createSignal(input: {
  matchId: string
  senderId: string
  senderPeerId: string
  signalType: VoiceSignalType
  targetUserId?: string
  targetPeerId?: string
  payload?: Record<string, unknown>
}) {
  return prisma.voiceRoomSignal.create({
    data: {
      matchId: input.matchId,
      senderId: input.senderId,
      senderPeerId: input.senderPeerId,
      targetUserId: input.targetUserId,
      targetPeerId: input.targetPeerId,
      signalType: input.signalType,
      payload: input.payload as Prisma.InputJsonValue | undefined,
      expiresAt: new Date(Date.now() + SIGNAL_TTL_MS)
    }
  })
}

export async function joinVoiceRoom(input: {
  matchId: string
  userId: string
  peerId: string
  ipAddress?: string
  userAgent?: string
  deviceFingerprint?: string
  metadata?: Record<string, unknown>
}) {
  await assertMatchMembership(input.matchId, input.userId)
  await cleanupExpiredVoiceState(input.matchId)

  const now = new Date()

  await prisma.voiceRoomParticipant.upsert({
    where: {
      matchId_userId: {
        matchId: input.matchId,
        userId: input.userId
      }
    },
    update: {
      peerId: input.peerId,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      deviceFingerprint: input.deviceFingerprint,
      metadata: input.metadata as Prisma.InputJsonValue | undefined,
      lastSeenAt: now,
      leftAt: null
    },
    create: {
      matchId: input.matchId,
      userId: input.userId,
      peerId: input.peerId,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      deviceFingerprint: input.deviceFingerprint,
      metadata: input.metadata as Prisma.InputJsonValue | undefined,
      joinedAt: now,
      lastSeenAt: now
    }
  })

  await createSignal({
    matchId: input.matchId,
    senderId: input.userId,
    senderPeerId: input.peerId,
    signalType: VoiceSignalType.JOIN,
    payload: {
      peerId: input.peerId
    }
  })

  return {
    participants: await listActiveParticipants(input.matchId, input.userId)
  }
}

export async function listVoiceRoomState(input: {
  matchId: string
  userId: string
  peerId: string
  since?: Date
}) {
  await assertMatchMembership(input.matchId, input.userId)
  await cleanupExpiredVoiceState(input.matchId)

  await prisma.voiceRoomParticipant.updateMany({
    where: {
      matchId: input.matchId,
      userId: input.userId,
      peerId: input.peerId
    },
    data: {
      lastSeenAt: new Date(),
      leftAt: null
    }
  })

  const signals = await prisma.voiceRoomSignal.findMany({
    where: {
      matchId: input.matchId,
      expiresAt: {
        gt: new Date()
      },
      senderId: {
        not: input.userId
      },
      ...(input.since
        ? {
            createdAt: {
              gt: input.since
            }
          }
        : {
            createdAt: {
              gte: new Date(Date.now() - SIGNAL_TTL_MS)
            }
          }),
      OR: [
        { targetPeerId: null },
        { targetPeerId: input.peerId },
        { targetUserId: input.userId }
      ]
    },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    take: 100
  })

  return {
    participants: await listActiveParticipants(input.matchId, input.userId),
    signals: signals.map(
      (signal): VoiceSignalSnapshot => ({
        id: signal.id,
        senderId: signal.senderId,
        senderPeerId: signal.senderPeerId,
        targetPeerId: signal.targetPeerId ?? undefined,
        signalType: signal.signalType,
        payload: serializeSignalPayload(signal.payload),
        createdAt: signal.createdAt.toISOString()
      })
    )
  }
}

export async function publishVoiceSignal(input: {
  matchId: string
  userId: string
  peerId: string
  signalType: 'OFFER' | 'ANSWER' | 'ICE'
  targetPeerId?: string
  payload?: Record<string, unknown>
}) {
  await assertMatchMembership(input.matchId, input.userId)

  const signalTypeMap = {
    OFFER: VoiceSignalType.OFFER,
    ANSWER: VoiceSignalType.ANSWER,
    ICE: VoiceSignalType.ICE
  } as const

  const signal = await createSignal({
    matchId: input.matchId,
    senderId: input.userId,
    senderPeerId: input.peerId,
    targetPeerId: input.targetPeerId,
    signalType: signalTypeMap[input.signalType],
    payload: input.payload
  })

  return {
    id: signal.id,
    createdAt: signal.createdAt.toISOString()
  }
}

export async function leaveVoiceRoom(input: {
  matchId: string
  userId: string
  peerId: string
}) {
  await assertMatchMembership(input.matchId, input.userId)

  await prisma.voiceRoomParticipant.updateMany({
    where: {
      matchId: input.matchId,
      userId: input.userId,
      peerId: input.peerId
    },
    data: {
      leftAt: new Date(),
      lastSeenAt: new Date()
    }
  })

  await createSignal({
    matchId: input.matchId,
    senderId: input.userId,
    senderPeerId: input.peerId,
    signalType: VoiceSignalType.LEAVE,
    payload: {
      peerId: input.peerId
    }
  })
}
