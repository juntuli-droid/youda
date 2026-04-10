"use client"

import { useEffect, useRef } from 'react'
import { Button } from '@/components/ui/Button'
import {
  EmptyStateScenario,
  resolveEmptyStateCopy
} from '@/lib/i18n/empty-state'

type EmptyStateCardProps = {
  scenario: EmptyStateScenario
  locale?: string
  icon?: string
  onAction?: () => void
  className?: string
  actionLabel?: string
}

async function sendEmptyStateEvent(payload: {
  scenario: EmptyStateScenario
  action: 'EMPTY_STATE_EXPOSED' | 'EMPTY_STATE_CLICKED'
  locale: string
  durationMs?: number
}) {
  if (process.env.NODE_ENV !== 'production') {
    return
  }

  try {
    await fetch('/api/telemetry/empty-state', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      keepalive: true
    })
  } catch {
    // Ignore telemetry delivery errors.
  }
}

export function EmptyStateCard({
  scenario,
  locale = 'zh-CN',
  icon = '•',
  onAction,
  className = '',
  actionLabel
}: EmptyStateCardProps) {
  const copy = resolveEmptyStateCopy(scenario, locale)
  const mountedAtRef = useRef<number>(Date.now())
  const telemetryEnabled = process.env.NODE_ENV === 'production'

  useEffect(() => {
    if (!telemetryEnabled) {
      return
    }

    const mountedAt = mountedAtRef.current

    void sendEmptyStateEvent({
      scenario,
      action: 'EMPTY_STATE_EXPOSED',
      locale
    })

    return () => {
      void sendEmptyStateEvent({
        scenario,
        action: 'EMPTY_STATE_EXPOSED',
        locale,
        durationMs: Date.now() - mountedAt
      })
    }
  }, [locale, scenario, telemetryEnabled])

  return (
    <div
      className={`rounded-3xl border border-[#181A1F]/10 bg-gradient-to-br from-white to-[#F7F9FC] p-6 text-center shadow-sm ${className}`}
      role="status"
      aria-live="polite"
    >
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#181A1F]/5 text-3xl">
        <span aria-hidden="true">{icon}</span>
      </div>
      <p className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-kook-brand">
        {copy.eyebrow}
      </p>
      <h3 className="mb-2 text-xl font-black text-[#181A1F]">{copy.title}</h3>
      <p className="mx-auto mb-5 max-w-md text-sm font-medium leading-6 text-[#5C6068]">
        {copy.description}
      </p>
      {onAction ? (
        <Button
          type="button"
          variant="outline"
          className="min-h-12 min-w-12 px-5"
          onClick={() => {
            if (telemetryEnabled) {
              void sendEmptyStateEvent({
                scenario,
                action: 'EMPTY_STATE_CLICKED',
                locale,
                durationMs: Date.now() - mountedAtRef.current
              })
            }
            onAction()
          }}
        >
          {actionLabel ?? copy.action}
        </Button>
      ) : null}
    </div>
  )
}
