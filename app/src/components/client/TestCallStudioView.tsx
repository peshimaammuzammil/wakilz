/**
 * TestCallStudioView.tsx — Wakilz Live Call Studio
 *
 * Polling engine (works with currently deployed backend):
 *   POST /api/rasen/test-call       → triggers call, returns { id, status, ... }
 *   GET  /api/rasen/calls?max_calls=50  → polls call list for status + extraction
 *   GET  /api/rasen/calls/{id}/analysis → transcript (available after backend redeploy)
 *   GET  /api/rasen/calls/{id}/recording → signed audio URL
 *   POST /api/rasen/calls/{id}/hangup    → terminate (available after backend redeploy)
 */

import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  Phone, Headphones, Sparkles, Copy, Check, PhoneOff,
  Mic, MicOff, Play, Pause, User, MapPin, DollarSign,
  Building, Calendar, Zap, AlertCircle, Loader2, Clock
} from 'lucide-react'
import {
  triggerTestCall, fetchCallById, fetchCallAnalysisFull, sendHangup,
  fetchCallRecordingUrl, fetchAgents, fetchPhoneNumbers, fetchLiveTranscript,
  type RasenAgent, type RasenPhoneNumber
} from '@/lib/clientApi'
import { useVoiceAgent } from '@/hooks/useVoiceAgent'

// ── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  surface:      '#162032',
  deep:         '#0C1524',
  border:       'rgba(243,240,234,0.09)',
  borderStrong: 'rgba(243,240,234,0.18)',
  text:         '#F3F0EA',
  muted:        '#9BA3AF',
  dim:          '#627088',
  brass:        '#E5C07B',
  brassDim:     'rgba(229,192,123,0.10)',
  brassBdr:     'rgba(229,192,123,0.28)',
  green:        '#4FBE87',
  greenDim:     'rgba(79,190,135,0.12)',
  red:          '#F87171',
  redDim:       'rgba(248,113,113,0.12)',
  blue:         '#5A6CFF',
  blueDim:      'rgba(90,108,255,0.13)',
  slate:        '#8B94A5',
}

type CallStatus = 'idle' | 'initiating' | 'ringing' | 'in_progress' | 'completed' | 'failed'

function fmtDur(sec: number) {
  return `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`
}

function resolveStatus(raw: string): CallStatus {
  const s = (raw || '').toLowerCase()
  if (s.includes('ringing') || s.includes('dialing')) return 'ringing'
  if (s.includes('in_progress') || s.includes('connected') || s.includes('answered') || s.includes('active')) return 'in_progress'
  if (s.includes('completed') || s.includes('ended') || s.includes('finished') || s.includes('succeeded')) return 'completed'
  if (s.includes('failed') || s.includes('busy') || s.includes('no_answer') || s.includes('canceled') || s.includes('invalid')) return 'failed'
  return 'idle'
}

function normalizeTurns(raw: any): Array<{ agent?: string; user?: string }> {
  // Rasen can return transcript as: array of turn objects, a plain string, or null/undefined
  if (!raw) return []

  // If it's a plain string (some live-call responses), wrap it as an agent turn
  if (typeof raw === 'string') {
    const trimmed = raw.trim()
    return trimmed ? [{ agent: trimmed }] : []
  }

  if (!Array.isArray(raw)) return []

  return raw.flatMap((t) => {
    if (!t) return []

    // Shape A: { agent, user } — our canonical format
    if (t?.agent !== undefined || t?.user !== undefined) {
      const agent = (t.agent || '').trim()
      const user = (t.user || '').trim()
      if (!agent && !user) return []
      return [{ agent: agent || undefined, user: user || undefined }]
    }
    const role = (t?.role || t?.speaker || t?.type || '').toLowerCase()
    const text = (t?.content || t?.text || t?.message || t?.utterance || '').trim()
    if (!text) return []
    const isAgent = role.includes('agent') || role.includes('assistant') || role.includes('bot') || role === 'ai'
    return [{ agent: isAgent ? text : undefined, user: isAgent ? undefined : text }]
  })
}

