"use client"

import { useEffect } from "react"
import * as Sentry from "@sentry/nextjs"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-[#F7F9FC] flex items-center justify-center px-6">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl text-center">
          <div className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-kook-brand">
            Youda
          </div>
          <h1 className="text-3xl font-black text-[#181A1F]">服务暂时不可用</h1>
          <p className="mt-3 text-sm leading-6 text-[#181A1F]/60">
            我们已记录本次异常，请稍后重试或重新进入页面。
          </p>
          <button
            type="button"
            onClick={reset}
            className="mt-6 inline-flex items-center justify-center rounded-full bg-kook-brand px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
          >
            重新加载
          </button>
        </div>
      </body>
    </html>
  )
}
