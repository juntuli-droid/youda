"use client"

import { MutableRefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react'

type VoiceOptions = {
  roomCode?: string
  matchId?: string
  enabled: boolean
  testMode?: boolean
}

type VoiceDiagnostics = {
  supported: boolean
  connected: boolean
  remoteConnected: boolean
  remotePeerLeft: boolean
  error?: string
  localLevel: number
  remoteLevel: number
  noiseSuppression: boolean
  echoCancellation: boolean
  autoGainControl: boolean
  muted: boolean
  localMonitor: boolean
  manualGain: number
}

type VoiceSignalPayload = {
  id: string
  senderId: string
  senderPeerId: string
  targetPeerId?: string
  signalType: 'JOIN' | 'OFFER' | 'ANSWER' | 'ICE' | 'LEAVE'
  payload?: Record<string, unknown>
  createdAt: string
}

type VoiceParticipantPayload = {
  id: string
  userId: string
  peerId: string
  displayName: string
  avatarUrl?: string
  joinedAt: string
  lastSeenAt: string
  isSelf: boolean
}

function createLevelMeter(analyser: AnalyserNode, target: MutableRefObject<number>) {
  const buffer = new Uint8Array(analyser.frequencyBinCount)

  return window.setInterval(() => {
    analyser.getByteTimeDomainData(buffer)
    let total = 0

    for (let index = 0; index < buffer.length; index += 1) {
      const value = buffer[index]
      const centered = (value - 128) / 128
      total += centered * centered
    }

    const rms = Math.sqrt(total / buffer.length)
    target.current = Number(Math.min(1, rms * 2.4).toFixed(3))
  }, 120)
}

function isRtcSessionDescription(value: unknown): value is RTCSessionDescriptionInit {
  return (
    value !== null &&
    typeof value === 'object' &&
    'type' in value &&
    'sdp' in value
  )
}

function isIceCandidatePayload(
  value: unknown
): value is RTCIceCandidateInit | RTCIceCandidate {
  return value !== null && typeof value === 'object' && 'candidate' in value
}

export function useVoiceRoomAudio({
  roomCode,
  matchId,
  enabled,
  testMode = false
}: VoiceOptions) {
  const [muted, setMuted] = useState(false)
  const [noiseSuppression, setNoiseSuppression] = useState(true)
  const [echoCancellation, setEchoCancellation] = useState(true)
  const [autoGainControl, setAutoGainControl] = useState(true)
  const [localMonitor, setLocalMonitor] = useState(false)
  const [manualGain, setManualGain] = useState(1)
  const [error, setError] = useState<string>()
  const [supported, setSupported] = useState(true)
  const [connected, setConnected] = useState(false)
  const [remoteConnected, setRemoteConnected] = useState(false)
  const [remotePeerLeft, setRemotePeerLeft] = useState(false)
  const [localLevel, setLocalLevel] = useState(0)
  const [remoteLevel, setRemoteLevel] = useState(0)

  const localAudioRef = useRef<HTMLAudioElement | null>(null)
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const processedStreamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const gainNodeRef = useRef<GainNode | null>(null)
  const monitorNodeRef = useRef<GainNode | null>(null)
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const channelRef = useRef<BroadcastChannel | null>(null)
  const remoteStreamRef = useRef<MediaStream | null>(null)
  const peerIdRef = useRef(`peer-${Math.random().toString(36).slice(2, 10)}`)
  const remotePeerIdRef = useRef<string | null>(null)
  const localLevelRef = useRef(0)
  const remoteLevelRef = useRef(0)
  const animationFrameRef = useRef<number | null>(null)
  const localMeterIntervalRef = useRef<number | null>(null)
  const remoteMeterIntervalRef = useRef<number | null>(null)
  const gainAutomationRef = useRef<number | null>(null)
  const pollingIntervalRef = useRef<number | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)
  const iceServersRef = useRef<RTCIceServer[]>([
    { urls: ['stun:stun.l.google.com:19302'] }
  ])
  const lastSignalTimestampRef = useRef<string | undefined>(undefined)
  const seenSignalIdsRef = useRef<Set<string>>(new Set())
  const connectionModeRef = useRef<'broadcast' | 'server' | null>(null)
  const makingOfferRef = useRef(false)
  const pendingOfferTargetRef = useRef<string | null>(null)
  const negotiatedPeerIdsRef = useRef<Set<string>>(new Set())
  const pendingIceCandidatesRef = useRef<Map<string, RTCIceCandidateInit[]>>(
    new Map()
  )

  const cleanup = useCallback(() => {
    if (animationFrameRef.current) {
      window.cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }

    if (localMeterIntervalRef.current) {
      window.clearInterval(localMeterIntervalRef.current)
      localMeterIntervalRef.current = null
    }

    if (remoteMeterIntervalRef.current) {
      window.clearInterval(remoteMeterIntervalRef.current)
      remoteMeterIntervalRef.current = null
    }

    if (gainAutomationRef.current) {
      window.clearInterval(gainAutomationRef.current)
      gainAutomationRef.current = null
    }

    if (pollingIntervalRef.current) {
      window.clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }

    eventSourceRef.current?.close()
    eventSourceRef.current = null

    peerConnectionRef.current?.close()
    peerConnectionRef.current = null

    channelRef.current?.close()
    channelRef.current = null

    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    processedStreamRef.current = null
    remoteStreamRef.current = null

    audioContextRef.current?.close().catch(() => undefined)
    audioContextRef.current = null
    gainNodeRef.current = null
    monitorNodeRef.current = null
    remotePeerIdRef.current = null
    lastSignalTimestampRef.current = undefined
    seenSignalIdsRef.current = new Set()
    connectionModeRef.current = null
    makingOfferRef.current = false
    pendingOfferTargetRef.current = null
    negotiatedPeerIdsRef.current = new Set()
    pendingIceCandidatesRef.current = new Map()

    setConnected(false)
    setRemoteConnected(false)
    setRemotePeerLeft(false)
    setLocalLevel(0)
    setRemoteLevel(0)
  }, [])

  useEffect(() => cleanup, [cleanup])

  const syncLevels = useCallback(() => {
    setLocalLevel(localLevelRef.current)
    setRemoteLevel(remoteLevelRef.current)
    animationFrameRef.current = window.requestAnimationFrame(syncLevels)
  }, [])

  const attachRemoteStream = useCallback((remoteStream: MediaStream) => {
    remoteStreamRef.current = remoteStream

    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = remoteStream
      void remoteAudioRef.current.play().catch(() => undefined)
    }

    setRemoteConnected(true)

    const context = audioContextRef.current
    if (!context) {
      return
    }

    const remoteSource = context.createMediaStreamSource(remoteStream)
    const remoteAnalyser = context.createAnalyser()
    remoteAnalyser.fftSize = 256
    remoteSource.connect(remoteAnalyser)

    if (remoteMeterIntervalRef.current) {
      window.clearInterval(remoteMeterIntervalRef.current)
    }
    remoteMeterIntervalRef.current = createLevelMeter(remoteAnalyser, remoteLevelRef)
  }, [])

  const publishServerSignal = useCallback(
    async (
      signalType: 'OFFER' | 'ANSWER' | 'ICE',
      payload?: Record<string, unknown>,
      targetPeerId?: string
    ) => {
      if (!matchId) {
        return
      }

      await fetch('/api/match/room/voice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'signal',
          matchId,
          peerId: peerIdRef.current,
          signalType,
          targetPeerId,
          payload
        })
      })
    },
    [matchId]
  )

  const fetchRtcConfig = useCallback(async () => {
    if (testMode) {
      iceServersRef.current = [{ urls: ['stun:stun.l.google.com:19302'] }]
      return
    }

    try {
      const response = await fetch('/api/match/room/voice/config', {
        cache: 'no-store'
      })
      const data = await response.json()

      if (
        response.ok &&
        Array.isArray(data.iceServers) &&
        data.iceServers.length > 0
      ) {
        iceServersRef.current = data.iceServers as RTCIceServer[]
        return
      }
    } catch {
      // Fall through to default STUN below.
    }

    iceServersRef.current = [{ urls: ['stun:stun.l.google.com:19302'] }]
  }, [testMode])

  const queueIceCandidate = useCallback(
    (senderPeerId: string, candidate: RTCIceCandidateInit | RTCIceCandidate) => {
      const serializedCandidate =
        candidate instanceof RTCIceCandidate ? candidate.toJSON() : candidate
      const pendingCandidates =
        pendingIceCandidatesRef.current.get(senderPeerId) ?? []

      pendingCandidates.push(serializedCandidate)
      pendingIceCandidatesRef.current.set(senderPeerId, pendingCandidates)
    },
    []
  )

  const flushQueuedIceCandidates = useCallback(async (senderPeerId: string) => {
    const peerConnection = peerConnectionRef.current
    if (!peerConnection?.remoteDescription) {
      return
    }

    const queuedCandidates = pendingIceCandidatesRef.current.get(senderPeerId)
    if (!queuedCandidates?.length) {
      return
    }

    pendingIceCandidatesRef.current.delete(senderPeerId)

    for (const candidate of queuedCandidates) {
      await peerConnection.addIceCandidate(candidate)
    }
  }, [])

  const maybeCreateOffer = useCallback(
    async (targetPeerId: string) => {
      const peerConnection = peerConnectionRef.current
      if (!peerConnection) {
        return
      }

      if (makingOfferRef.current || peerConnection.signalingState !== 'stable') {
        return
      }

      if (peerIdRef.current >= targetPeerId) {
        return
      }

      if (
        pendingOfferTargetRef.current === targetPeerId ||
        negotiatedPeerIdsRef.current.has(targetPeerId)
      ) {
        return
      }

      remotePeerIdRef.current = targetPeerId
      pendingOfferTargetRef.current = targetPeerId
      makingOfferRef.current = true

      try {
        await peerConnection.setLocalDescription()
      } catch (offerError) {
        pendingOfferTargetRef.current = null
        throw offerError
      } finally {
        makingOfferRef.current = false
      }

      const offer = peerConnection.localDescription
      if (!offer || offer.type !== 'offer') {
        pendingOfferTargetRef.current = null
        return
      }

      if (connectionModeRef.current === 'server') {
        await publishServerSignal(
          'OFFER',
          offer as unknown as Record<string, unknown>,
          targetPeerId
        )
      }
    },
    [publishServerSignal]
  )

  const handleServerParticipants = useCallback(
    async (participants: VoiceParticipantPayload[]) => {
      const remoteParticipant = participants.find((participant) => !participant.isSelf)
      if (!remoteParticipant) {
        return
      }

      if (
        remotePeerIdRef.current &&
        remotePeerIdRef.current !== remoteParticipant.peerId
      ) {
        negotiatedPeerIdsRef.current.delete(remotePeerIdRef.current)
        pendingIceCandidatesRef.current.delete(remotePeerIdRef.current)
        pendingOfferTargetRef.current = null
      }

      remotePeerIdRef.current = remoteParticipant.peerId
      setRemotePeerLeft(false)
      await maybeCreateOffer(remoteParticipant.peerId)
    },
    [maybeCreateOffer]
  )

  const handleServerSignals = useCallback(
    async (signals: VoiceSignalPayload[]) => {
      const peerConnection = peerConnectionRef.current
      if (!peerConnection) {
        return
      }

      for (const signal of signals) {
        if (seenSignalIdsRef.current.has(signal.id)) {
          continue
        }

        seenSignalIdsRef.current.add(signal.id)
        lastSignalTimestampRef.current = signal.createdAt

        try {
          if (signal.signalType === 'JOIN') {
            remotePeerIdRef.current = signal.senderPeerId
            setRemotePeerLeft(false)
            await maybeCreateOffer(signal.senderPeerId)
            continue
          }

          if (signal.signalType === 'LEAVE') {
            if (remotePeerIdRef.current === signal.senderPeerId) {
              remotePeerIdRef.current = null
              remoteStreamRef.current = null
              remoteLevelRef.current = 0
              setRemoteConnected(false)
              setRemotePeerLeft(true)
            }
            negotiatedPeerIdsRef.current.delete(signal.senderPeerId)
            pendingIceCandidatesRef.current.delete(signal.senderPeerId)
            if (pendingOfferTargetRef.current === signal.senderPeerId) {
              pendingOfferTargetRef.current = null
            }
            continue
          }

          if (signal.signalType === 'OFFER' && isRtcSessionDescription(signal.payload)) {
            const polite = peerIdRef.current > signal.senderPeerId
            const offerCollision =
              makingOfferRef.current || peerConnection.signalingState !== 'stable'

            if (offerCollision) {
              if (!polite || peerConnection.signalingState !== 'have-local-offer') {
                continue
              }

              await peerConnection.setLocalDescription({ type: 'rollback' })
              pendingOfferTargetRef.current = null
            }

            remotePeerIdRef.current = signal.senderPeerId
            await peerConnection.setRemoteDescription(signal.payload)
            await flushQueuedIceCandidates(signal.senderPeerId)
            await peerConnection.setLocalDescription()

            const answer = peerConnection.localDescription
            if (!answer || answer.type !== 'answer') {
              throw new Error('RTC 应答生成失败')
            }

            negotiatedPeerIdsRef.current.add(signal.senderPeerId)
            pendingOfferTargetRef.current = null
            await publishServerSignal(
              'ANSWER',
              answer as unknown as Record<string, unknown>,
              signal.senderPeerId
            )
            continue
          }

          if (signal.signalType === 'ANSWER' && isRtcSessionDescription(signal.payload)) {
            if (peerConnection.signalingState === 'have-local-offer') {
              await peerConnection.setRemoteDescription(signal.payload)
              await flushQueuedIceCandidates(signal.senderPeerId)
              negotiatedPeerIdsRef.current.add(signal.senderPeerId)
              pendingOfferTargetRef.current = null
            }
            continue
          }

          if (signal.signalType === 'ICE' && isIceCandidatePayload(signal.payload)) {
            if (!peerConnection.remoteDescription) {
              queueIceCandidate(signal.senderPeerId, signal.payload)
              continue
            }

            await peerConnection.addIceCandidate(signal.payload)
          }
        } catch (rtcError) {
          setError(rtcError instanceof Error ? rtcError.message : 'RTC 信令失败')
        }
      }
    },
    [
      flushQueuedIceCandidates,
      maybeCreateOffer,
      publishServerSignal,
      queueIceCandidate
    ]
  )

  const setupBroadcastConnection = useCallback(
    async (processedStream: MediaStream) => {
      if (!roomCode || typeof BroadcastChannel === 'undefined') {
        return
      }

      connectionModeRef.current = 'broadcast'
      const channel = new BroadcastChannel(`voice-room:${roomCode}`)
      const peerConnection = new RTCPeerConnection({
        iceServers: iceServersRef.current
      })

      channelRef.current = channel
      peerConnectionRef.current = peerConnection

      processedStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, processedStream)
      })

      peerConnection.ontrack = (event) => {
        const [remoteStream] = event.streams
        if (remoteStream) {
          attachRemoteStream(remoteStream)
        }
      }

      peerConnection.onicecandidate = (event) => {
        if (!event.candidate) {
          return
        }

        channel.postMessage({
          type: 'candidate',
          from: peerIdRef.current,
          candidate: event.candidate
        })
      }

      channel.onmessage = async (message) => {
        const payload = message.data
        if (!payload || payload.from === peerIdRef.current) {
          return
        }

        try {
          if (payload.type === 'presence') {
            if (
              peerIdRef.current < payload.from &&
              peerConnection.signalingState === 'stable' &&
              !makingOfferRef.current &&
              pendingOfferTargetRef.current !== payload.from &&
              !negotiatedPeerIdsRef.current.has(payload.from)
            ) {
              remotePeerIdRef.current = payload.from
              pendingOfferTargetRef.current = payload.from
              makingOfferRef.current = true
              await peerConnection.setLocalDescription()
              makingOfferRef.current = false

              const offer = peerConnection.localDescription
              if (!offer || offer.type !== 'offer') {
                pendingOfferTargetRef.current = null
                return
              }

              channel.postMessage({
                type: 'offer',
                from: peerIdRef.current,
                description: offer
              })
            }
            return
          }

          if (payload.type === 'offer') {
            const polite = peerIdRef.current > payload.from
            const offerCollision =
              makingOfferRef.current || peerConnection.signalingState !== 'stable'

            if (offerCollision) {
              if (!polite || peerConnection.signalingState !== 'have-local-offer') {
                return
              }

              await peerConnection.setLocalDescription({ type: 'rollback' })
              pendingOfferTargetRef.current = null
            }

            remotePeerIdRef.current = payload.from
            await peerConnection.setRemoteDescription(payload.description)
            await flushQueuedIceCandidates(payload.from)
            await peerConnection.setLocalDescription()

            const answer = peerConnection.localDescription
            if (!answer || answer.type !== 'answer') {
              throw new Error('RTC 应答生成失败')
            }

            negotiatedPeerIdsRef.current.add(payload.from)
            pendingOfferTargetRef.current = null
            channel.postMessage({
              type: 'answer',
              from: peerIdRef.current,
              description: answer
            })
            return
          }

          if (payload.type === 'answer') {
            await peerConnection.setRemoteDescription(payload.description)
            await flushQueuedIceCandidates(payload.from)
            negotiatedPeerIdsRef.current.add(payload.from)
            pendingOfferTargetRef.current = null
            return
          }

          if (payload.type === 'candidate' && payload.candidate) {
            if (!peerConnection.remoteDescription) {
              queueIceCandidate(payload.from, payload.candidate)
              return
            }

            await peerConnection.addIceCandidate(payload.candidate)
          }
        } catch (rtcError) {
          makingOfferRef.current = false
          setError(rtcError instanceof Error ? rtcError.message : 'RTC 信令失败')
        }
      }

      channel.postMessage({
        type: 'presence',
        from: peerIdRef.current
      })
    },
    [attachRemoteStream, flushQueuedIceCandidates, queueIceCandidate, roomCode]
  )

  const setupServerConnection = useCallback(
    async (processedStream: MediaStream) => {
      if (!matchId) {
        return
      }

      connectionModeRef.current = 'server'
      const peerConnection = new RTCPeerConnection({
        iceServers: iceServersRef.current
      })
      peerConnectionRef.current = peerConnection

      processedStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, processedStream)
      })

      peerConnection.ontrack = (event) => {
        const [remoteStream] = event.streams
        if (remoteStream) {
          attachRemoteStream(remoteStream)
        }
      }

      peerConnection.onicecandidate = (event) => {
        if (!event.candidate || !remotePeerIdRef.current) {
          return
        }

        void publishServerSignal(
          'ICE',
          event.candidate.toJSON() as unknown as Record<string, unknown>,
          remotePeerIdRef.current
        ).catch((rtcError) => {
          setError(rtcError instanceof Error ? rtcError.message : 'ICE 候选同步失败')
        })
      }

      const joinResponse = await fetch('/api/match/room/voice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'join',
          matchId,
          peerId: peerIdRef.current,
          metadata: {
            echoCancellation,
            noiseSuppression,
            autoGainControl
          }
        })
      })

      const joinData = await joinResponse.json()
      if (!joinResponse.ok) {
        throw new Error(joinData.error ?? '语音房接入失败')
      }

      const initialParticipants = Array.isArray(joinData.participants)
        ? (joinData.participants as VoiceParticipantPayload[])
        : []
      await handleServerParticipants(initialParticipants)

      const syncState = async (since?: string) => {
        try {
          const query = new URLSearchParams({
            matchId,
            peerId: peerIdRef.current
          })

          if (since) {
            query.set('since', since)
          }

          const response = await fetch(`/api/match/room/voice?${query.toString()}`, {
            cache: 'no-store'
          })
          const data = await response.json()

          if (!response.ok) {
            throw new Error(data.error ?? '语音房状态同步失败')
          }

          const participants = Array.isArray(data.participants)
            ? (data.participants as VoiceParticipantPayload[])
            : []
          const signals = Array.isArray(data.signals)
            ? (data.signals as VoiceSignalPayload[])
            : []

          await handleServerParticipants(participants)
          await handleServerSignals(signals)
        } catch (syncError) {
          setError(
            syncError instanceof Error ? syncError.message : '语音房状态同步失败'
          )
        }
      }

      await syncState(lastSignalTimestampRef.current)

      const startPollingFallback = () => {
        if (pollingIntervalRef.current) {
          return
        }

        pollingIntervalRef.current = window.setInterval(() => {
          void syncState(lastSignalTimestampRef.current)
        }, 1200)
      }

      if (typeof EventSource !== 'undefined') {
        const query = new URLSearchParams({
          matchId,
          peerId: peerIdRef.current
        })
        const eventSource = new EventSource(
          `/api/match/room/voice/events?${query.toString()}`
        )

        eventSource.addEventListener('voice-state', (event) => {
          try {
            const payload = JSON.parse((event as MessageEvent).data) as {
              participants?: VoiceParticipantPayload[]
              signals?: VoiceSignalPayload[]
            }

            void handleServerParticipants(
              Array.isArray(payload.participants) ? payload.participants : []
            )
            void handleServerSignals(
              Array.isArray(payload.signals) ? payload.signals : []
            )
          } catch (streamError) {
            setError(
              streamError instanceof Error ? streamError.message : '语音房事件流解析失败'
            )
          }
        })

        eventSource.addEventListener('voice-error', (event) => {
          try {
            const payload = JSON.parse((event as MessageEvent).data) as {
              error?: string
            }
            setError(payload.error ?? '语音房事件流异常')
          } catch {
            setError('语音房事件流异常')
          }
          startPollingFallback()
        })

        eventSource.onerror = () => {
          startPollingFallback()
        }

        eventSourceRef.current = eventSource
      } else {
        startPollingFallback()
      }
    },
    [
      attachRemoteStream,
      autoGainControl,
      echoCancellation,
      handleServerParticipants,
      handleServerSignals,
      matchId,
      noiseSuppression,
      publishServerSignal
    ]
  )

  useEffect(() => {
    if (!enabled) {
      cleanup()
      return
    }

    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices?.getUserMedia ||
      typeof window === 'undefined'
    ) {
      setSupported(false)
      setError('当前浏览器不支持实时语音能力')
      return
    }

    let disposed = false
    const peerId = peerIdRef.current

    const start = async () => {
      cleanup()
      setSupported(true)
      setError(undefined)

      try {
        await fetchRtcConfig()

        const rawStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            channelCount: 1,
            sampleRate: 48000,
            echoCancellation,
            noiseSuppression,
            autoGainControl
          }
        })

        if (disposed) {
          rawStream.getTracks().forEach((track) => track.stop())
          return
        }

        streamRef.current = rawStream
        setConnected(true)

        const audioContext = new AudioContext()
        audioContextRef.current = audioContext

        const source = audioContext.createMediaStreamSource(rawStream)
        const highPass = audioContext.createBiquadFilter()
        highPass.type = 'highpass'
        highPass.frequency.value = 90

        const compressor = audioContext.createDynamicsCompressor()
        compressor.threshold.value = -28
        compressor.knee.value = 24
        compressor.ratio.value = 10
        compressor.attack.value = 0.003
        compressor.release.value = 0.25

        const gainNode = audioContext.createGain()
        gainNode.gain.value = manualGain
        gainNodeRef.current = gainNode

        const analyser = audioContext.createAnalyser()
        analyser.fftSize = 256

        const destination = audioContext.createMediaStreamDestination()
        const monitorNode = audioContext.createGain()
        monitorNode.gain.value = localMonitor ? 1 : 0
        monitorNodeRef.current = monitorNode

        source.connect(highPass)
        highPass.connect(compressor)
        compressor.connect(gainNode)
        gainNode.connect(analyser)
        analyser.connect(destination)
        analyser.connect(monitorNode)
        monitorNode.connect(audioContext.destination)

        processedStreamRef.current = destination.stream

        if (localAudioRef.current) {
          localAudioRef.current.srcObject = destination.stream
          localAudioRef.current.muted = !localMonitor
        }

        localMeterIntervalRef.current = createLevelMeter(analyser, localLevelRef)

        if (gainAutomationRef.current) {
          window.clearInterval(gainAutomationRef.current)
        }

        gainAutomationRef.current = window.setInterval(() => {
          const currentGainNode = gainNodeRef.current
          if (!currentGainNode || !autoGainControl) {
            return
          }

          const rms = localLevelRef.current
          const target =
            rms < 0.18
              ? Math.min(1.8, currentGainNode.gain.value + 0.05)
              : rms > 0.55
                ? Math.max(0.75, currentGainNode.gain.value - 0.06)
                : currentGainNode.gain.value
          currentGainNode.gain.value = Number(target.toFixed(2))
        }, 400)

        if (testMode || !matchId) {
          await setupBroadcastConnection(destination.stream)
        } else {
          await setupServerConnection(destination.stream)
        }

        syncLevels()
      } catch (voiceError) {
        setConnected(false)
        setError(voiceError instanceof Error ? voiceError.message : '麦克风初始化失败')
      }
    }

    void start()

    return () => {
      disposed = true

      if (!testMode && matchId) {
        void fetch('/api/match/room/voice', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            action: 'leave',
            matchId,
            peerId
          }),
          keepalive: true
        }).catch(() => undefined)
      }
    }
  }, [
    autoGainControl,
    cleanup,
    echoCancellation,
    enabled,
    fetchRtcConfig,
    localMonitor,
    manualGain,
    matchId,
    noiseSuppression,
    roomCode,
    setupBroadcastConnection,
    setupServerConnection,
    syncLevels,
    testMode
  ])

  useEffect(() => {
    if (monitorNodeRef.current) {
      monitorNodeRef.current.gain.value = localMonitor ? 1 : 0
    }

    if (localAudioRef.current) {
      localAudioRef.current.muted = !localMonitor
    }
  }, [localMonitor])

  useEffect(() => {
    streamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = !muted
    })
  }, [muted])

  useEffect(() => {
    if (gainNodeRef.current && !autoGainControl) {
      gainNodeRef.current.gain.value = manualGain
    }
  }, [autoGainControl, manualGain])

  const diagnostics = useMemo<VoiceDiagnostics>(
    () => ({
      supported,
      connected,
      remoteConnected,
      remotePeerLeft,
      error,
      localLevel,
      remoteLevel,
      noiseSuppression,
      echoCancellation,
      autoGainControl,
      muted,
      localMonitor,
      manualGain
    }),
    [
      autoGainControl,
      connected,
      echoCancellation,
      error,
      localLevel,
      localMonitor,
      manualGain,
      muted,
      noiseSuppression,
      remotePeerLeft,
      remoteConnected,
      remoteLevel,
      supported
    ]
  )

  return {
    diagnostics,
    localAudioRef,
    remoteAudioRef,
    controls: {
      setNoiseSuppression,
      setEchoCancellation,
      setAutoGainControl,
      setLocalMonitor,
      setManualGain,
      setMuted
    }
  }
}
