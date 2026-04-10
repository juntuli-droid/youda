"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MessageCircle, Search, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { EmptyStateCard } from '@/components/empty/EmptyStateCard'
import { FriendListEntry } from '@/components/friends/types'

type PendingRequest = {
  id: string
  requesterId: string
  requester: {
    id: string
    publicId: string
    displayName: string
    avatarUrl?: string
  }
  createdAt: string
}

type SearchResult = {
  id: string
  publicId: string
  displayName: string
  avatarUrl?: string
  status: 'online' | 'offline' | 'gaming'
  relationStatus: 'friend' | 'pending_incoming' | 'pending_outgoing' | 'none'
}

type FriendSidebarProps = {
  activePeerId?: string
  onOpenChat: (friend: FriendListEntry) => void
}

function getRelationLabel(status: SearchResult['relationStatus']) {
  switch (status) {
    case 'friend':
      return '已是好友'
    case 'pending_incoming':
      return '待你接受'
    case 'pending_outgoing':
      return '等待通过'
    default:
      return '加好友'
  }
}

export function FriendSidebar({ activePeerId, onOpenChat }: FriendSidebarProps) {
  const router = useRouter()
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'online'>('all')
  const [friends, setFriends] = useState<FriendListEntry[]>([])
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([])
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [isUnauthorized, setIsUnauthorized] = useState(false)

  const loadFriends = useCallback(async (background = false) => {
    if (!background) {
      setIsLoading(true)
      setError(null)
    }

    try {
      const response = await fetch('/api/social/friends', {
        cache: 'no-store'
      })
      const data = await response.json()

      if (response.status === 401) {
        setIsUnauthorized(true)
        return
      }

      if (!response.ok) {
        throw new Error(data.error ?? '好友列表加载失败')
      }

      setIsUnauthorized(false)
      setFriends(
        (data.friends ?? []).map((friend: {
          id: string
          counterpartUserId: string
          publicId: string
          displayName: string
          avatarUrl?: string
          status: 'online' | 'offline' | 'gaming'
          personality?: string
          unreadCount?: number
        }) => ({
          id: friend.id,
          peerId: friend.counterpartUserId,
          publicId: friend.publicId,
          name: friend.displayName,
          avatarUrl: friend.avatarUrl,
          status: friend.status,
          personality: friend.personality,
          unreadCount: activePeerId === friend.counterpartUserId ? 0 : friend.unreadCount ?? 0
        }))
      )
      setPendingRequests(data.pendingRequests ?? [])
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : '好友列表加载失败')
    } finally {
      if (!background) {
        setIsLoading(false)
      }
    }
  }, [activePeerId])

  useEffect(() => {
    void loadFriends()
    const timer = window.setInterval(() => {
      if (document.visibilityState !== 'visible') {
        return
      }

      void loadFriends(true)
    }, process.env.NODE_ENV === 'production' ? 10000 : 20000)

    return () => {
      window.clearInterval(timer)
    }
  }, [loadFriends])

  useEffect(() => {
    if (!activePeerId) {
      return
    }

    setFriends((current) =>
      current.map((friend) =>
        friend.peerId === activePeerId
          ? {
              ...friend,
              unreadCount: 0
            }
          : friend
      )
    )
  }, [activePeerId])

  useEffect(() => {
    const query = searchQuery.trim()
    if (query.length < 2) {
      setSearchResults([])
      setSearchError(null)
      setIsSearching(false)
      return
    }

    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      setIsSearching(true)
      setSearchError(null)

      try {
        const response = await fetch(`/api/social/users/search?q=${encodeURIComponent(query)}`, {
          cache: 'no-store',
          signal: controller.signal
        })
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error ?? '搜索用户失败')
        }

        setSearchResults(data.results ?? [])
      } catch (searchLoadError) {
        if (controller.signal.aborted) {
          return
        }

        setSearchError(searchLoadError instanceof Error ? searchLoadError.message : '搜索用户失败')
      } finally {
        if (!controller.signal.aborted) {
          setIsSearching(false)
        }
      }
    }, 260)

    return () => {
      controller.abort()
      window.clearTimeout(timer)
    }
  }, [searchQuery])

  const filteredFriends = useMemo(
    () =>
      friends.filter((friend) => {
        const normalizedQuery = searchQuery.trim().toLowerCase()
        const matchesSearch =
          normalizedQuery.length === 0 ||
          friend.name.toLowerCase().includes(normalizedQuery) ||
          friend.publicId.toLowerCase().includes(normalizedQuery)
        const matchesTab = activeTab === 'all' || friend.status !== 'offline'
        return matchesSearch && matchesTab
      }),
    [activeTab, friends, searchQuery]
  )

  const handleAddFriend = async (identifier?: string) => {
    const targetIdentifier =
      identifier?.trim() ?? window.prompt('请输入要添加的有搭 ID 或用户名')?.trim()

    if (!targetIdentifier) {
      return
    }

    const response = await fetch('/api/social/friends', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ identifier: targetIdentifier })
    })
    const data = await response.json()

    if (!response.ok) {
      window.alert(data.error ?? '发送好友申请失败')
      return
    }

    window.alert(data.message ?? '好友申请已发送')
    void loadFriends()
    if (searchQuery.trim().length >= 2) {
      setSearchQuery(searchQuery.trim())
    }
  }

  const handleAccept = async (requesterId: string) => {
    const response = await fetch(`/api/social/friends/${requesterId}/accept`, {
      method: 'POST'
    })
    const data = await response.json()

    if (!response.ok) {
      window.alert(data.error ?? '接受好友申请失败')
      return
    }

    void loadFriends()
  }

  const openChat = (friend: FriendListEntry) => {
    setFriends((current) =>
      current.map((item) =>
        item.peerId === friend.peerId
          ? {
              ...item,
              unreadCount: 0
            }
          : item
      )
    )
    onOpenChat(friend)
  }

  return (
    <div className="glass-panel flex min-h-[420px] flex-col overflow-hidden bg-white/70">
      <div className="border-b border-[#E3E5E8] p-4">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-black text-[#181A1F]">好友列表</h3>
          <Button
            variant="ghost"
            size="sm"
            className="h-12 w-12 rounded-full p-0 text-[#5C6068] hover:bg-[#F2F3F5]"
            aria-label="添加好友"
            onClick={() => {
              searchInputRef.current?.focus()
              void handleAddFriend()
            }}
          >
            <UserPlus size={18} />
          </Button>
        </div>

        <div className="relative mb-2">
          <input
            ref={searchInputRef}
            type="text"
            placeholder="搜索好友昵称、用户名或有搭 ID..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="w-full rounded-xl border border-transparent bg-[#F2F3F5] py-2 pl-9 pr-4 text-sm text-[#181A1F] transition-colors placeholder:text-[#8D93A5] focus:border-kook-brand focus:bg-white focus:outline-none"
          />
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8D93A5]"
          />
        </div>
        <p className="mb-4 text-xs font-medium text-[#8D93A5]">
          输入有搭 ID 可以直接搜到人，也支持用户名和昵称。
        </p>

        <div className="flex gap-4 border-b border-[#E3E5E8] px-1">
          <button
            onClick={() => setActiveTab('all')}
            className={`border-b-2 pb-2 text-sm font-bold transition-colors ${activeTab === 'all' ? 'border-kook-brand text-[#181A1F]' : 'border-transparent text-[#8D93A5] hover:text-[#5C6068]'}`}
          >
            全部
          </button>
          <button
            onClick={() => setActiveTab('online')}
            className={`border-b-2 pb-2 text-sm font-bold transition-colors ${activeTab === 'online' ? 'border-kook-brand text-[#181A1F]' : 'border-transparent text-[#8D93A5] hover:text-[#5C6068]'}`}
          >
            在线
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {pendingRequests.length > 0 ? (
          <div className="mb-4 rounded-2xl border border-kook-brand/20 bg-kook-brand/5 p-3">
            <div className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-kook-brand">
              待处理好友申请
            </div>
            <div className="space-y-2">
              {pendingRequests.slice(0, 3).map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between gap-3 rounded-xl bg-white p-3 shadow-sm"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-bold text-[#181A1F]">
                      {request.requester.displayName}
                    </div>
                    <div className="truncate text-xs font-medium text-[#8D93A5]">
                      {request.requester.publicId} · 申请时间 {new Date(request.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="min-h-12"
                    onClick={() => void handleAccept(request.requesterId)}
                  >
                    接受
                  </Button>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {searchQuery.trim().length >= 2 ? (
          <div className="mb-4 rounded-2xl border border-[#E3E5E8] bg-white/80 p-3">
            <div className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-[#8D93A5]">
              搜索结果
            </div>

            {isSearching ? (
              <div className="rounded-xl bg-[#F7F9FC] px-3 py-4 text-center text-sm font-medium text-[#8D93A5]">
                正在搜索...
              </div>
            ) : null}

            {!isSearching && searchError ? (
              <div className="rounded-xl bg-red-50 px-3 py-4 text-sm font-medium text-red-500">
                {searchError}
              </div>
            ) : null}

            {!isSearching && !searchError && searchResults.length === 0 ? (
              <div className="rounded-xl bg-[#F7F9FC] px-3 py-4 text-center text-sm font-medium text-[#8D93A5]">
                没有搜到相关用户
              </div>
            ) : null}

            {!isSearching && !searchError && searchResults.length > 0 ? (
              <div className="space-y-2">
                {searchResults.map((result) => (
                  <div
                    key={result.id}
                    className="flex items-center gap-3 rounded-xl border border-[#E3E5E8] bg-white p-3"
                  >
                    <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-[#E3E5E8] bg-[#F2F3F5]">
                      {result.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={result.avatarUrl}
                          alt={result.displayName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-black text-[#8D93A5]">
                          {result.displayName.slice(0, 1)}
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-bold text-[#181A1F]">
                        {result.displayName}
                      </div>
                      <div className="truncate text-xs font-medium text-[#8D93A5]">
                        {result.publicId}
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant={result.relationStatus === 'none' ? 'kook-brand' : 'outline'}
                      className="min-h-10 min-w-[88px]"
                      disabled={result.relationStatus !== 'none'}
                      onClick={() => void handleAddFriend(result.id)}
                    >
                      {getRelationLabel(result.relationStatus)}
                    </Button>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        {isLoading ? (
          <div className="space-y-3 p-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-16 animate-pulse rounded-2xl bg-[#F2F3F5]"
              />
            ))}
          </div>
        ) : null}

        {!isLoading && isUnauthorized ? (
          <EmptyStateCard
            scenario="permission-denied"
            icon="🔐"
            onAction={() => router.push('/login?callbackUrl=/profile')}
          />
        ) : null}

        {!isLoading && error ? (
          <EmptyStateCard
            scenario="network-error"
            icon="📡"
            onAction={() => void loadFriends()}
          />
        ) : null}

        {!isLoading && !error && !isUnauthorized && filteredFriends.length > 0
          ? filteredFriends.map((friend) => (
              <div
                key={`${friend.peerId}-${friend.id}`}
                onClick={() => openChat(friend)}
                className="group flex cursor-pointer items-center gap-3 rounded-xl p-2 transition-colors hover:bg-[#F2F3F5]"
              >
                <div className="relative">
                  <div className="h-10 w-10 overflow-hidden rounded-full border border-[#E3E5E8] bg-white">
                    {friend.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={friend.avatarUrl}
                        alt={friend.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-sm font-black text-[#8D93A5]">
                        {friend.name.slice(0, 1)}
                      </div>
                    )}
                  </div>
                  <div
                    className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white ${
                      friend.status === 'online'
                        ? 'bg-kook-brand'
                        : friend.status === 'gaming'
                          ? 'bg-[#5C6BFF]'
                          : 'bg-[#C4C9D2]'
                    }`}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="truncate text-sm font-bold text-[#181A1F]">
                      {friend.name}
                    </div>
                    {friend.unreadCount > 0 && friend.peerId !== activePeerId ? (
                      <span className="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-[#FF4D4F] px-1.5 py-0.5 text-[10px] font-black leading-none text-white">
                        {friend.unreadCount > 99 ? '99+' : friend.unreadCount}
                      </span>
                    ) : null}
                  </div>
                  <div className="truncate text-xs font-medium text-[#8D93A5]">
                    {friend.status === 'gaming' ? '匹配中' : friend.personality ?? '资料待完善'}
                  </div>
                </div>

                <div className="opacity-0 transition-opacity group-hover:opacity-100">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-12 w-12 rounded-full p-0 text-[#8D93A5] hover:text-[#181A1F]"
                    aria-label={`与 ${friend.name} 聊天`}
                  >
                    <MessageCircle size={16} />
                  </Button>
                </div>
              </div>
            ))
          : null}

        {!isLoading &&
        !error &&
        !isUnauthorized &&
        friends.length === 0 &&
        searchQuery.length === 0 ? (
          <EmptyStateCard
            scenario="no-friends"
            icon="🎧"
            className="px-5 py-7"
            onAction={() => router.push('/match')}
          />
        ) : null}

        {!isLoading &&
        !error &&
        !isUnauthorized &&
        friends.length > 0 &&
        filteredFriends.length === 0 &&
        searchQuery.trim().length < 2 ? (
          <EmptyStateCard
            scenario="search-empty"
            icon="🔎"
            className="px-5 py-7"
            onAction={() => router.push('/match')}
          />
        ) : null}
      </div>
    </div>
  )
}
