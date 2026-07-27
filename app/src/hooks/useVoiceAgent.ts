/**
 * useVoiceAgent — Pipecat WebRTC voice session lifecycle hook.
 *
 * Handles the full flow:
 *   1. Fetch a short-lived session token from the HF Space /session endpoint
 *   2. Connect to Pipecat's WebRTC /start endpoint using the token
 *   3. Emit isBotSpeaking state changes for the HeroSphere animation
 *   4. Manage voice state (idle → connecting → connected → idle / error)
 *
 * Usage:
 *   const { state, connect, disconnect, isBotSpeaking } = useVoiceAgent()
 */

import { useState, useRef, useCallback } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE THIS to your deployed HF Spaces URL after deployment.
// e.g. 'https://peshimaammuzammil-re-voice-agent.hf.space'
// Keep NO trailing slash.
// ─────────────────────────────────────────────────────────────────────────────
const HF_SPACE_URL = 'http://localhost:7860'

export type VoiceState = 'idle' | 'connecting' | 'connected' | 'error'

export interface UseVoiceAgentReturn {
  state: VoiceState
  connect: () => Promise<void>
  disconnect: () => void
  isBotSpeaking: boolean
}

export function useVoiceAgent(): UseVoiceAgentReturn {
  const [state, setState] = useState<VoiceState>('idle')
  const [isBotSpeaking, setIsBotSpeaking] = useState(false)

  // We store the raw RTCPeerConnection so we can close it on disconnect
  const pcRef = useRef<RTCPeerConnection | null>(null)
  const wsRef = useRef<WebSocket | null>(null)

  const disconnect = useCallback(() => {
    try {
      wsRef.current?.close()
      pcRef.current?.close()
      const audioEl = document.getElementById('pipecat-voice-audio')
      if (audioEl) audioEl.remove()
    } catch (_) {
      // best-effort
    }
    wsRef.current = null
    pcRef.current = null
    setIsBotSpeaking(false)
    setState('idle')
  }, [])

  const connect = useCallback(async () => {
    if (state !== 'idle' && state !== 'error') return
    setState('connecting')
    setIsBotSpeaking(false)

    try {
      // ── Step 1: Fetch session token ───────────────────────────────────────
      const sessionRes = await fetch(`${HF_SPACE_URL}/session`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })
      if (!sessionRes.ok) {
        throw new Error(`Session endpoint returned ${sessionRes.status}`)
      }
      const { token } = await sessionRes.json() as { token: string; expires_in: number }

      // ── Step 2: Create RTCPeerConnection ──────────────────────────────────
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      })
      pcRef.current = pc

      // Create data channel as expected by Pipecat SmallWebRTC
      const dc = pc.createDataChannel('pipecat')
      dc.onmessage = (e) => {
        console.log('[useVoiceAgent] Data channel message:', e.data)
      }

      // Track bot audio to detect speaking state via Web Audio
      const audioCtx = new AudioContext()
      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 256
      const dataArray = new Uint8Array(analyser.frequencyBinCount)
      let botSpeakingPollId: ReturnType<typeof setInterval> | null = null

      pc.ontrack = (event) => {
        if (event.track.kind === 'audio') {
          const stream = new MediaStream([event.track])
          
          // Connect to analyser & destination for Web Audio playback and analysis
          const source = audioCtx.createMediaStreamSource(stream)
          source.connect(analyser)
          analyser.connect(audioCtx.destination)

          // Play through a dynamically created hidden audio element (Safari/Browser fallback)
          const audioEl = document.createElement('audio')
          audioEl.id = 'pipecat-voice-audio'
          audioEl.srcObject = stream
          audioEl.autoplay = true
          audioEl.style.display = 'none'

          const oldAudio = document.getElementById('pipecat-voice-audio')
          if (oldAudio) oldAudio.remove()

          document.body.appendChild(audioEl)

          // Poll audio energy to drive isBotSpeaking
          botSpeakingPollId = setInterval(() => {
            analyser.getByteFrequencyData(dataArray)
            const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length
            setIsBotSpeaking(avg > 8) // threshold — adjust if needed
          }, 80)
        }
      }

      // Add local mic track
      let localStream: MediaStream
      try {
        localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      } catch (_) {
        throw new Error('Microphone access denied. Please allow mic access and try again.')
      }
      localStream.getTracks().forEach(track => pc.addTrack(track, localStream))

      // ── Step 3: Signal via Pipecat ────────────────────────────────────────
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)

      // A. Call /start to obtain a sessionId
      const startRes = await fetch(`${HF_SPACE_URL}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          transport: 'webrtc',
        }),
      })

      if (!startRes.ok) {
        throw new Error(`Pipecat /start returned ${startRes.status}`)
      }
      const { sessionId } = await startRes.json() as { sessionId: string }

      // B. Call /sessions/{sessionId}/api/offer to send offer and get SDP answer
      const offerRes = await fetch(`${HF_SPACE_URL}/sessions/${sessionId}/api/offer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          sdp: offer.sdp,
          type: offer.type,
        }),
      })

      if (!offerRes.ok) {
        throw new Error(`Pipecat /api/offer returned ${offerRes.status}`)
      }
      const answer = await offerRes.json() as { sdp: string; type: RTCSdpType }
      await pc.setRemoteDescription(new RTCSessionDescription(answer))

      // ── Step 4: Monitor connection state ──────────────────────────────────
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'connected') {
          setState('connected')
        } else if (
          pc.connectionState === 'disconnected' ||
          pc.connectionState === 'failed' ||
          pc.connectionState === 'closed'
        ) {
          if (botSpeakingPollId) clearInterval(botSpeakingPollId)
          audioCtx.close().catch(() => {})
          setIsBotSpeaking(false)
          setState('idle')
          pcRef.current = null
        }
      }

    } catch (err) {
      console.error('[useVoiceAgent] Connection error:', err)
      disconnect()
      setState('error')
    }
  }, [state, disconnect])

  return { state, connect, disconnect, isBotSpeaking }
}
