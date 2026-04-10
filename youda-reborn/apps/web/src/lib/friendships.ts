import { prisma } from '@/lib/db'

export type FriendMessageRetentionMode = 'PRESERVE' | 'DELETE'

export async function deleteFriendship(
  userId: string,
  friendId: string,
  mode?: FriendMessageRetentionMode
) {
  return prisma.$transaction(async (tx) => {
    const friendships = await tx.friend.findMany({
      where: {
        OR: [
          { userId, friendId },
          { userId: friendId, friendId: userId }
        ]
      }
    })

    if (friendships.length === 0) {
      return {
        deletedFriendships: 0,
        deletedMessages: 0,
        retentionPolicy: mode ?? 'PRESERVE'
      }
    }

    const retentionPolicy =
      mode ??
      (friendships.some((friendship) => friendship.messageRetentionPolicy === 'DELETE')
        ? 'DELETE'
        : 'PRESERVE')

    const deletedMessages =
      retentionPolicy === 'DELETE'
        ? await tx.chatMessage.deleteMany({
            where: {
              OR: [
                { senderId: userId, receiverId: friendId },
                { senderId: friendId, receiverId: userId }
              ]
            }
          })
        : { count: 0 }

    const deletedFriendships = await tx.friend.deleteMany({
      where: {
        OR: [
          { userId, friendId },
          { userId: friendId, friendId: userId }
        ]
      }
    })

    return {
      deletedFriendships: deletedFriendships.count,
      deletedMessages: deletedMessages.count,
      retentionPolicy
    }
  })
}
