import { prisma, FriendStatus, MatchStatus, MessageType, VlogType } from '../index'

const TOTAL_USERS = 10000
const TOTAL_MATCHES = 10000
const TOTAL_MESSAGES = 50000
const TOTAL_VLOGS = 10000
const TOTAL_CAREERS = 10000
const TOTAL_FRIENDS = 10000
const BATCH_SIZE = 1000

async function seedUsers() {
  const rows = Array.from({ length: TOTAL_USERS }, (_, index) => ({
    id: `seed_user_${index}`,
    username: `seed_user_${index}`,
    email: `seed_user_${index}@example.com`,
    passwordHash: '$2b$10$hX6DR0Y8Q8Y8Q8Y8Q8Y8Qu2j6rb4S6d0l0zP0Q2b3R4y5T6u7V8W2',
    nickname: `玩家 ${index}`,
    avatarUrl: `/avatars/${index % 27}.png`,
    badges: [],
    unlockedBadges: [],
    createdAt: new Date(),
    updatedAt: new Date()
  }))

  for (let index = 0; index < rows.length; index += BATCH_SIZE) {
    await prisma.user.createMany({
      data: rows.slice(index, index + BATCH_SIZE),
      skipDuplicates: true
    })
  }
}

async function seedCareers() {
  const rows = Array.from({ length: TOTAL_CAREERS }, (_, index) => ({
    id: `seed_career_${index}`,
    userId: `seed_user_${index % TOTAL_USERS}`,
    gameName: ['英雄联盟', '无畏契约', '原神', '三角洲行动'][index % 4],
    hours: 100 + (index % 500),
    rank: ['黄金', '白金', '钻石', '大师'][index % 4],
    createdAt: new Date(),
    updatedAt: new Date()
  }))

  for (let index = 0; index < rows.length; index += BATCH_SIZE) {
    await prisma.career.createMany({
      data: rows.slice(index, index + BATCH_SIZE),
      skipDuplicates: true
    })
  }
}

async function seedVlogs() {
  const rows = Array.from({ length: TOTAL_VLOGS }, (_, index) => ({
    id: `seed_vlog_${index}`,
    userId: `seed_user_${index % TOTAL_USERS}`,
    title: `测试 Vlog ${index}`,
    gameName: ['英雄联盟', '无畏契约', '原神', '三角洲行动'][index % 4],
    content: `这是第 ${index} 条游戏记录`,
    type: index % 2 === 0 ? VlogType.LOG : VlogType.VIDEO,
    videoUrl: index % 2 === 0 ? null : `https://example.com/video/${index}`,
    createdAt: new Date(),
    updatedAt: new Date()
  }))

  for (let index = 0; index < rows.length; index += BATCH_SIZE) {
    await prisma.vlog.createMany({
      data: rows.slice(index, index + BATCH_SIZE),
      skipDuplicates: true
    })
  }
}

async function seedMatches() {
  const rows = Array.from({ length: TOTAL_MATCHES }, (_, index) => ({
    id: `seed_match_${index}`,
    hostUserId: `seed_user_${index % TOTAL_USERS}`,
    gameName: ['英雄联盟', '无畏契约', '原神', '三角洲行动'][index % 4],
    personality: ['ACP-F', 'BTR-L', 'SEW-F'][index % 3],
    duration: ['1 小时', '2 小时', '3 小时'][index % 3],
    roomCode: `ROOM_${index}`,
    status: [MatchStatus.PENDING, MatchStatus.ACTIVE, MatchStatus.ENDED][index % 3],
    createdAt: new Date(),
    updatedAt: new Date()
  }))

  for (let index = 0; index < rows.length; index += BATCH_SIZE) {
    await prisma.match.createMany({
      data: rows.slice(index, index + BATCH_SIZE),
      skipDuplicates: true
    })
  }
}

async function seedFriends() {
  const rows = Array.from({ length: TOTAL_FRIENDS }, (_, index) => ({
    id: `seed_friend_${index}`,
    userId: `seed_user_${index % TOTAL_USERS}`,
    friendId: `seed_user_${(index + 1) % TOTAL_USERS}`,
    status: index % 5 === 0 ? FriendStatus.PENDING : FriendStatus.ACCEPTED,
    messageRetentionPolicy: index % 2 === 0 ? 'PRESERVE' : 'DELETE',
    createdAt: new Date(),
    updatedAt: new Date()
  }))

  for (let index = 0; index < rows.length; index += BATCH_SIZE) {
    await prisma.friend.createMany({
      data: rows.slice(index, index + BATCH_SIZE),
      skipDuplicates: true
    })
  }
}

async function seedMessages() {
  const rows = Array.from({ length: TOTAL_MESSAGES }, (_, index) => ({
    id: `seed_message_${index}`,
    matchId: index % 2 === 0 ? `seed_match_${index % TOTAL_MATCHES}` : null,
    senderId: `seed_user_${index % TOTAL_USERS}`,
    receiverId: index % 2 === 0 ? null : `seed_user_${(index + 2) % TOTAL_USERS}`,
    content: `测试消息 ${index}`,
    messageType: index % 2 === 0 ? MessageType.MATCH : MessageType.DIRECT,
    createdAt: new Date()
  }))

  for (let index = 0; index < rows.length; index += BATCH_SIZE) {
    await prisma.chatMessage.createMany({
      data: rows.slice(index, index + BATCH_SIZE),
      skipDuplicates: true
    })
  }
}

async function main() {
  await seedUsers()
  await seedCareers()
  await seedVlogs()
  await seedMatches()
  await seedFriends()
  await seedMessages()
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