// ── UI Components ─────────────────────────────────────────────────────────────
const Dot = ({ color }: { color: string }) => (
  <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}` }} />
)

const Chip = ({ icon, color, dim, text }: { icon: React.ReactNode; color: string; dim: string; text: string }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 5, background: dim, border: `1px solid ${color}40`, color: T.text, fontSize: 11, fontWeight: 600 }}>
    {React.cloneElement(icon as React.ReactElement<any>, { color, size: 11 })}
    {text}
  </span>
)

// ── Card / SectionLabel — MUST be module-level, NOT inside the component ──────
// Defining them inside causes a new function reference on every render,
// which makes React unmount+remount the subtree → input loses focus → dialpad closes.
const Card = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: 'clamp(12px,2vw,18px)', boxShadow: '0 4px 20px rgba(0,0,0,0.22)', ...style }}>
    {children}
  </div>
)

const SectionLabel = ({ text }: { text: string }) => (
  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', color: T.dim, textTransform: 'uppercase', marginBottom: 8 }}>{text}</div>
)


export default function TestCallStudioView({
  userRole = 'client',
  selectedAgentId,
}: {
  userRole?: string
  selectedAgentId?: string
}) {
  const isAdmin = userRole === 'admin'

  // Mode: phone (admin only) | webrtc (all)
  const [mode, setMode] = useState<'phone' | 'webrtc'>(isAdmin ? 'phone' : 'webrtc')

  // Config — loaded once
  const [agents, setAgents] = useState<RasenAgent[]>([])
  const [phoneNums, setPhoneNums] = useState<RasenPhoneNumber[]>([])
  const [agentId, setAgentId] = useState(selectedAgentId || '')
  const [phoneNumId, setPhoneNumId] = useState('')

  // Phone call state
  const [target, setTarget] = useState('')
  const [callId, setCallId] = useState<string | null>(null)
  const [callStatus, setCallStatus] = useState<CallStatus>('idle')
  const [durSec, setDurSec] = useState(0)
  const [turns, setTurns] = useState<Array<{ agent?: string; user?: string }>>([])
  const [extracted, setExtracted] = useState<Record<string, any>>({})
  const [callSummary, setCallSummary] = useState<string>('')
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null)
  const [callErr, setCallErr] = useState<string | null>(null)
  const [launching, setLaunching] = useState(false)
  const [hasTranscript, setHasTranscript] = useState(false)
  const [txStatus, setTxStatus] = useState<string>('')  // live transcript debug status

  // WebRTC
  const { state: rtcState, connect: rtcConnect, disconnect: rtcDisconnect, isBotSpeaking } = useVoiceAgent()
  const [rtcMuted, setRtcMuted] = useState(false)
  const [rtcDur, setRtcDur] = useState(0)
  const [rtcSessionId, setRtcSessionId] = useState('')

  // UI
  const [copied, setCopied] = useState<string | null>(null)
  const [audioPlaying, setAudioPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const hangingUp = useRef(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const transcriptAfterIdRef = useRef<number>(0)  // cursor for live transcript polling

  // ── Load agents & phone numbers ──────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      fetchAgents().catch(() => [] as RasenAgent[]),
      fetchPhoneNumbers().catch(() => [] as RasenPhoneNumber[]),
    ]).then(([ag, pn]) => {
      setAgents(ag)
      setPhoneNums(pn)
      if (ag.length && !agentId) setAgentId(ag[0].id)
      if (pn.length && !phoneNumId) setPhoneNumId(pn[0].id)
    })
  }, [])

  // ── Autoscroll transcript ────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [turns])

  // ── Duration counter — only counts once the call is actually connected ────
  useEffect(() => {
    if (callStatus !== 'in_progress') return   // Do NOT start on 'ringing'
    const t = setInterval(() => setDurSec(s => s + 1), 1000)
    return () => clearInterval(t)
  }, [callStatus])

  useEffect(() => {
    if (rtcState !== 'connected') { setRtcDur(0); return }
    const t = setInterval(() => setRtcDur(s => s + 1), 1000)
    return () => clearInterval(t)
  }, [rtcState])

  // ── Main polling loop ─────────────────────────────────────────────────────
  // Runs every 2.5s while call is active.
  // - Call status + extraction: via fetchCallById / fetchCallAnalysisFull
  // - Live transcript: via dedicated fetchLiveTranscript (cursor-based)
  useEffect(() => {
    if (!callId) return
    if (callStatus === 'completed' || callStatus === 'failed') return

    // Reset transcript cursor each time we start a new call poll session
    transcriptAfterIdRef.current = 0

    const tick = async () => {
      if (hangingUp.current) return

      // 1. Call status + extraction (unchanged)
      const callData = await fetchCallById(callId)
      if (!callData) return

      const newStatus = resolveStatus(callData.status || callData.detailed_status || '')
      if (newStatus !== 'idle') {
        setCallStatus(prev => {
          if (prev === 'in_progress' && newStatus === 'ringing') return prev
          return newStatus
        })
      }

      // 2. Live transcript via the dedicated cursor-based endpoint
      let txData: Awaited<ReturnType<typeof fetchLiveTranscript>> | null = null
      try {
        txData = await fetchLiveTranscript(callId, transcriptAfterIdRef.current)
        setTxStatus(`cursor=${txData.next_after_id} items=${txData.items.length} complete=${txData.stream_complete} status=${txData.status}`)
      } catch (txErr) {
        setTxStatus(`ERROR: ${txErr}`)
      }

      if (txData && txData.items.length > 0) {
        // Convert Rasen items { role, text } → our { agent?, user? } shape
        const newTurns = txData.items
          .filter(item => item.is_final)   // only committed utterances
          .map(item => (
            item.role === 'assistant'
              ? { agent: item.text }
              : { user: item.text }
          ))
        if (newTurns.length > 0) {
          setTurns(prev => [...prev, ...newTurns])
          setHasTranscript(true)
        }
      }
      // Always advance cursor even if items is empty (server may skip internal events)
      if (txData) transcriptAfterIdRef.current = txData.next_after_id

      // 3. Extraction (post-call fields that appear during/after call)
      const analysis = await fetchCallAnalysisFull(callId)
      if (analysis.extraction && Object.keys(analysis.extraction).length) {
        setExtracted(analysis.extraction)
        const summary = analysis.extraction['Call Summary'] || analysis.extraction.call_summary || ''
        if (summary) setCallSummary(summary)
      }

      // 4. If call ended — show post-call transcript + recording
      if (newStatus === 'completed' || newStatus === 'failed') {
        stopPolling()

        // Show post-call transcript from analysis (works reliably via GET /calls/{id})
        if (!hasTranscript && analysis.transcript) {
          const postTurns = normalizeTurns(analysis.transcript)
          if (postTurns.length > 0) {
            setTurns(postTurns)
            setHasTranscript(true)
          }
        }

        // Fetch recording URL (fetchCallRecordingUrl returns the URL string directly)
        const recUrl = await fetchCallRecordingUrl(callId).catch(() => null)
        if (recUrl) setRecordingUrl(recUrl)
        else if (analysis.recording_url) setRecordingUrl(analysis.recording_url)
      }
    }

    pollRef.current = setInterval(tick, 2500)
    tick() // run immediately

    return () => stopPolling()
  }, [callId, callStatus])

  const stopPolling = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
  }

  // ── Copy helper ──────────────────────────────────────────────────────────
  const doCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  // ── Launch phone call ────────────────────────────────────────────────────
  const handleLaunch = async () => {
    const num = target.trim()
    if (!num) { setCallErr('Enter a phone number (e.g. +91 98765 43210)'); return }

    setCallErr(null)
    setLaunching(true)
    setCallStatus('initiating')
    setDurSec(0)
    setTurns([])
    setExtracted({})
    setCallSummary('')
    setRecordingUrl(null)
    setHasTranscript(false)
    hangingUp.current = false

    try {
      const e164 = num.startsWith('+') ? num : `+91${num.replace(/^0+/, '')}`
      const res = await triggerTestCall({
        phone_number: e164,
        agent_id: agentId || undefined,
        phone_number_id: phoneNumId || undefined,
        variables: {},
      })

      // Rasen returns id at top-level for single calls
      const cid = res?.id || res?.call_id || res?.recipients?.[0]?.call_id || res?.items?.[0]?.id
      if (!cid) throw new Error('No call ID returned. Check phone number format.')

      setCallId(cid)
      setCallStatus('ringing')
    } catch (e: any) {
      setCallErr(e?.message || 'Call failed — check phone number format (+91XXXXXXXXXX)')
      setCallStatus('failed')
    } finally {
      setLaunching(false)
    }
  }

  // ── Hangup ───────────────────────────────────────────────────────────────
  const handleHangup = async () => {
    if (!callId || hangingUp.current) return
    hangingUp.current = true
    stopPolling()
    setCallStatus('completed')

    await sendHangup(callId)

    // Final fetch
    const analysis = await fetchCallAnalysisFull(callId)
    const finalTurns = normalizeTurns(analysis.transcript)
    if (finalTurns.length) setTurns(finalTurns)
    if (analysis.extraction) setExtracted(analysis.extraction)

    const recUrl = await fetchCallRecordingUrl(callId).catch(() => null)
    if (recUrl) setRecordingUrl(recUrl)
    else if (analysis.recording_url) setRecordingUrl(analysis.recording_url)
  }

  // ── WebRTC ───────────────────────────────────────────────────────────────
  const handleRtcConnect = async () => {
    setRtcSessionId(`sess_${Date.now().toString(36)}`)
    await rtcConnect()
  }

  // ── Status badge ─────────────────────────────────────────────────────────
  const statusBadge = () => {
    switch (callStatus) {
      case 'initiating':  return <span style={badge(T.dim)}><Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} /> Connecting…</span>
      // Ringing: show spinner — NO timer yet (timer starts only once connected)
      case 'ringing':     return <span style={badge(T.brass)}><Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} /> Ringing…</span>
      case 'in_progress': return <span style={badge(T.green)}><Dot color={T.green} /> Live · {fmtDur(durSec)}</span>
      case 'completed':   return <span style={badge(T.slate)}>✓ Completed · {fmtDur(durSec)}</span>
      case 'failed':      return <span style={badge(T.red)}>✕ Call Failed / Invalid Number</span>
      default:            return <span style={badge(T.dim)}>Ready to dial</span>
    }
  }

  const badge = (color: string): React.CSSProperties => ({
    display: 'inline-flex', alignItems: 'center', gap: 5,
    fontSize: 11.5, fontWeight: 700, color,
  })

  const isLive = callStatus === 'in_progress' || callStatus === 'ringing'
  const WH = [5, 13, 9, 18, 13, 16, 9, 14, 11, 16, 9, 13, 17, 11, 7]

  // Card and SectionLabel are defined OUTSIDE the component (above) to keep stable references

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 800, margin: '0 auto' }}>

      {/* ── Mode Switcher ── */}
      <div style={{ display: 'flex', background: T.deep, border: `1px solid ${T.borderStrong}`, borderRadius: 11, padding: 3, gap: 3 }}>
        {[
          { id: 'phone',  icon: Phone,     label: isAdmin ? 'Phone Call (Admin)' : 'Phone Call 🔒', locked: !isAdmin },
          { id: 'webrtc', icon: Headphones, label: 'Browser WebRTC',  locked: false },
        ].map(({ id, icon: Icon, label, locked }) => (
          <button key={id} onClick={() => !locked && setMode(id as 'phone' | 'webrtc')} style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '7px 10px', borderRadius: 8,
            border: mode === id ? `1px solid ${T.brass}` : '1px solid transparent',
            background: mode === id ? T.brassDim : 'transparent',
            color: mode === id ? T.brass : T.muted,
            fontSize: 12.5, fontWeight: mode === id ? 700 : 500,
            cursor: locked ? 'not-allowed' : 'pointer', opacity: locked ? 0.4 : 1,
            transition: 'all 0.12s', whiteSpace: 'nowrap',
          }}>
            <Icon size={13} /><span>{label}</span>
          </button>
        ))}
      </div>

      {/* ══════════ PHONE MODE ══════════ */}
      {mode === 'phone' && (<>

        {/* ── Dial Row ── */}
        <Card>
          <SectionLabel text="Target Number" />
          <div style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Phone size={14} color={T.dim} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input
                type="tel"
                placeholder="+91 98765 43210"
                value={target}
                onChange={e => setTarget(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !launching && handleLaunch()}
                disabled={launching || isLive}
                style={{
                  width: '100%', padding: '9px 10px 9px 34px', borderRadius: 9,
                  background: T.deep, border: `1px solid ${T.borderStrong}`,
                  color: T.text, fontSize: 14, fontWeight: 600, outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>

            {isLive ? (
              <button onClick={handleHangup} style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 9,
                background: T.redDim, border: `1px solid rgba(248,113,113,0.4)`,
                color: T.red, fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
              }}>
                <PhoneOff size={14} /> Hang Up
              </button>
            ) : (
              <button onClick={handleLaunch} disabled={launching || callStatus === 'initiating'} style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 9,
                background: (launching || callStatus === 'initiating') ? T.brassDim : `linear-gradient(135deg, ${T.brass}, #C9A84C)`,
                border: 'none', color: '#0C1524', fontSize: 13, fontWeight: 800,
                cursor: (launching || callStatus === 'initiating') ? 'not-allowed' : 'pointer',
                boxShadow: '0 3px 12px rgba(229,192,123,0.28)', whiteSpace: 'nowrap',
              }}>
                {launching
                  ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Dialing…</>
                  : <><Zap size={14} fill="#0C1524" /> Call</>
                }
              </button>
            )}
          </div>

          {callErr && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, color: T.red, fontSize: 12 }}>
              <AlertCircle size={13} />{callErr}
            </div>
          )}
        </Card>

        {/* ── Live Console ── */}
        <Card>
          {/* Status + Call ID row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 6 }}>
            {statusBadge()}
            {callId && (
              <button onClick={() => doCopy(callId, 'cid')} style={{
                display: 'flex', alignItems: 'center', gap: 5, padding: '3px 8px', borderRadius: 6,
                background: T.brassDim, border: `1px solid ${T.brassBdr}`,
                color: T.brass, fontSize: 11, fontFamily: 'monospace', fontWeight: 600, cursor: 'pointer',
              }} title="Copy Call ID">
                {copied === 'cid' ? <Check size={11} color={T.green} /> : <Copy size={11} />}
                {callId.slice(0, 8)}…
              </button>
            )}
          </div>

          {/* Waveform */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2.5,
            height: 22, borderRadius: 6, background: 'rgba(12,21,36,0.6)', marginBottom: 10, padding: '0 10px',
          }}>
            {WH.map((h, i) => (
              <div key={i} style={{
                width: 2.5, borderRadius: 2, transition: 'height 0.4s ease',
                height: isLive ? `${h}px` : '2px',
                background: isLive ? T.brass : T.borderStrong,
                opacity: isLive ? 0.85 : 0.25,
              }} />
            ))}
          </div>

          {/* Transcript bubbles */}
          <div style={{
            background: T.deep, borderRadius: 10, padding: 10,
            minHeight: 90, maxHeight: 220, overflowY: 'auto',
            display: 'flex', flexDirection: 'column', gap: 7,
            border: `1px solid ${T.border}`, marginBottom: 10,
          }}>
            {turns.length === 0 ? (
              <div style={{ margin: 'auto', textAlign: 'center', padding: '12px 0' }}>
                <p style={{ color: T.dim, fontSize: 12, margin: 0 }}>
                  {isLive
                    ? '🎙 Call is live — transcript streams here automatically…'
                    : callStatus === 'completed'
                      ? callSummary
                        ? <span style={{ color: T.muted, fontSize: 12 }}>📋 {callSummary}</span>
                        : '✓ Call ended. Transcript unavailable — backend update pending.'
                      : 'Transcript will appear here during the active call.'}
                </p>
                {/* Transcript API debug status — visible during live call */}
                {isLive && txStatus && (
                  <p style={{ color: T.dim, fontSize: 10, marginTop: 5, fontFamily: 'monospace', opacity: 0.7 }}>
                    📡 {txStatus}
                  </p>
                )}
                {callStatus === 'completed' && !turns.length && (
                  <p style={{ color: T.dim, fontSize: 11, marginTop: 6 }}>
                    💡 Full transcript unlocks after the backend update deploys.
                  </p>
                )}
              </div>
            ) : (
              turns.map((t, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {t.agent && (
                    <div style={{
                      alignSelf: 'flex-start', maxWidth: '86%',
                      background: T.brassDim, border: `1px solid ${T.brassBdr}`,
                      borderRadius: '10px 10px 10px 2px', padding: '7px 11px',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginBottom: 2 }}>
                        <Sparkles size={10} color={T.brass} />
                        <span style={{ fontSize: 10, fontWeight: 700, color: T.brass }}>Agent</span>
                      </div>
                      <p style={{ margin: 0, fontSize: 12.5, color: T.text, lineHeight: 1.45 }}>{t.agent}</p>
                    </div>
                  )}
                  {t.user && (
                    <div style={{
                      alignSelf: 'flex-end', maxWidth: '86%',
                      background: 'rgba(34,48,72,0.7)', border: `1px solid ${T.border}`,
                      borderRadius: '10px 10px 2px 10px', padding: '7px 11px',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 3, marginBottom: 2 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: T.slate }}>Prospect</span>
                        <User size={10} color={T.slate} />
                      </div>
                      <p style={{ margin: 0, fontSize: 12.5, color: T.text, lineHeight: 1.45 }}>{t.user}</p>
                    </div>
                  )}
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>

          {/* Extraction chips */}
          {Object.keys(extracted).some(k => ['lead_name','preferred_location','budget_range','property_type','site_visit_slot'].includes(k) && extracted[k]) && (
            <div style={{ marginBottom: 10 }}>
              <SectionLabel text="Extracted Criteria" />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {extracted.lead_name         && <Chip icon={<User />}      color={T.blue}  dim={T.blueDim}  text={extracted.lead_name} />}
                {extracted.preferred_location && <Chip icon={<MapPin />}    color={T.red}   dim={T.redDim}   text={extracted.preferred_location} />}
                {extracted.budget_range       && <Chip icon={<DollarSign />} color={T.brass} dim={T.brassDim} text={extracted.budget_range} />}
                {extracted.property_type      && <Chip icon={<Building />}  color={T.green} dim={T.greenDim} text={extracted.property_type} />}
                {extracted.site_visit_slot    && <Chip icon={<Calendar />}  color={T.brass} dim={T.brassDim} text={extracted.site_visit_slot} />}
              </div>
            </div>
          )}

          {/* Recording player */}
          {recordingUrl && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
              background: T.deep, border: `1px solid ${T.brassBdr}`, borderRadius: 9,
            }}>
              <audio ref={audioRef} src={recordingUrl} onEnded={() => setAudioPlaying(false)} />
              <button onClick={() => {
                if (!audioRef.current) return
                if (audioPlaying) { audioRef.current.pause(); setAudioPlaying(false) }
                else { audioRef.current.play(); setAudioPlaying(true) }
              }} style={{ width: 30, height: 30, borderRadius: '50%', background: T.brass, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                {audioPlaying ? <Pause size={13} color="#0C1524" /> : <Play size={13} color="#0C1524" style={{ marginLeft: 1 }} />}
              </button>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.text }}>Call Recording</div>
                <div style={{ fontSize: 10.5, color: T.dim }}>Tap to play audio</div>
              </div>
            </div>
          )}
        </Card>
      </>)}

      {/* ══════════ WEBRTC MODE ══════════ */}
      {mode === 'webrtc' && (
        <Card style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <SectionLabel text="Browser Voice Test" />
            {rtcSessionId && (
              <button onClick={() => doCopy(rtcSessionId, 'sess')} style={{
                display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 6,
                background: T.brassDim, border: `1px solid ${T.brassBdr}`, color: T.brass,
                fontSize: 11, fontFamily: 'monospace', cursor: 'pointer',
              }}>
                {copied === 'sess' ? <Check size={11} color={T.green} /> : <Copy size={11} />}
                {rtcSessionId}
              </button>
            )}
          </div>

          {/* Voice orb */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div style={{ position: 'relative', width: 88, height: 88, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `1.5px dashed ${rtcState === 'connected' ? (isBotSpeaking ? T.brass : T.green) : T.borderStrong}`, opacity: 0.55 }} />
              <div style={{
                width: 62, height: 62, borderRadius: '50%',
                background: rtcState === 'connected'
                  ? (isBotSpeaking ? `radial-gradient(circle, ${T.brass}, #9B6B2A)` : `radial-gradient(circle, ${T.green}, #162032)`)
                  : T.deep,
                border: `1.5px solid ${rtcState === 'connected' ? T.brass : T.borderStrong}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: rtcState === 'connected' ? (isBotSpeaking ? '0 0 20px rgba(229,192,123,0.5)' : '0 0 16px rgba(79,190,135,0.4)') : 'none',
                transition: 'all 0.25s ease',
              }}>
                <Mic size={24} color={rtcState === 'connected' ? '#0C1524' : T.muted} />
              </div>
            </div>

            <div style={{ fontSize: 12, fontWeight: 600, textAlign: 'center', color: rtcState === 'connected' ? T.green : rtcState === 'connecting' ? T.brass : T.dim }}>
              {rtcState === 'connected'
                ? (isBotSpeaking ? `🔊 Agent Speaking…` : `🎙 Listening · ${fmtDur(rtcDur)}`)
                : rtcState === 'connecting' ? 'Establishing connection…'
                : 'Tap to start browser voice test'}
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', gap: 8 }}>
              {rtcState === 'connected' ? (<>
                <button onClick={() => setRtcMuted(!rtcMuted)} style={{
                  display: 'flex', alignItems: 'center', gap: 5, padding: '8px 12px', borderRadius: 8,
                  background: rtcMuted ? T.redDim : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${rtcMuted ? T.red : T.border}`,
                  color: rtcMuted ? T.red : T.text, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                }}>
                  {rtcMuted ? <MicOff size={13} /> : <Mic size={13} />}
                  {rtcMuted ? 'Unmute' : 'Mute'}
                </button>
                <button onClick={rtcDisconnect} style={{
                  display: 'flex', alignItems: 'center', gap: 5, padding: '8px 12px', borderRadius: 8,
                  background: T.redDim, border: `1px solid rgba(248,113,113,0.35)`,
                  color: T.red, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                }}>
                  <PhoneOff size={13} /> End
                </button>
              </>) : (
                <button onClick={handleRtcConnect} disabled={rtcState === 'connecting'} style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '9px 20px', borderRadius: 8,
                  background: `linear-gradient(135deg, ${T.brass}, #C9A84C)`,
                  border: 'none', color: '#0C1524', fontSize: 13, fontWeight: 800,
                  cursor: 'pointer', boxShadow: '0 3px 12px rgba(229,192,123,0.28)',
                }}>
                  <Zap size={14} fill="#0C1524" /> Start Voice Test
                </button>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
