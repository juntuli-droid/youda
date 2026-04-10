import {
  prisma,
  Prisma,
  VlogType,
  FriendStatus,
  MessageContentType,
  ReportCategory,
  MatchQueueStatus,
  MatchStatus,
  VoiceSignalType
} from '@youda/database'
import { randomBytes } from 'node:crypto'

export interface Career {
  id: string
  gameName: string
  hours: number
  rank: string
  createdAt?: string
}

export interface Vlog {
  id: string
  title: string
  gameName: string
  videoUrl?: string
  coverUrl?: string
  content?: string
  type: 'video' | 'log'
  createdAt: string
}

export interface User {
  id: string
  username: string
  email: string
  publicId: string
  passwordHash: string
  createdAt: string
  nickname?: string
  avatarUrl?: string
  personalityCode?: string
  badges?: string[]
  unlockedBadges?: string[]
  careers?: Career[]
  vlogs?: Vlog[]
}

const userSnapshotSelect = {
  id: true,
  username: true,
  email: true,
  publicId: true,
  passwordHash: true,
  createdAt: true,
  nickname: true,
  avatarUrl: true,
  personalityCode: true,
  badges: true,
  unlockedBadges: true
} satisfies Prisma.UserSelect

const userInclude = {
  careers: {
    orderBy: {
      createdAt: 'desc'
    }
  },
  vlogs: {
    orderBy: {
      createdAt: 'desc'
    }
  }
} satisfies Prisma.UserInclude

type UserWithRelations = Prisma.UserGetPayload<{
  include: typeof userInclude
}>

type UserSnapshotRecord = Prisma.UserGetPayload<{
  select: typeof userSnapshotSelect
}>

const parseJsonArray = (value: Prisma.JsonValue | null | undefined): string[] => {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter((item): item is string => typeof item === 'string')
}

const mapCareer = (career: UserWithRelations['careers'][number]): Career => ({
  id: career.id,
  gameName: career.gameName,
  hours: career.hours,
  rank: career.rank,
  createdAt: career.createdAt.toISOString()
})

const mapVlog = (vlog: UserWithRelations['vlogs'][number]): Vlog => ({
  id: vlog.id,
  title: vlog.title,
  gameName: vlog.gameName,
  videoUrl: vlog.videoUrl ?? undefined,
  coverUrl: vlog.coverUrl ?? undefined,
  content: vlog.content ?? undefined,
  type: vlog.type === VlogType.LOG ? 'log' : 'video',
  createdAt: vlog.createdAt.toISOString()
})

const mapUserSnapshot = (user: UserSnapshotRecord): User => ({
  id: user.id,
  username: user.username,
  email: user.email,
  publicId: user.publicId,
  passwordHash: user.passwordHash,
  createdAt: user.createdAt.toISOString(),
  nickname: user.nickname ?? undefined,
  avatarUrl: user.avatarUrl ?? undefined,
  personalityCode: user.personalityCode ?? undefined,
  badges: parseJsonArray(user.badges),
  unlockedBadges: parseJsonArray(user.unlockedBadges)
})

const mapUser = (user: UserWithRelations): User => ({
  id: user.id,
  username: user.username,
  email: user.email,
  publicId: user.publicId,
  passwordHash: user.passwordHash,
  createdAt: user.createdAt.toISOString(),
  nickname: user.nickname ?? undefined,
  avatarUrl: user.avatarUrl ?? undefined,
  personalityCode: user.personalityCode ?? undefined,
  badges: parseJsonArray(user.badges),
  unlockedBadges: parseJsonArray(user.unlockedBadges),
  careers: user.careers.map(mapCareer),
  vlogs: user.vlogs.map(mapVlog)
})

export const getUsers = async (): Promise<User[]> => {
  const users = await prisma.user.findMany({
    include: userInclude,
    orderBy: {
      createdAt: 'desc'
    }
  })

  return users.map(mapUser)
}

export const getUserSnapshotById = async (id: string): Promise<User | null> => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: userSnapshotSelect
  })

  return user ? mapUserSnapshot(user) : null
}

export const getUserById = async (id: string): Promise<User | null> => {
  const user = await prisma.user.findUnique({
    where: { id },
    include: userInclude
  })

  return user ? mapUser(user) : null
}

export const findUserSnapshotByEmail = async (email: string): Promise<User | null> => {
  const user = await prisma.user.findUnique({
    where: { email },
    select: userSnapshotSelect
  })

  return user ? mapUserSnapshot(user) : null
}

export const findUserByEmail = async (email: string): Promise<User | null> => {
  const user = await prisma.user.findUnique({
    where: { email },
    include: userInclude
  })

  return user ? mapUser(user) : null
}

