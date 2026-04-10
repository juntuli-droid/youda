import { prisma, FriendStatus, MatchStatus, MessageType, VlogType } from '../index'

const TOTAL_RECORDS = Number(process.env.SEED_TOTAL_RECORDS ?? 100000)
const USER_COUNT = Math.max(Number(process.env.SEED_USER_COUNT ?? 10000), 1000)
const BATCH_SIZE = Number(process.env.SEED_BATCH_SIZE ?? 2000)
const BASE_TIME = new Date('2026-01-01T00:00:00.000Z')

const DISTRIBUTION = {
  careers: Math.floor(TOTAL_RECORDS * 0.12),
  vlogs: Math.floor(TOTAL_RECORDS * 0.12),
  matches: Math.floor(TOTAL_RECORDS * 0.12),
  friends: Math.floor(TOTAL_RECORDS * 0.12)
}

const MESSAGE_COUNT =
  TOTAL_RECORDS -
  USER_COUNT -
  DISTRIBUTION.careers -
  DISTRIBUTION.vlogs -
  DISTRIBUTION.matches -
  DISTRIBUTION.friends

const gameNames = ['英雄联盟', '无畏契约', '原神', '三角洲行动']
const personalityTypes = ['ACP-F', 'BTR-L', 'SEW-F', 'RDI-T']
const durationSlots = ['1 小时', '2 小时', '3 小时', '整晚']
const rankNames = ['黄金', '白金', '钻石', '大师']

function chunkedRange(total: number, iteratee: (index: number) => Record<string, unknown>) {
  const batches: Array<Array<Record<string, unknown>>> = []

  for (let start = 0; start < total; start += BATCH_SIZE) {
    const batchSize = Math.min(BATCH_SIZE, total - start)
    const rows = Array.from({ length: batchSize }, (_, offset) => iteratee(start + offset))
    batches.push(rows)
  }

  return batches
}

function offsetDate(index: number) {
  return new Date(BASE_TIME.getTime() + index * 1000)
}

async function createManyInBatches<ModelInput extends Record<string, unknown>>(
  label: string,
  batches: Array<ModelInput[]>,
  handler: (batch: ModelInput[]) => Promise<unknown>
) {
  for (const batch of batches) {
    await handler(batch)
  }

  console.info(
    JSON.stringify({
      event: 'database.seed.completed',
      label,
      total: batches.reduce((sum, batch) => sum + batch.length, 0)
    })
  )
}

async function seedUsers() {
  const batches = chunkedRange(USER_COUNT, (index) => ({
    id: `seed_user_${index}`,
    username: `seed_user_${index}`,
    email: `seed_user_${index}@example.com`,
    publicId: `YD${index.toString(36).toUpperCase().padStart(8, '0')}`,
    passwordHash: '$2b$12$A9U2.8H5NgFzhtm9v3n3Ce7kqJ7G7E.3gQSLmQGfM6W9m6QH/XKPe',
    nickname: `玩家 ${index}`,
    avatarUrl: `/game-assets/avatars/avatar-${index % 27}.png`,
    personalityCode: ['ACP-F', 'BTR-L', 'SEW-F', 'SRP-L'][index % 4],
    badges: [],
    unlockedBadges: [],
    createdAt: offsetDate(index),
    updatedAt: offsetDate(index)
  }))

  await createManyInBatches('users', batches, (batch) =>
    prisma.user.createMany({
      data: batch,
      skipDuplicates: true
    })
  )
}

async function seedCareers() {
  const total = DISTRIBUTION.careers
  const batches = chunkedRange(total, (index) => ({
    id: `seed_career_${index}`,
    userId: `seed_user_${index % USER_COUNT}`,
    gameName: gameNames[index % gameNames.length],
    hours: 100 + (index % 500),
    rank: rankNames[index % rankNames.length],
    createdAt: offsetDate(index),
    updatedAt: offsetDate(index)
  }))

  await createManyInBatches('careers', batches, (batch) =>
    prisma.career.createMany({
      data: batch,
      skipDuplicates: true
    })
  )
}

