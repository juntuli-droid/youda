export interface FriendListEntry {
  id: string
  peerId: string
  publicId: string
  name: string
  avatarUrl?: string
  status: 'online' | 'offline' | 'gaming'
  personality?: string
  unreadCount: number
}

export interface DirectMessageEntry {
  id: string
  senderId: string
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
