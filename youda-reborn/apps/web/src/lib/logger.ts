type LogLevel = 'info' | 'warn' | 'error'

type LogPayload = {
  event: string
  userId?: string
  requestId?: string
  path?: string
  method?: string
  durationMs?: number
  metadata?: Record<string, unknown>
  error?: unknown
}

const shouldSample = () => Math.random() <= 0.01

const writeLog = (level: LogLevel, payload: LogPayload) => {
  if (level === 'info' && !shouldSample()) {
    return
  }

  const entry = {
    level,
    timestamp: new Date().toISOString(),
    sampleRate: level === 'info' ? 0.01 : 1,
    ...payload
  }

  const serialized = JSON.stringify(entry)

  if (level === 'error') {
    console.error(serialized)
    return
  }

  if (level === 'warn') {
    console.warn(serialized)
    return
  }

  console.info(serialized)
}

export const logger = {
  info: (payload: LogPayload) => writeLog('info', payload),
  warn: (payload: LogPayload) => writeLog('warn', payload),
  error: (payload: LogPayload) => writeLog('error', payload)
}
