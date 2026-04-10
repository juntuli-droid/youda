"use client"

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Image as ImageIcon, Mic, Minus, Send, Smile, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { EmptyStateCard } from '@/components/empty/EmptyStateCard'
import { DirectMessageEntry, FriendListEntry } from '@/components/friends/types'

type PrivateChatProps = {
  friend: FriendListEntry
  currentUserId?: string
  onClose: () => void
}

function formatMessageTime(value: string) {
  return new Date(value).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function PrivateChat({
  friend,
  currentUserId,
  onClose
}: PrivateChatProps) {
  const [messages, setMessages] = useState<DirectMessageEntry[]>([])
  const [inputText, setInputText] = useState('')
  const [isMinimized, setIsMinimized] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const latestTimestampRef = useRef<string | undefined>(undefined)

  const loadMessages = useCallback(async (incremental = false) => {
    if (!incremental) {
      setIsLoading(true)
    }

    try {
      const query = new URLSearchParams({
        peerId: friend.peerId,
        limit: '100'
      })

      if (incremental && latestTimestampRef.current) {
        query.set('since', latestTimestampRef.current)
      }

      const response = await fetch(`/api/social/messages?${query.toString()}`, {
        cache: 'no-store'
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error ?? '聊天记录加载失败')
      }

      const nextMessages: DirectMessageEntry[] = data.messages ?? []
      setMessages((current) => {
        if (!incremental) {
          return nextMessages
        }

        const knownIds = new Set(current.map((item) => item.id))
        return [...current, ...nextMessages.filter((item) => !knownIds.has(item.id))]
      })

      const latest = nextMessages[nextMessages.length - 1]
      if (latest?.createdAt) {
        latestTimestampRef.current = latest.createdAt
      }

      const unreadIncoming = nextMessages.filter(
        (message) =>
          message.senderId === friend.peerId &&
          !message.receipts.some((receipt) => receipt.readAt)
      )

      await Promise.all(
        unreadIncoming.map((message) =>
          fetch(`/api/social/messages/${message.id}/read`, { method: 'POST' })
        )
      )

      setError(null)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : '聊天记录加载失败')
    } finally {
      setIsLoading(false)
    }
  }, [friend.peerId])

  useEffect(() => {
    setMessages([])
    latestTimestampRef.current = undefined
    void loadMessages()

    const timer = window.setInterval(() => {
      if (document.visibilityState !== 'visible' || isMinimized) {
        return
      }

      void loadMessages(true)
    }, process.env.NODE_ENV === 'production' ? 5000 : 8000)

    return () => {
      window.clearInterval(timer)
    }
  }, [friend.peerId, isMinimized, loadMessages])

  useEffect(() => {
    if (!isMinimized) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [isMinimized, messages])

  const lastOutgoingReceipt = useMemo(() => {
    const lastOutgoing = [...messages]
      .reverse()
      .find((message) => message.senderId === currentUserId && !message.recalledAt)

    if (!lastOutgoing) {
      return null
    }

    const receipt = lastOutgoing.receipts[0]
    if (!receipt) {
      return '发送中'
    }

    if (receipt.readAt) {
      return '已读'
    }

    if (receipt.deliveredAt) {
      return '已送达'
    }

    return '发送中'
  }, [currentUserId, messages])

  const handleSend = async (event: FormEvent) => {
    event.preventDefault()
    if (!inputText.trim()) {
      return
    }

    setIsSending(true)

    try {
      const response = await fetch('/api/social/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          receiverId: friend.peerId,
          content: inputText.trim(),
          contentType: 'TEXT',
          clientMessageId: `${Date.now()}-${Math.random().toString(16).slice(2)}`
        })
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error ?? '发送失败')
      }

      setInputText('')
      await loadMessages(true)
    } catch (sendError) {
      window.alert(sendError instanceof Error ? sendError.message : '发送失败')
    } finally {
      setIsSending(false)
    }
  }

  const handleSendAttachment = async (contentType: 'IMAGE' | 'VOICE') => {
    const attachmentUrl = window.prompt(
      contentType === 'IMAGE' ? '请输入图片 URL' : '请输入语音 URL'
    )

    if (!attachmentUrl) {
      return
    }

    const response = await fetch('/api/social/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        receiverId: friend.peerId,
        content: contentType === 'IMAGE' ? '[图片消息]' : '[语音消息]',
        contentType,
        attachmentUrl,
        clientMessageId: `${Date.now()}-${Math.random().toString(16).slice(2)}`
      })
    })
    const data = await response.json()

    if (!response.ok) {
      window.alert(data.error ?? '发送附件失败')
      return
    }

    await loadMessages(true)
  }

  const handleRecall = async (messageId: string) => {
    const response = await fetch(`/api/social/messages/${messageId}/recall`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        reason: '用户主动撤回'
      })
    })

    const data = await response.json()
    if (!response.ok) {
      window.alert(data.error ?? '撤回失败')
      return
    }

    await loadMessages(true)
  }

  if (isMinimized) {
    return (
      <div
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-0 right-80 z-50 mr-6 flex w-64 cursor-pointer items-center justify-between rounded-t-xl border border-[#E3E5E8] border-b-0 bg-white p-3 shadow-[0_-5px_20px_rgba(0,0,0,0.1)] transition-colors hover:bg-[#F7F9FC]"
      >
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-[#E3E5E8] bg-[#F2F3F5]">
            {friend.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={friend.avatarUrl}
                alt={friend.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-xs font-black">{friend.name.slice(0, 1)}</span>
            )}
          </div>
          <span className="max-w-[120px] truncate text-sm font-bold text-[#181A1F]">
            {friend.name}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-2 w-2 rounded-full bg-kook-brand" />
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-[#8D93A5] hover:text-red-500"
            onClick={(event) => {
              event.stopPropagation()
              onClose()
            }}
          >
            <X size={14} />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed bottom-0 right-80 z-50 mr-6 flex h-[520px] w-[360px] flex-col overflow-hidden rounded-t-2xl border border-[#E3E5E8] border-b-0 bg-white shadow-[0_-5px_30px_rgba(0,0,0,0.15)]">
      <div className="flex items-center justify-between bg-[#181A1F] px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 border-[#33353A] bg-[#F2F3F5]">
              {friend.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={friend.avatarUrl}
                  alt={friend.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-sm font-black text-[#181A1F]">
                  {friend.name.slice(0, 1)}
                </span>
              )}
            </div>
            <div
              className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-[#181A1F] ${
                friend.status === 'online'
                  ? 'bg-kook-brand'
                  : friend.status === 'gaming'
                    ? 'bg-[#5C6BFF]'
                    : 'bg-[#C4C9D2]'
              }`}
            />
          </div>
          <div>
            <div className="max-w-[160px] truncate text-sm font-bold text-white">
              {friend.name}
            </div>
            <div className="text-xs text-[#8D93A5]">
              {friend.status === 'gaming' ? '匹配中' : friend.status === 'online' ? '在线' : '离线'}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-[#8D93A5] hover:bg-white/10 hover:text-white"
            onClick={() => setIsMinimized(true)}
          >
            <Minus size={18} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-[#8D93A5] hover:bg-white/10 hover:text-red-500"
            onClick={onClose}
          >
            <X size={18} />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-[#F7F9FC] p-4">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-14 animate-pulse rounded-2xl bg-white"
              />
            ))}
          </div>
        ) : null}

        {!isLoading && error ? (
          <EmptyStateCard
            scenario="network-error"
            icon="📡"
            onAction={() => void loadMessages()}
            className="mt-12"
          />
        ) : null}

        {!isLoading && !error && messages.length === 0 ? (
          <EmptyStateCard
            scenario="no-messages"
            icon="💬"
            onAction={() => {
              const input = document.getElementById('private-chat-input')
              if (input instanceof HTMLInputElement) {
                input.focus()
              }
            }}
            className="mt-12"
          />
        ) : null}

        {!isLoading && !error && messages.length > 0
          ? messages.map((message) => {
              const isSelf = message.senderId === currentUserId
              const isRecalled = Boolean(message.recalledAt)

              return (
                <div
                  key={message.id}
                  className={`mb-4 flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}
                >
                  <div className="mb-1 flex items-baseline gap-2">
                    <span className="text-[10px] text-[#8D93A5]/70">
                      {formatMessageTime(message.createdAt)}
                    </span>
                    {isSelf && !isRecalled ? (
                      <button
                        type="button"
                        onClick={() => void handleRecall(message.id)}
                        className="text-[10px] font-bold text-[#8D93A5] hover:text-[#181A1F]"
                      >
                        撤回
                      </button>
                    ) : null}
                  </div>
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm font-medium ${
                      isSelf
                        ? 'rounded-tr-sm bg-kook-brand text-white'
                        : 'rounded-tl-sm border border-[#E3E5E8] bg-white text-[#181A1F] shadow-sm'
                    }`}
                  >
                    {isRecalled ? (
                      <span className="italic opacity-70">消息已撤回</span>
                    ) : message.contentType === 'IMAGE' && message.attachmentUrl ? (
                      <a
                        href={message.attachmentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="underline underline-offset-2"
                      >
                        查看图片
                      </a>
                    ) : message.contentType === 'VOICE' && message.attachmentUrl ? (
                      <a
                        href={message.attachmentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="underline underline-offset-2"
                      >
                        播放语音
                      </a>
                    ) : (
                      message.content
                    )}
                  </div>
                </div>
              )
            })
          : null}
        <div ref={chatEndRef} />
      </div>

      <div className="border-t border-[#E3E5E8] bg-white p-3">
        <div className="mb-2 flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="min-h-12 min-w-12 text-[#8D93A5] transition-colors hover:text-[#181A1F]"
              onClick={() => void handleSendAttachment('IMAGE')}
              aria-label="发送图片消息"
            >
              <ImageIcon size={18} />
            </button>
            <button
              type="button"
              className="min-h-12 min-w-12 text-[#8D93A5] transition-colors hover:text-[#181A1F]"
              onClick={() => void handleSendAttachment('VOICE')}
              aria-label="发送语音消息"
            >
              <Mic size={18} />
            </button>
            <button
              type="button"
              className="min-h-12 min-w-12 text-[#8D93A5] transition-colors hover:text-[#181A1F]"
              aria-label="表情占位"
            >
              <Smile size={18} />
            </button>
          </div>
          {lastOutgoingReceipt ? (
            <div className="text-xs font-bold text-[#8D93A5]">{lastOutgoingReceipt}</div>
          ) : null}
        </div>
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            id="private-chat-input"
            type="text"
            value={inputText}
            onChange={(event) => setInputText(event.target.value)}
            placeholder="发送消息..."
            className="flex-1 rounded-xl bg-[#F2F3F5] px-3 py-2 text-sm text-[#181A1F] placeholder:text-[#8D93A5] focus:outline-none focus:ring-1 focus:ring-kook-brand/50"
          />
          <Button
            type="submit"
            variant="kook-brand"
            size="sm"
            className="h-auto rounded-xl px-3 shadow-sm"
            disabled={!inputText.trim() || isSending}
          >
            <Send size={16} />
          </Button>
        </form>
      </div>
    </div>
  )
}