export const findUserSnapshotByUsername = async (username: string): Promise<User | null> => {
  const user = await prisma.user.findUnique({
    where: { username },
    select: userSnapshotSelect
  })

  return user ? mapUserSnapshot(user) : null
}

export const findUserByUsername = async (username: string): Promise<User | null> => {
  const user = await prisma.user.findUnique({
    where: { username },
    include: userInclude
  })

  return user ? mapUser(user) : null
}

export const findUserSnapshotByPublicId = async (publicId: string): Promise<User | null> => {
  const normalizedPublicId = publicId.trim().toUpperCase()
  if (!normalizedPublicId) {
    return null
  }

  const user = await prisma.user.findUnique({
    where: { publicId: normalizedPublicId },
    select: userSnapshotSelect
  })

  return user ? mapUserSnapshot(user) : null
}

export const findUserByPublicId = async (publicId: string): Promise<User | null> => {
  const normalizedPublicId = publicId.trim().toUpperCase()
  if (!normalizedPublicId) {
    return null
  }

  const user = await prisma.user.findUnique({
    where: { publicId: normalizedPublicId },
    include: userInclude
  })

  return user ? mapUser(user) : null
}

const PUBLIC_ID_PREFIX = 'YD'
const PUBLIC_ID_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function buildPublicIdCandidate() {
  const bytes = randomBytes(8)
  let suffix = ''

  for (let index = 0; index < bytes.length; index += 1) {
    const value = bytes[index]
    suffix += PUBLIC_ID_ALPHABET[value % PUBLIC_ID_ALPHABET.length]
    if (suffix.length >= 8) {
      break
    }
  }

  return `${PUBLIC_ID_PREFIX}${suffix}`
}

async function generateUniquePublicId() {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const candidate = buildPublicIdCandidate()
    const existing = await prisma.user.findUnique({
      where: { publicId: candidate },
      select: { id: true }
    })

    if (!existing) {
      return candidate
    }
  }

  throw new Error('public_id_generation_failed')
}

export const createUser = async (user: {
  username: string
  email: string
  passwordHash: string
  nickname?: string
  avatarUrl?: string
  badges?: string[]
  unlockedBadges?: string[]
}): Promise<User> => {
  const publicId = await generateUniquePublicId()

  const created = await prisma.user.create({
    data: {
      username: user.username,
      email: user.email,
      publicId,
      passwordHash: user.passwordHash,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl,
      badges: user.badges ?? [],
      unlockedBadges: user.unlockedBadges ?? []
    },
    include: userInclude
  })

  return mapUser(created)
}

export const updateUser = async (
  id: string,
  updates: Partial<Pick<User, 'nickname' | 'avatarUrl' | 'personalityCode' | 'badges' | 'unlockedBadges'>>
): Promise<User | null> => {
  const updated = await prisma.user.update({
    where: { id },
    data: {
      nickname: updates.nickname,
      avatarUrl: updates.avatarUrl,
      personalityCode: updates.personalityCode,
      badges: updates.badges,
      unlockedBadges: updates.unlockedBadges
    },
    include: userInclude
  })

  return updated ? mapUser(updated) : null
}

export const addCareerToUser = async (
  userId: string,
  career: Omit<Career, 'id'>
): Promise<Career> => {
  const created = await prisma.career.create({
    data: {
      userId,
      gameName: career.gameName,
      hours: career.hours,
      rank: career.rank
    }
  })

  return {
    id: created.id,
    gameName: created.gameName,
    hours: created.hours,
    rank: created.rank,
    createdAt: created.createdAt.toISOString()
  }
}

export const addVlogToUser = async (
  userId: string,
  vlog: Omit<Vlog, 'id' | 'createdAt'>
): Promise<Vlog> => {
  const created = await prisma.vlog.create({
    data: {
      userId,
      title: vlog.title,
      gameName: vlog.gameName,
      videoUrl: vlog.videoUrl,
      coverUrl: vlog.coverUrl,
      content: vlog.content,
      type: vlog.type === 'log' ? VlogType.LOG : VlogType.VIDEO
    }
  })

  return {
    id: created.id,
    title: created.title,
    gameName: created.gameName,
    videoUrl: created.videoUrl ?? undefined,
    coverUrl: created.coverUrl ?? undefined,
    content: created.content ?? undefined,
    type: created.type === VlogType.LOG ? 'log' : 'video',
    createdAt: created.createdAt.toISOString()
  }
}

export const touchUserLastLogin = async (id: string) => {
  await prisma.user.update({
    where: { id },
    data: {
      lastLoginAt: new Date()
    }
  })
}

export {
  prisma,
  Prisma,
  FriendStatus,
  MessageContentType,
  ReportCategory,
  MatchQueueStatus,
  MatchStatus,
  VoiceSignalType
}
