"use client"

import { FormEvent, useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import {
  MessageSquare,
  Mic,
  MicOff,
  PhoneOff,
  Send,
  Smile,
  UserPlus
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { EmptyStateCard } from '@/components/empty/EmptyStateCard'
import { MatchFilters, MatchQueueState } from '@/components/match/types'
import { useVoiceRoomAudio } from '@/lib/use-voice-room-audio'

/* eslint-disable @next/next/no-img-element */

type MatchRoomMessage = {
  id: string
  senderId: string
  content: string
  contentType: 'TEXT' | 'IMAGE' | 'VOICE'
  attachmentUrl?: string
  recalledAt?: string
  createdAt: string
}

interface VoiceRoomProps {
  filters: MatchFilters
  queueState: MatchQueueState | null
  onLeave: () => void
}

export default function VoiceRoom({
  filters,
  queueState,
  onLeave
}: VoiceRoomProps) {
  const [currentUser, setCurrentUser] = useState<{
    id: string
    displayName: string
    avatarUrl?: string
  } | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [messages, setMessages] = useState<MatchRoomMessage[]>([])
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showPartnerLeftNotice, setShowPartnerLeftNotice] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const latestTimestampRef = useRef<string | undefined>(undefined)
  const testMode = queueState?.mode === 'test'
  const {
    diagnostics,
    localAudioRef,
    remoteAudioRef,
    controls
  } = useVoiceRoomAudio({
    roomCode: queueState?.roomCode,
    matchId: queueState?.matchId,
    enabled: true,
    testMode
  })

  const loadMessages = useCallback(async (incremental = false) => {
    if (!queueState?.matchId || testMode) {
      if (!incremental) {
        setMessages([
          {
            id: 'system-test-room',
            senderId: 'system',
            content:
              '测试语音房已就绪。当前房间会直接启用麦克风、降噪、AGC 和本地/同浏览器多标签 RTC 自测链路。',
            contentType: 'TEXT',
            createdAt: new Date().toISOString()
          }
        ])
        setIsLoading(false)
      }
      return
    }

    if (!incremental) {
      setIsLoading(true)
    }

    try {
      const query = new URLSearchParams({ matchId: queueState.matchId })
      if (incremental && latestTimestampRef.current) {
        query.set('since', latestTimestampRef.current)
      }

      const response = await fetch(`/api/match/room/messages?${query.toString()}`, {
        cache: 'no-store'
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error ?? '房间消息加载失败')
      }

      const nextMessages: MatchRoomMessage[] = data.messages ?? []
      setMessages((current) => {
        if (!incremental) {
          return nextMessages
        }
        const ids = new Set(current.map((item) => item.id))
        return [...current, ...nextMessages.filter((item) => !ids.has(item.id))]
      })

      const latest = nextMessages[nextMessages.length - 1]
      if (latest?.createdAt) {
        latestTimestampRef.current = latest.createdAt
      }

      setError(null)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : '房间消息加载失败')
    } finally {
      setIsLoading(false)
    }
  }, [queueState?.matchId, testMode])

  useEffect(() => {
    setMessages([])
    latestTimestampRef.current = undefined
    void loadMessages()

    const timer = window.setInterval(() => {
      if (document.visibilityState !== 'visible') {
        return
      }

      void loadMessages(true)
    }, process.env.NODE_ENV === 'production' ? 5000 : 8000)

    return () => {
      window.clearInterval(timer)
    }
  }, [loadMessages, queueState?.matchId])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    let disposed = false

    const loadCurrentUser = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          cache: 'no-store'
        })
        const data = await response.json()

        if (!response.ok || !data.user || disposed) {
          return
        }

        setCurrentUser({
          id: data.user.id,
          displayName: data.user.nickname ?? data.user.username,
          avatarUrl: data.user.avatarUrl ?? undefined
        })
      } catch {
        // Ignore self-profile load failures and fall back to a local placeholder.
      }
    }

    void loadCurrentUser()

    return () => {
      disposed = true
    }
  }, [])

  useEffect(() => {
    if (!diagnostics.remotePeerLeft || testMode) {
      setShowPartnerLeftNotice(false)
      return
    }

    setShowPartnerLeftNotice(true)
    const timer = window.setTimeout(() => {
      onLeave()
    }, 2600)

    return () => {
      window.clearTimeout(timer)
    }
  }, [diagnostics.remotePeerLeft, onLeave, testMode])

  const handleSendMessage = async (event: FormEvent) => {
    event.preventDefault()
    if (!inputText.trim()) {
      return
    }

    if (testMode) {
      setMessages((current) => [
        ...current,
        {
          id: `local-${Date.now()}`,
          senderId: 'self',
          content: inputText.trim(),
          contentType: 'TEXT',
          createdAt: new Date().toISOString()
        }
      ])
      setInputText('')
      return
    }

    if (!queueState?.matchId) {
      return
    }

    const response = await fetch('/api/match/room/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        matchId: queueState.matchId,
        content: inputText.trim(),
        contentType: 'TEXT',
        clientMessageId: `${Date.now()}-${Math.random().toString(16).slice(2)}`
      })
    })
    const data = await response.json()

    if (!response.ok) {
      window.alert(data.error ?? '发送失败')
      return
    }

    setInputText('')
    await loadMessages(true)
  }

  const teammateName = queueState?.matchedUser?.displayName ?? '匹配队友'
  const teammateAvatar = queueState?.matchedUser?.avatarUrl
  const selfAvatar = currentUser?.avatarUrl

  const renderAvatar = (
    avatarUrl: string | undefined,
    fallbackText: string,
    alt: string
  ) => {
    if (avatarUrl) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarUrl} alt={alt} className="h-full w-full object-cover" />
      )
    }

    return (
      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#F7F9FC] to-[#E9EEF7] text-2xl font-black text-[#8D93A5]">
        {fallbackText.slice(0, 1).toUpperCase()}
      </div>
    )
  }

  if (showPartnerLeftNotice) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="mt-10 w-full max-w-[680px]"
      >
        <EmptyStateCard
          scenario="partner-left-room"
          icon="👋"
          actionLabel="立即返回"
          onAction={onLeave}
          className="px-8 py-10"
        />
        <p className="mt-4 text-center text-sm font-medium text-[#8D93A5]">
          2.6 秒后自动返回匹配主页
        </p>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="mt-6 grid h-[80vh] w-full max-w-[1200px] grid-cols-1 gap-6 lg:grid-cols-4"
    >
      <audio ref={localAudioRef} autoPlay playsInline />
      <audio ref={remoteAudioRef} autoPlay playsInline />
      <div className="flex flex-col overflow-hidden rounded-3xl border border-[#E3E5E8] bg-white shadow-sm lg:col-span-3">
        <div className="flex items-center justify-between border-b border-[#E3E5E8] bg-[#F7F9FC] px-6 py-4">
          <div>
            <h2 className="text-xl font-black text-[#181A1F]">{filters.game} 匹配房间</h2>
            <p className="text-sm font-medium text-[#5C6068]">
              目标风格: {filters.personality} · {filters.region}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-bold ${
              diagnostics.connected ? 'bg-kook-brand/10 text-kook-brand' : 'bg-red-50 text-red-500'
            }`}>
              <span className={`h-2 w-2 rounded-full ${diagnostics.connected ? 'animate-pulse bg-kook-brand' : 'bg-red-400'}`} />
              {diagnostics.connected ? (diagnostics.remoteConnected ? '语音链路已建立' : '麦克风已连接') : '语音初始化中'}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={onLeave}
              className="border-red-200 text-red-500 hover:bg-red-50"
            >
              <PhoneOff size={16} className="mr-1" /> 退出房间
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 bg-[#F2F3F5] p-6 sm:grid-cols-3 md:grid-cols-4">
          <div className="group relative flex flex-col items-center gap-2">
            <div className="relative">
              <div
                className={`flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border-2 bg-white ${
                  isMuted
                    ? 'border-[#E3E5E8]'
                    : 'border-kook-brand shadow-[0_0_15px_rgba(46,211,158,0.5)]'
                }`}
              >
                {renderAvatar(
                  selfAvatar,
                  currentUser?.displayName ?? '我',
                  currentUser?.displayName ?? '我'
                )}
              </div>
              <div className="absolute -bottom-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full border border-[#E3E5E8] bg-white shadow-sm">
                {diagnostics.muted || !diagnostics.connected ? (
                  <MicOff size={12} className="text-red-500" />
                ) : (
                  <Mic size={12} className="text-kook-brand" />
                )}
              </div>
            </div>
            <span className="cursor-pointer text-sm font-bold text-[#181A1F]">你</span>
          </div>

          <div className="group relative flex flex-col items-center gap-2">
            <div className="relative">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border-2 border-transparent bg-white shadow-sm">
                {renderAvatar(teammateAvatar, teammateName, teammateName)}
              </div>
              <div className="absolute -bottom-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full border border-[#E3E5E8] bg-white shadow-sm">
                <Mic size={12} className="text-kook-brand" />
              </div>
            </div>
            <div className="flex items-center gap-1">
              <span className="max-w-[96px] truncate text-sm font-bold text-[#181A1F]">
                {teammateName}
              </span>
              <button
                className="text-[#8D93A5] transition-colors hover:text-[#2ED39E]"
                title="发送好友请求"
                onClick={async () => {
                  if (!queueState?.matchedUser?.id) {
                    return
                  }

                  const response = await fetch('/api/social/friends', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                      friendId: queueState.matchedUser.id
                    })
                  })
                  const data = await response.json()
                  window.alert(response.ok ? '好友申请已发送' : data.error ?? '发送失败')
                }}
              >
                <UserPlus size={14} />
              </button>
            </div>
            <span className="rounded-sm border border-[#E3E5E8] bg-white px-2 py-0.5 text-[10px] text-[#5C6068] shadow-sm">
              {queueState?.matchedUser?.mbtiType ?? filters.mbtiType ?? filters.personality}
            </span>
          </div>
        </div>

        <div className="flex flex-1 flex-col bg-white">
          <div className="flex-1 overflow-y-auto p-6">
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-12 animate-pulse rounded-2xl bg-[#F2F3F5]"
                  />
                ))}
              </div>
            ) : null}

            {!isLoading && error ? (
              <EmptyStateCard
                scenario="network-error"
                icon="📡"
                onAction={() => void loadMessages()}
              />
            ) : null}

            {!isLoading && !error && messages.length === 0 ? (
              <EmptyStateCard
                scenario="no-messages"
                icon="🎙️"
                actionLabel="发起房间对话"
                onAction={() => {
                  const input = document.getElementById('match-room-input')
                  if (input instanceof HTMLInputElement) {
                    input.focus()
                  }
                }}
              />
            ) : null}

            {!isLoading && !error && messages.length > 0
              ? messages.map((message) => {
                  const isSystem = message.senderId === 'system'
                  const isSelf =
                    message.senderId === 'self' ||
                    !queueState?.matchedUser ||
                    message.senderId !== queueState.matchedUser.id
                  return (
                    <div
                      key={message.id}
                      className={`mb-4 flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}
                    >
                      <div className="mb-1 flex items-baseline gap-2">
                        <span className="text-xs font-bold text-[#8D93A5]">
                          {isSystem ? '系统' : isSelf ? '我' : teammateName}
                        </span>
                        <span className="text-[10px] text-[#8D93A5]/70">
                          {new Date(message.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm font-medium ${
                          isSelf
                            ? 'rounded-tr-sm bg-kook-brand text-white'
                            : isSystem
                              ? 'mx-auto rounded-full bg-[#F2F3F5] text-xs text-[#8D93A5]'
                              : 'rounded-tl-sm border border-[#E3E5E8] bg-[#F7F9FC] text-[#181A1F]'
                        }`}
                      >
                        {message.contentType !== 'TEXT' && message.attachmentUrl ? (
                          <a
                            href={message.attachmentUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="underline underline-offset-2"
                          >
                            {message.contentType === 'IMAGE' ? '查看图片' : '播放语音'}
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

          <div className="border-t border-[#E3E5E8] bg-white p-4">
            <form onSubmit={handleSendMessage} className="flex gap-3">
              <div className="relative flex-1">
                <input
                  id="match-room-input"
                  type="text"
                  value={inputText}
                  onChange={(event) => setInputText(event.target.value)}
                  placeholder="发送消息到房间..."
                  className="w-full rounded-xl bg-[#F2F3F5] py-3 pl-4 pr-10 text-sm font-medium text-[#181A1F] placeholder:text-[#8D93A5] focus:outline-none focus:ring-2 focus:ring-kook-brand/50"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8D93A5] hover:text-[#181A1F]"
                >
                  <Smile size={18} />
                </button>
              </div>
              <Button type="submit" variant="kook-brand" className="rounded-xl px-6 shadow-sm">
                <Send size={16} />
              </Button>
            </form>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6 rounded-3xl border border-[#E3E5E8] bg-white p-6 shadow-sm">
        <div>
          <h3 className="mb-4 text-base font-black text-[#181A1F]">语音控制</h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                const nextMuted = !isMuted
                setIsMuted(nextMuted)
                controls.setMuted(nextMuted)
              }}
              className={`flex flex-col items-center justify-center rounded-xl border py-4 transition-all ${
                diagnostics.muted
                  ? 'border-red-200 bg-red-50 text-red-500'
                  : 'border-kook-brand/30 bg-kook-brand/10 text-kook-brand'
              }`}
            >
              {diagnostics.muted ? <MicOff size={24} className="mb-2" /> : <Mic size={24} className="mb-2" />}
              <span className="text-sm font-bold">{diagnostics.muted ? '解除静音' : '闭麦'}</span>
            </button>
            <button className="flex flex-col items-center justify-center rounded-xl border border-[#E3E5E8] bg-[#F7F9FC] py-4 text-[#5C6068] transition-colors hover:bg-[#F2F3F5] hover:text-[#181A1F]">
              <MessageSquare size={24} className="mb-2" />
              <span className="text-sm font-bold">快捷短语</span>
            </button>
          </div>
        </div>

        <div>
          <h3 className="mb-4 text-base font-black text-[#181A1F]">音频质量</h3>
          <div className="space-y-4 rounded-2xl border border-[#E3E5E8] bg-[#F7F9FC] p-4">
            <div>
              <div className="mb-2 flex items-center justify-between text-xs font-bold text-[#5C6068]">
                <span>输入电平</span>
                <span>{Math.round(diagnostics.localLevel * 100)}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-kook-brand to-[#5C6BFF]"
                  style={{ width: `${Math.max(6, diagnostics.localLevel * 100)}%` }}
                />
              </div>
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between text-xs font-bold text-[#5C6068]">
                <span>输出电平</span>
                <span>{Math.round(diagnostics.remoteLevel * 100)}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#5C6BFF] to-[#181A1F]"
                  style={{ width: `${Math.max(4, diagnostics.remoteLevel * 100)}%` }}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs font-bold text-[#181A1F]">
              <button
                type="button"
                className={`rounded-xl border px-3 py-2 ${diagnostics.noiseSuppression ? 'border-kook-brand/25 bg-kook-brand/10 text-kook-brand' : 'border-[#E3E5E8] bg-white text-[#5C6068]'}`}
                onClick={() => controls.setNoiseSuppression(!diagnostics.noiseSuppression)}
              >
                降噪 {diagnostics.noiseSuppression ? '开' : '关'}
              </button>
              <button
                type="button"
                className={`rounded-xl border px-3 py-2 ${diagnostics.echoCancellation ? 'border-kook-brand/25 bg-kook-brand/10 text-kook-brand' : 'border-[#E3E5E8] bg-white text-[#5C6068]'}`}
                onClick={() => controls.setEchoCancellation(!diagnostics.echoCancellation)}
              >
                回声消除 {diagnostics.echoCancellation ? '开' : '关'}
              </button>
              <button
                type="button"
                className={`rounded-xl border px-3 py-2 ${diagnostics.autoGainControl ? 'border-kook-brand/25 bg-kook-brand/10 text-kook-brand' : 'border-[#E3E5E8] bg-white text-[#5C6068]'}`}
                onClick={() => controls.setAutoGainControl(!diagnostics.autoGainControl)}
              >
                自动增益 {diagnostics.autoGainControl ? '开' : '关'}
              </button>
              <button
                type="button"
                className={`rounded-xl border px-3 py-2 ${diagnostics.localMonitor ? 'border-kook-brand/25 bg-kook-brand/10 text-kook-brand' : 'border-[#E3E5E8] bg-white text-[#5C6068]'}`}
                onClick={() => controls.setLocalMonitor(!diagnostics.localMonitor)}
              >
                本地监听 {diagnostics.localMonitor ? '开' : '关'}
              </button>
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between text-xs font-bold text-[#5C6068]">
                <span>手动增益</span>
                <span>{diagnostics.manualGain.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.6"
                max="2"
                step="0.05"
                value={diagnostics.manualGain}
                onChange={(event) => controls.setManualGain(Number(event.target.value))}
                className="w-full accent-kook-brand"
              />
            </div>
            {diagnostics.error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
                {diagnostics.error}
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex-1">
          <h3 className="mb-4 text-base font-black text-[#181A1F]">房间信息</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-[#5C6068]">房间号</span>
              <span className="font-bold text-[#181A1F]">
                {queueState?.roomCode ? `#${queueState.roomCode}` : '准备中'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="font-medium text-[#5C6068]">语言</span>
              <span className="font-bold text-[#181A1F]">{filters.language}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="font-medium text-[#5C6068]">时长要求</span>
              <span className="font-bold text-[#181A1F]">{filters.duration.split(' ')[0]}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="font-medium text-[#5C6068]">MBTI</span>
              <span className="font-bold text-[#181A1F]">
                {queueState?.roomPersonality ?? filters.mbtiType ?? '未设置'}
              </span>
            </div>
          </div>
          {testMode ? (
            <div className="mt-4 rounded-2xl border border-[#5C6BFF]/15 bg-[#5C6BFF]/5 p-4 text-xs font-medium leading-6 text-[#4B5AE3]">
              开发测试房已跳过匹配流程。可用房间链接在同浏览器多标签页加入同一房间，验证真实麦克风、降噪、AGC 和直连 RTC 链路。
            </div>
          ) : null}
        </div>

        <div>
          <Button
            variant="outline"
            className="mb-3 w-full border-[#E3E5E8] text-[#181A1F] hover:bg-[#F7F9FC]"
            onClick={async () => {
              if (!queueState?.roomCode) {
                return
              }
              await navigator.clipboard.writeText(`${window.location.origin}/match?room=${queueState.roomCode}`)
              window.alert('房间链接已复制')
            }}
          >
            复制房间链接
          </Button>
          <Button
            variant="outline"
            className="mb-3 w-full border-kook-brand/30 bg-kook-brand/5 text-kook-brand hover:bg-kook-brand/10"
            onClick={async () => {
              try {
                const content = `${filters.game} 匹配成功，房间 ${queueState?.roomCode ?? '待生成'}，搭子：${teammateName}。`;
                const response = await fetch('/api/users/me/vlog', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    title: `${filters.game} 开黑记录`,
                    gameName: filters.game,
                    type: 'log',
                    content
                  })
                })
                window.alert(response.ok ? '已成功保存至游戏 Vlog' : '保存失败，请稍后重试')
              } catch {
                window.alert('保存出错')
              }
            }}
          >
            记录这次游戏 Vlog
          </Button>
          <Button variant="kook-brand" className="w-full font-bold">
            准备就绪，进入游戏
          </Button>
        </div>
      </div>
    </motion.div>
  )
}
