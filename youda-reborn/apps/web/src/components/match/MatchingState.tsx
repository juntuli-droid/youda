"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { EmptyStateCard } from '@/components/empty/EmptyStateCard'
import { MatchFilters, MatchQueueState } from '@/components/match/types'

interface MatchingStateProps {
  filters: MatchFilters
  onCancel: () => void
  onSuccess: (state: MatchQueueState) => void
}

function parseAgeRange(value: string) {
  if (value === '18-22') return { ageMin: 18, ageMax: 22 }
  if (value === '23-27') return { ageMin: 23, ageMax: 27 }
  if (value === '28-35') return { ageMin: 28, ageMax: 35 }
  if (value === '35+') return { ageMin: 35, ageMax: 60 }
  return {}
}

export default function MatchingState({
  filters,
  onCancel,
  onSuccess
}: MatchingStateProps) {
  const [progress, setProgress] = useState(8)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [estimatedTime, setEstimatedTime] = useState(18)
  const [queueEntryId, setQueueEntryId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const intervalRef = useRef<number | null>(null)

  const queuePayload = useMemo(() => {
    const age = parseAgeRange(filters.ageRange)
    return {
      gameName: filters.game,
      gender: filters.gender === '不限' ? undefined : filters.gender,
      ...age,
      interests: [
        ...filters.interests,
        ...(filters.mbtiType ? [`MBTI:${filters.mbtiType}`] : [])
      ],
      region: filters.region,
      priorityScore: filters.size.includes('双排') ? 2 : 1
    }
  }, [filters])

  useEffect(() => {
    let cancelled = false

    const startQueue = async () => {
      try {
        const response = await fetch('/api/match/queue', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(queuePayload)
        })
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error ?? '匹配排队失败')
        }

        if (cancelled) {
          return
        }

        setQueueEntryId(data.queueEntryId)
        setEstimatedTime(18 + Math.floor(Math.random() * 8))

        if (data.status === 'MATCHED') {
          setProgress(100)
          onSuccess({
            queueEntryId: data.queueEntryId,
            status: data.status,
            matchId: data.matchId,
            roomCode: data.roomCode,
            roomPersonality: data.roomPersonality,
            matchedUser: data.matchedUser
          })
        }
      } catch (startError) {
        if (!cancelled) {
          setError(startError instanceof Error ? startError.message : '匹配排队失败')
        }
      }
    }

    void startQueue()

    return () => {
      cancelled = true
    }
  }, [onSuccess, queuePayload])

  useEffect(() => {
    if (!queueEntryId) {
      return
    }

    let disposed = false

    const syncQueueStatus = async () => {
      try {
        const response = await fetch(`/api/match/queue?entryId=${queueEntryId}`, {
          cache: 'no-store'
        })
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error ?? '匹配状态查询失败')
        }

        if (data.entry?.status === 'MATCHED') {
          if (disposed) {
            return
          }

          if (intervalRef.current) {
            window.clearInterval(intervalRef.current)
          }
          setProgress(100)
          onSuccess({
            queueEntryId,
            status: data.entry.status,
            matchId: data.entry.matchId,
            roomCode: data.entry.roomCode,
            roomPersonality: data.entry.roomPersonality,
            matchedUser: data.entry.matchedUser
          })
        }
      } catch (pollError) {
        if (!disposed) {
          setError(pollError instanceof Error ? pollError.message : '匹配状态查询失败')
        }
      }
    }

    void syncQueueStatus()

    intervalRef.current = window.setInterval(() => {
      setElapsedTime((previous) => previous + 1)
      setProgress((previous) => Math.min(previous + 4, 92))
      void syncQueueStatus()
    }, 1000)

    return () => {
      disposed = true
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current)
      }
    }
  }, [onSuccess, queueEntryId])

  const handleCancel = async () => {
    if (queueEntryId) {
      await fetch(`/api/match/queue?entryId=${queueEntryId}`, {
        method: 'DELETE'
      }).catch(() => undefined)
    }

    onCancel()
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0 }}
        className="mt-10 w-full max-w-[800px]"
      >
        <EmptyStateCard
          scenario="network-error"
          icon="📡"
          onAction={() => window.location.reload()}
        />
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className="relative mt-10 w-full max-w-[800px]"
    >
      <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center">
        <div className="absolute h-64 w-64 animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite] rounded-full border border-kook-brand/20" />
        <div className="absolute h-96 w-96 animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite] rounded-full border border-kook-brand/10 animation-delay-1000" />
        <div className="absolute h-[500px] w-[500px] animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite] rounded-full border border-kook-brand/5 animation-delay-2000" />
      </div>

      <div className="relative z-10 overflow-hidden rounded-[32px] border border-[#E3E5E8] bg-white p-12 text-center shadow-2xl">
        <div className="relative mx-auto mb-8 h-32 w-32">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="#F2F3F5" strokeWidth="8" />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#2ED39E"
              strokeWidth="8"
              strokeDasharray="283"
              strokeDashoffset={283 - (283 * progress) / 100}
              className="transition-all duration-1000 ease-linear"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-sm font-bold text-kook-brand">匹配中</span>
            <span className="text-xl font-black text-[#181A1F]">{Math.floor(progress)}%</span>
          </div>
        </div>

        <h2 className="mb-3 text-3xl font-black text-[#181A1F]">正在为你寻找节奏一致的搭子</h2>
        <p className="mx-auto mb-10 max-w-md text-[#5C6068]">
          队列已经进入服务端持久化，断线后重新进入也能继续恢复状态。
        </p>

        <div className="mx-auto mb-10 grid max-w-lg grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-xl border border-[#E3E5E8] bg-[#F7F9FC] p-4">
            <div className="mb-1 text-xs font-medium text-[#8D93A5]">当前游戏</div>
            <div className="font-bold text-[#181A1F]">{filters.game}</div>
          </div>
          <div className="rounded-xl border border-[#E3E5E8] bg-[#F7F9FC] p-4">
            <div className="mb-1 text-xs font-medium text-[#8D93A5]">匹配人数</div>
            <div className="font-bold text-[#181A1F]">{filters.size}</div>
          </div>
          <div className="rounded-xl border border-[#E3E5E8] bg-[#F7F9FC] p-4">
            <div className="mb-1 text-xs font-medium text-[#8D93A5]">目标风格</div>
            <div className="truncate text-sm font-bold text-[#181A1F]">{filters.personality}</div>
          </div>
          <div className="rounded-xl border border-[#E3E5E8] bg-[#F7F9FC] p-4">
            <div className="mb-1 text-xs font-medium text-[#8D93A5]">服务器</div>
            <div className="font-bold text-[#181A1F]">{filters.region}</div>
          </div>
          <div className="rounded-xl border border-[#E3E5E8] bg-[#F7F9FC] p-4 md:col-span-2">
            <div className="mb-1 text-xs font-medium text-[#8D93A5]">MBTI 画像</div>
            <div className="font-bold text-[#181A1F]">
              {filters.mbtiType ? `${filters.mbtiType} · ${filters.mbtiTitle}` : '未检测到 MBTI，按通用权重匹配'}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-4">
          <div className="text-sm font-medium text-[#5C6068]">
            已等待 {elapsedTime}s / 预计还需要 {Math.max(0, estimatedTime - elapsedTime)}s
          </div>
          <Button
            variant="ghost"
            onClick={() => void handleCancel()}
            className="text-[#8D93A5] hover:bg-[#F2F3F5] hover:text-[#181A1F]"
          >
            取消匹配
          </Button>
        </div>
      </div>
    </motion.div>
  )
}