async function seedVlogs() {
  const total = DISTRIBUTION.vlogs
  const batches = chunkedRange(total, (index) => ({
    id: `seed_vlog_${index}`,
    userId: `seed_user_${index % USER_COUNT}`,
    title: `测试 Vlog ${index}`,
    gameName: gameNames[index % gameNames.length],
    content: `这是第 ${index} 条游戏记录`,
    type: index % 2 === 0 ? VlogType.LOG : VlogType.VIDEO,
    videoUrl: index % 2 === 0 ? null : `https://example.com/video/${index}`,
    coverUrl: `https://cdn.example.com/covers/${index}.jpg`,
    createdAt: offsetDate(index),
    updatedAt: offsetDate(index)
  }))

  await createManyInBatches('vlogs', batches, (batch) =>
    prisma.vlog.createMany({
      data: batch,
      skipDuplicates: true
    })
  )
}

async function seedMatches() {
  const total = DISTRIBUTION.matches
  const batches = chunkedRange(total, (index) => ({
    id: `seed_match_${index}`,
    hostUserId: `seed_user_${index % USER_COUNT}`,
    gameName: gameNames[index % gameNames.length],
    personality: personalityTypes[index % personalityTypes.length],
    duration: durationSlots[index % durationSlots.length],
    roomCode: `ROOM_${index}`,
    status: [MatchStatus.PENDING, MatchStatus.ACTIVE, MatchStatus.ENDED, MatchStatus.CANCELLED][index % 4],
    createdAt: offsetDate(index),
    updatedAt: offsetDate(index)
  }))

  await createManyInBatches('matches', batches, (batch) =>
    prisma.match.createMany({
      data: batch,
      skipDuplicates: true
    })
  )
}

async function seedFriends() {
  const total = DISTRIBUTION.friends
  const batches = chunkedRange(total, (index) => ({
    id: `seed_friend_${index}`,
    userId: `seed_user_${index % USER_COUNT}`,
    friendId: `seed_user_${(index + 1) % USER_COUNT}`,
    status: index % 5 === 0 ? FriendStatus.PENDING : FriendStatus.ACCEPTED,
    messageRetentionPolicy: index % 2 === 0 ? 'PRESERVE' : 'DELETE',
    createdAt: offsetDate(index),
    updatedAt: offsetDate(index)
  }))

  await createManyInBatches('friends', batches, (batch) =>
    prisma.friend.createMany({
      data: batch,
      skipDuplicates: true
    })
  )
}

async function seedMessages() {
  const total = Math.max(MESSAGE_COUNT, 0)
  const matchSeedBase = DISTRIBUTION.matches || 1
  const batches = chunkedRange(total, (index) => ({
    id: `seed_message_${index}`,
    matchId: index % 2 === 0 ? `seed_match_${index % matchSeedBase}` : null,
    senderId: `seed_user_${index % USER_COUNT}`,
    receiverId: index % 2 === 0 ? null : `seed_user_${(index + 2) % USER_COUNT}`,
    content: `测试消息 ${index}`,
    messageType: index % 2 === 0 ? MessageType.MATCH : MessageType.DIRECT,
    createdAt: offsetDate(index)
  }))

  await createManyInBatches('chat_messages', batches, (batch) =>
    prisma.chatMessage.createMany({
      data: batch,
      skipDuplicates: true
    })
  )
}

async function main() {
  const startedAt = Date.now()

  await seedUsers()
  await seedCareers()
  await seedVlogs()
  await seedMatches()
  await seedFriends()
  await seedMessages()

  console.info(
    JSON.stringify({
      event: 'database.seed.summary',
      totalRecords: TOTAL_RECORDS,
      userCount: USER_COUNT,
      messageCount: Math.max(MESSAGE_COUNT, 0),
      batchSize: BATCH_SIZE,
      durationMs: Date.now() - startedAt
    })
  )
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
