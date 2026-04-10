export interface MatchFilters {
  game: string
  personality: string
  size: string
  duration: string
  language: string
  region: string
  gender: string
  ageRange: string
  interests: string[]
  mbtiType?: string
  mbtiTitle?: string
}

export interface MatchQueueState {
  queueEntryId: string
  status: string
  mode?: 'match' | 'test'
  matchId?: string
  roomCode?: string
  roomPersonality?: string
  matchedUser?: {
    id: string
    displayName: string
    avatarUrl?: string
    mbtiType?: string
  }
}
