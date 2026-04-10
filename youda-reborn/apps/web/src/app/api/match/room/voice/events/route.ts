export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { conflict, internalServerError } from '@/lib/api-errors'
import { requireRequestContext } from '@/lib/api-session'
import { captureRouteException } from '@/lib/monitoring'
import { listVoiceRoomState } from '@/lib/voice-room-service'

const encoder = new TextEncoder()

export async function GET(request: Request) {
  try {
    const context = await requireRequestContext(request)
    if (context instanceof Response) {
      return context
    }

    const url = new URL(request.url)
    const matchId = url.searchParams.get('matchId')
    const peerId = url.searchParams.get('peerId')

    if (!matchId || !peerId) {
      return new Response('missing_params', { status: 400 })
    }

    let lastSignalTimestamp: string | undefined
    let interval: ReturnType<typeof setInterval> | undefined

    const stream = new ReadableStream({
      async start(controller) {
        const writeFrame = (event: string, data: unknown) => {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
          )
        }

        const sendSnapshot = async () => {
          const state = await listVoiceRoomState({
            matchId,
            userId: context.user.id,
            peerId,
            since: lastSignalTimestamp ? new Date(lastSignalTimestamp) : undefined
          })

          const latestSignal = state.signals[state.signals.length - 1]
          if (latestSignal?.createdAt) {
            lastSignalTimestamp = latestSignal.createdAt
          }

          writeFrame('voice-state', state)
        }

        await sendSnapshot()

        interval = setInterval(() => {
          void sendSnapshot().catch((error) => {
            writeFrame('voice-error', {
              error: error instanceof Error ? error.message : 'voice_stream_failed'
            })
          })
        }, 1000)

        request.signal.addEventListener(
          'abort',
          () => {
            if (interval) {
              clearInterval(interval)
            }
            controller.close()
          },
          { once: true }
        )
      },
      cancel() {
        if (interval) {
          clearInterval(interval)
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive'
      }
    })
  } catch (error) {
    await captureRouteException(request, error, {
      event: 'match.room.voice.events.failed'
    })

    if (error instanceof Error && error.message === 'match_membership_required') {
      return conflict('仅匹配房间成员可以接入语音房')
    }

    return internalServerError(error)
  }
}
