import { useState, useEffect, useRef, useCallback } from 'react'
import '../conversations.css'

// ── Types ────────────────────────────────────────────────────────────────────

interface TranscriptTurn {
  index: number
  speaker: 'bot' | 'user'
  text: string
  timestamp_secs: number
  language: string
}

interface Conversation {
  session_id: string
  call_date: string
  call_start_iso: string
  call_duration_secs: number | null
  lead_name: string
  budget: string
  budget_tier: string
  city_preference: string
  property_type: string
  timeline: string
  language: string
  outcome: string
  lead_score: number
  qualification: {
    name_captured: boolean
    budget_captured: boolean
    location_captured: boolean
    property_type_captured: boolean
    timeline_captured: boolean
    questions_completed: number
    questions_total: number
  }
  talk_ratio: { bot_pct: number; user_pct: number; bot_words: number; user_words: number }
  intent_signals: {
    ready_to_visit: boolean
    callback_agreed: boolean
    agent_escalation_requested: boolean
    objection_detected: boolean
    objection_count: number
  }
  stats: { user_turns: number; bot_turns: number; total_turns: number; language_switches: number }
  has_audio: boolean
  has_transcript: boolean
  transcript?: TranscriptTurn[] | null
}

// ── Config ───────────────────────────────────────────────────────────────────

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://peshimaammuzammil-sky49.hf.space'
const API_KEY  = import.meta.env.VITE_CONVERSATIONS_API_KEY || ''
const LIST_CACHE_KEY = 'wakilz_conv_list_v1'
const DETAIL_CACHE_PREFIX = 'wakilz_conv_detail_v1_'

function apiHeaders() {
  const h: Record<string, string> = { 'Content-Type': 'application/json' }
  if (API_KEY) h['X-Api-Key'] = API_KEY
  return h
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDuration(secs: number | null): string {
  if (!secs) return '--:--'
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function formatRelativeTime(isoStr: string): string {
  if (!isoStr) return '—'
  const d = new Date(isoStr)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffH = Math.floor(diffMs / 3600000)
  const diffD = Math.floor(diffH / 24)
  if (diffH < 1) return 'Just now'
  if (diffH < 24) return `${diffH}h ago`
  if (diffD < 7) return `${diffD}d ago`
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatTimestamp(secs: number): string {
  const m = Math.floor(secs / 60)
  const s = Math.floor(secs % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

const OUTCOME_LABELS: Record<string, string> = {
  lead_captured:  'Lead',
  partial_lead:   'Partial',
  no_lead:        'No Lead',
  hung_up_early:  'Hung Up',
}

// ── Lead Score Ring ───────────────────────────────────────────────────────────

function LeadScoreRing({ score }: { score: number }) {
  const r = 14
  const circ = 2 * Math.PI * r
  const filled = (score / 100) * circ
  const color = score >= 70 ? '#4FBE87' : score >= 40 ? '#F0B429' : '#EF4444'
  return (
    <div className="lead-score-ring">
      <svg width="36" height="36" viewBox="0 0 36 36">
        <circle cx="18" cy="18" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
        <circle
          cx="18" cy="18" r={r} fill="none"
          stroke={color} strokeWidth="3"
          strokeDasharray={`${filled} ${circ}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
      </svg>
      <div className="lead-score-text">{score}</div>
    </div>
  )
}

// ── Audio Player ─────────────────────────────────────────────────────────────

function AudioPlayer({
  sessionId,
  onSeek,
  currentTimeSecs,
}: {
  sessionId: string
  onSeek: (secs: number) => void
  currentTimeSecs: number
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Seek from transcript click
  useEffect(() => {
    if (audioRef.current && currentTimeSecs > 0) {
      audioRef.current.currentTime = currentTimeSecs
    }
  }, [currentTimeSecs])

  const fetchAndPlay = useCallback(async () => {
    if (audioUrl) {
      // Already fetched — just toggle play/pause
      if (audioRef.current) {
        if (playing) {
          audioRef.current.pause()
          setPlaying(false)
        } else {
          audioRef.current.play()
          setPlaying(true)
        }
      }
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/api/conversations/${sessionId}/audio`, { headers: apiHeaders() })
      if (!res.ok) throw new Error('Audio unavailable')
      const data = await res.json()
      setAudioUrl(data.audio_url)
    } catch {
      setError('Audio unavailable')
    } finally {
      setLoading(false)
    }
  }, [audioUrl, playing, sessionId])

  // Auto-play once URL is fetched
  useEffect(() => {
    if (audioUrl && audioRef.current) {
      audioRef.current.play().then(() => setPlaying(true)).catch(() => {})
    }
  }, [audioUrl])

  const handleTimeUpdate = () => {
    if (audioRef.current) setCurrentTime(audioRef.current.currentTime)
  }
  const handleLoadedMetadata = () => {
    if (audioRef.current) setDuration(audioRef.current.duration)
  }
  const handleEnded = () => setPlaying(false)

  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = (e.clientX - rect.left) / rect.width
    const secs = pct * duration
    audioRef.current.currentTime = secs
    onSeek(secs)
  }

  const pct = duration > 0 ? (currentTime / duration) * 100 : 0

  // Fake waveform bars — 40 bars, random heights for visual interest
  const bars = Array.from({ length: 40 }, (_, i) => {
    const h = 20 + ((Math.sin(i * 0.7) + Math.cos(i * 0.4)) * 30 + 30)
    const filled = (i / 40) * 100 <= pct
    return { h: Math.max(8, Math.min(60, h)), filled }
  })

  return (
    <div className="conv-audio-section">
      <div className="conv-audio-label">🎵 Audio & Spotlight</div>
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
        />
      )}
      <div className="conv-audio-player">
        <button className="audio-play-btn" onClick={fetchAndPlay} disabled={loading} title={playing ? 'Pause' : 'Play'}>
          {loading ? (
            <div className="conv-spinner" style={{ width: 14, height: 14 }} />
          ) : playing ? (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <rect x="2" y="1" width="3" height="10" rx="1" fill="white"/>
              <rect x="7" y="1" width="3" height="10" rx="1" fill="white"/>
            </svg>
          ) : (
            <svg width="12" height="14" viewBox="0 0 12 14" fill="none">
              <path d="M1 1L11 7L1 13V1Z" fill="white"/>
            </svg>
          )}
        </button>

        <div className="audio-progress-wrap">
          {/* Waveform */}
          <div className="audio-waveform" onClick={handleTrackClick}>
            {bars.map((b, i) => (
              <div
                key={i}
                className="audio-waveform-bar"
                style={{
                  height: `${b.h}%`,
                  background: b.filled ? 'var(--accent-glow)' : 'rgba(255,255,255,0.12)',
                }}
              />
            ))}
          </div>
          {/* Progress bar */}
          <div className="audio-progress-track" onClick={handleTrackClick}>
            <div className="audio-progress-fill" style={{ width: `${pct}%` }} />
          </div>
        </div>

        <div className="audio-time">
          {formatTimestamp(currentTime)} / {formatDuration(duration || null)}
        </div>
      </div>
      {error && <div style={{ color: '#EF4444', fontSize: 11, marginTop: 8, fontFamily: 'var(--font-mono)' }}>{error}</div>}
    </div>
  )
}

// ── Transcript View ───────────────────────────────────────────────────────────

function TranscriptView({
  transcript,
  activeTurn,
  onTurnClick,
}: {
  transcript: TranscriptTurn[]
  activeTurn: number | null
  onTurnClick: (turn: TranscriptTurn) => void
}) {
  const activeRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [activeTurn])

  return (
    <div className="conv-transcript-section">
      <div className="conv-transcript-label">Transcript</div>
      {transcript.map((turn) => (
        <div
          key={turn.index}
          ref={turn.index === activeTurn ? activeRef : undefined}
          className={`transcript-turn ${turn.speaker} ${turn.index === activeTurn ? 'active' : ''}`}
          onClick={() => onTurnClick(turn)}
        >
          <div className={`transcript-avatar ${turn.speaker === 'bot' ? 'avatar-bot' : 'avatar-user'}`}>
            {turn.speaker === 'bot' ? '🤖' : '👤'}
          </div>
          <div className="transcript-bubble-wrap">
            <div className="transcript-bubble">{turn.text}</div>
            <div className="transcript-ts">{formatTimestamp(turn.timestamp_secs)}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Info Tabs ─────────────────────────────────────────────────────────────────

type Tab = 'information' | 'call_quality' | 'lead_signals' | 'bot_performance' | 'ai_insights'

function InfoPanel({ conv }: { conv: Conversation }) {
  const [activeTab, setActiveTab] = useState<Tab>('information')

  const tabs: { key: Tab; label: string; comingSoon?: boolean }[] = [
    { key: 'information',     label: 'Information' },
    { key: 'call_quality',    label: 'Call Quality' },
    { key: 'lead_signals',    label: 'Lead Signals' },
    { key: 'bot_performance', label: 'Bot Performance' },
    { key: 'ai_insights',     label: 'AI Insights', comingSoon: true },
  ]

  return (
    <div className="conv-info-section">
      <div className="conv-info-tabs">
        {tabs.map(t => (
          <div
            key={t.key}
            className={`conv-info-tab ${activeTab === t.key ? 'active' : ''}`}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
            {t.comingSoon && <span className="coming-soon-badge">Soon</span>}
          </div>
        ))}
      </div>

      <div className="conv-info-content">
        {activeTab === 'information' && <InformationTab conv={conv} />}
        {activeTab === 'call_quality'    && <CallQualityTab conv={conv} />}
        {activeTab === 'lead_signals'    && <LeadSignalsTab conv={conv} />}
        {activeTab === 'bot_performance' && <BotPerformanceTab conv={conv} />}
        {activeTab === 'ai_insights'     && <AIInsightsTab />}
      </div>
    </div>
  )
}

function KVRow({ label, value, primary, mono }: { label: string; value: string; primary?: boolean; mono?: boolean }) {
  return (
    <div className="meta-kv-row">
      <div className="meta-key">{label}</div>
      <div className={`meta-value ${primary ? 'primary' : ''} ${mono ? 'mono' : ''}`}>{value || '—'}</div>
    </div>
  )
}

function InformationTab({ conv }: { conv: Conversation }) {
  const startDate = conv.call_start_iso ? new Date(conv.call_start_iso).toLocaleString('en-IN', {
    dateStyle: 'medium', timeStyle: 'short'
  }) : '—'
  return (
    <>
      {conv.ai_summary && (
        <>
          <div className="insight-section-label">Call Summary</div>
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 6,
            padding: '10px 12px',
            fontSize: 12,
            color: 'var(--text-secondary)',
            lineHeight: 1.65,
            marginBottom: 12,
          }}>{conv.ai_summary}</div>
        </>
      )}
      <div className="insight-section-label">Conversation</div>
      <KVRow label="ID" value={conv.session_id} mono />
      <KVRow label="Agent" value="sky-49-web-call" />
      <KVRow label="Start Date" value={startDate} />
      <KVRow label="Duration" value={formatDuration(conv.call_duration_secs)} />
      <KVRow label="Channel" value="Voice" />
      <KVRow label="Language" value={conv.language === 'hi' ? 'Hindi (hi-IN)' : 'English (en-IN)'} />

      <div className="insight-section-label" style={{ marginTop: 16 }}>Lead Information</div>
      <KVRow label="lead_name" value={conv.lead_name} primary />
      <KVRow label="property_type" value={conv.property_type} />
      <KVRow label="city_preference" value={conv.city_preference} />
      <KVRow label="budget" value={conv.budget} />
      <KVRow label="budget_tier" value={conv.budget_tier} mono />
      <KVRow label="timeline" value={conv.timeline} />
      <KVRow label="outcome" value={conv.outcome} mono />
      <KVRow label="call_date" value={conv.call_date} mono />
      <KVRow label="call_duration_secs" value={String(conv.call_duration_secs ?? '—')} mono />
    </>
  )
}

function CallQualityTab({ conv }: { conv: Conversation }) {
  const tr = conv.talk_ratio
  return (
    <>
      <div className="insight-section-label">Talk Ratio</div>
      <div className="progress-bar-wrap">
        <div className="progress-bar-label">
          <span>🤖 Bot</span><span>{tr.bot_pct}%</span>
        </div>
        <div className="progress-bar-track">
          <div className="progress-bar-fill fill-blue" style={{ width: `${tr.bot_pct}%` }} />
        </div>
      </div>
      <div className="progress-bar-wrap">
        <div className="progress-bar-label">
          <span>👤 User</span><span>{tr.user_pct}%</span>
        </div>
        <div className="progress-bar-track">
          <div className="progress-bar-fill fill-green" style={{ width: `${tr.user_pct}%` }} />
        </div>
      </div>
      <KVRow label="Bot words"  value={String(tr.bot_words)} mono />
      <KVRow label="User words" value={String(tr.user_words)} mono />

      <div className="insight-section-label">Conversation Flow</div>
      <KVRow label="Total turns"      value={String(conv.stats.total_turns)} mono />
      <KVRow label="User turns"       value={String(conv.stats.user_turns)} mono />
      <KVRow label="Bot turns"        value={String(conv.stats.bot_turns)} mono />
      <KVRow label="Language switches" value={String(conv.stats.language_switches)} mono />

      <div className="insight-section-label" style={{ marginTop: 16 }}>Advanced Metrics <span className="coming-soon-badge">Coming Soon</span></div>
      <div className="coming-soon-block">
        <div className="cs-icon">🔇</div>
        <div className="cs-label">Silence %</div>
        <div>Will measure dead-air % in the audio recording</div>
      </div>
      <div className="coming-soon-block">
        <div className="cs-icon">⚡</div>
        <div className="cs-label">Response Latency</div>
        <div>Avg ms from user-stop to bot-start, per turn</div>
      </div>
    </>
  )
}

function LeadSignalsTab({ conv }: { conv: Conversation }) {
  const s = conv.intent_signals
  const q = conv.qualification

  return (
    <>
      <div className="insight-section-label">Qualification Checklist</div>
      {([
        { label: 'Name captured',          done: q.name_captured },
        { label: 'Budget captured',         done: q.budget_captured },
        { label: 'Location captured',       done: q.location_captured },
        { label: 'Property type captured',  done: q.property_type_captured },
        { label: 'Timeline captured',       done: q.timeline_captured },
      ] as { label: string; done: boolean }[]).map(item => (
        <div key={item.label} className="checklist-item">
          <div className={`check-icon ${item.done ? 'check-done' : 'check-miss'}`}>
            {item.done ? '✓' : '—'}
          </div>
          {item.label}
        </div>
      ))}
      <div style={{ marginTop: 8 }}>
        <div className="progress-bar-wrap">
          <div className="progress-bar-label">
            <span>Questions Answered</span>
            <span>{q.questions_completed}/{q.questions_total}</span>
          </div>
          <div className="progress-bar-track">
            <div className="progress-bar-fill fill-blue" style={{ width: `${(q.questions_completed / q.questions_total) * 100}%` }} />
          </div>
        </div>
      </div>

      <div className="insight-section-label">Intent Signals</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        <div className={`intent-pill ${s.ready_to_visit ? 'intent-true' : 'intent-false'}`}>
          {s.ready_to_visit ? '✓' : '○'} Ready to Visit
        </div>
        <div className={`intent-pill ${s.callback_agreed ? 'intent-true' : 'intent-false'}`}>
          {s.callback_agreed ? '✓' : '○'} Callback Agreed
        </div>
        <div className={`intent-pill ${s.agent_escalation_requested ? 'intent-warn' : 'intent-false'}`}>
          {s.agent_escalation_requested ? '⚠' : '○'} Agent Escalation
        </div>
        <div className={`intent-pill ${s.objection_detected ? 'intent-warn' : 'intent-false'}`}>
          {s.objection_detected ? `⚠ ${s.objection_count} Objection${s.objection_count > 1 ? 's' : ''}` : '○ No Objections'}
        </div>
      </div>

      <div className="insight-section-label" style={{ marginTop: 16 }}>
        Objection Detail <span className="coming-soon-badge">Coming Soon</span>
      </div>
      <div className="coming-soon-block">
        <div className="cs-icon">🛡️</div>
        <div className="cs-label">Objection Classification</div>
        <div>AI will classify and show which objections were handled vs. missed</div>
      </div>
    </>
  )
}

function BotPerformanceTab({ conv }: { conv: Conversation }) {
  const q = conv.qualification
  const adherence = Math.round((q.questions_completed / q.questions_total) * 100)

  return (
    <>
      <div className="insight-section-label">Script Adherence</div>
      <div className="progress-bar-wrap">
        <div className="progress-bar-label">
          <span>Questions completed</span><span>{adherence}%</span>
        </div>
        <div className="progress-bar-track">
          <div
            className={`progress-bar-fill ${adherence >= 80 ? 'fill-green' : adherence >= 60 ? 'fill-yellow' : 'fill-blue'}`}
            style={{ width: `${adherence}%` }}
          />
        </div>
      </div>

      <div className="insight-section-label">Lead Score Breakdown</div>
      <div className="progress-bar-wrap">
        <div className="progress-bar-label"><span>Lead Score</span><span>{conv.lead_score}/100</span></div>
        <div className="progress-bar-track">
          <div
            className={`progress-bar-fill ${conv.lead_score >= 70 ? 'fill-green' : conv.lead_score >= 40 ? 'fill-yellow' : 'fill-blue'}`}
            style={{ width: `${conv.lead_score}%` }}
          />
        </div>
      </div>

      <KVRow label="Outcome"   value={OUTCOME_LABELS[conv.outcome] || conv.outcome} />
      <KVRow label="Duration"  value={formatDuration(conv.call_duration_secs)} mono />
      <KVRow label="Bot turns" value={String(conv.stats.bot_turns)} mono />

      <div className="insight-section-label" style={{ marginTop: 16 }}>
        Advanced Analysis <span className="coming-soon-badge">Coming Soon</span>
      </div>
      <div className="coming-soon-block">
        <div className="cs-icon">📈</div>
        <div className="cs-label">Sentiment Arc</div>
        <div>Start → Mid → End sentiment tracked via AI analysis</div>
      </div>
      <div className="coming-soon-block">
        <div className="cs-icon">🎯</div>
        <div className="cs-label">Recovery Rate</div>
        <div>How well the bot handled objections and recovered the conversation</div>
      </div>
    </>
  )
}

function AIInsightsTab() {
  return (
    <>
      <div className="insight-section-label">AI-Powered Insights <span className="coming-soon-badge">Coming Soon</span></div>

      {[
        { icon: '📝', label: 'Call Summary', desc: 'Gemini Flash Lite will auto-generate a 3-sentence summary of every call' },
        { icon: '😊', label: 'Sentiment Arc', desc: 'Positive / Neutral / Negative tracked across Start → Middle → End of call' },
        { icon: '🛡️', label: 'Objection Classification', desc: 'AI classifies each objection phrase and checks if the bot handled it' },
        { icon: '🎯', label: 'Decision Stage', desc: 'Just Browsing / Actively Looking / Ready to Buy — classified per call' },
        { icon: '📞', label: 'Follow-up Priority', desc: 'Composite AI score ranking which leads to follow up first' },
      ].map(item => (
        <div key={item.label} className="coming-soon-block">
          <div className="cs-icon">{item.icon}</div>
          <div className="cs-label">{item.label}</div>
          <div>{item.desc}</div>
        </div>
      ))}
    </>
  )
}

// ── List Item ─────────────────────────────────────────────────────────────────

function ConvListItem({ conv, active, onClick }: {
  conv: Conversation
  active: boolean
  onClick: () => void
}) {
  return (
    <div className={`conv-list-item ${active ? 'active' : ''}`} onClick={onClick}>
      <div className="conv-item-top">
        <div className={`outcome-badge outcome-${conv.outcome}`}>
          {OUTCOME_LABELS[conv.outcome] || conv.outcome}
        </div>
        <div className="conv-item-name">{conv.lead_name || 'Unknown Caller'}</div>
        <div className="conv-item-time">{formatRelativeTime(conv.call_start_iso)}</div>
      </div>
      <div className="conv-item-meta">
        {conv.city_preference && <span className="conv-meta-chip">🏙️ {conv.city_preference}</span>}
        {conv.city_preference && conv.property_type && <span className="conv-meta-sep">·</span>}
        {conv.property_type && <span className="conv-meta-chip">🏠 {conv.property_type}</span>}
        <span className="conv-meta-sep">·</span>
        <span className="conv-meta-chip">⏱️ {formatDuration(conv.call_duration_secs)}</span>
        <span className="conv-meta-sep">·</span>
        <span className="conv-meta-chip">{conv.language === 'hi' ? '🇮🇳 Hindi' : '🇬🇧 English'}</span>
      </div>
    </div>
  )
}

// ── Conversation Detail ───────────────────────────────────────────────────────

function ConversationDetail({ sessionId }: { sessionId: string }) {
  const [conv, setConv] = useState<Conversation | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [seekTo, setSeekTo] = useState(0)
  const [activeTurn, setActiveTurn] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false

    // Check sessionStorage cache first
    const cacheKey = `${DETAIL_CACHE_PREFIX}${sessionId}`
    const cached = sessionStorage.getItem(cacheKey)
    if (cached) {
      try {
        const parsed = JSON.parse(cached)
        setConv(parsed)
        setLoading(false)
        return
      } catch {/* ignore parse errors */}
    }

    setLoading(true)
    setError(null)
    setConv(null)

    fetch(`${API_BASE}/api/conversations/${sessionId}`, { headers: apiHeaders() })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then(data => {
        if (!cancelled) {
          setConv(data)
          // Cache in sessionStorage for instant repeat loads
          try { sessionStorage.setItem(cacheKey, JSON.stringify(data)) } catch {/* quota exceeded */}
        }
      })
      .catch(e => {
        if (!cancelled) setError(e.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [sessionId])

  const handleTurnClick = useCallback((turn: TranscriptTurn) => {
    setSeekTo(turn.timestamp_secs)
    setActiveTurn(turn.index)
  }, [])

  if (loading) return <div className="conv-loading"><div className="conv-spinner" />Loading conversation…</div>
  if (error)   return <div className="conv-empty"><div className="conv-empty-icon">⚠️</div><div className="conv-empty-title">Error loading</div><div className="conv-empty-sub">{error}</div></div>
  if (!conv)   return null

  const startDate = conv.call_start_iso ? new Date(conv.call_start_iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—'

  return (
    <div className="conv-detail-panel">
      {/* Header */}
      <div className="conv-detail-header">
        <div className="conv-detail-title">
          <div className="conv-detail-name">
            {conv.lead_name || 'Unknown Caller'}
            <div className={`outcome-badge outcome-${conv.outcome}`}>{OUTCOME_LABELS[conv.outcome] || conv.outcome}</div>
            <LeadScoreRing score={conv.lead_score} />
          </div>
          <div className="conv-detail-subtitle">
            <div className="conv-detail-meta-item">📅 {startDate}</div>
            <div className="conv-detail-meta-item">⏱️ {formatDuration(conv.call_duration_secs)}</div>
            {conv.city_preference && <div className="conv-detail-meta-item">🏙️ {conv.city_preference}</div>}
            {conv.property_type   && <div className="conv-detail-meta-item">🏠 {conv.property_type}</div>}
            <div className="conv-detail-meta-item">{conv.language === 'hi' ? '🇮🇳 Hindi' : '🇬🇧 English'}</div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="conv-detail-body">
        {/* Left: audio + transcript */}
        <div className="conv-transcript-col">
          {/* Audio player */}
          {conv.has_audio && (
            <AudioPlayer
              sessionId={conv.session_id}
              onSeek={(s) => setActiveTurn(null)}
              currentTimeSecs={seekTo}
            />
          )}

          {/* Transcript */}
          {conv.transcript && conv.transcript.length > 0 ? (
            <TranscriptView
              transcript={conv.transcript}
              activeTurn={activeTurn}
              onTurnClick={handleTurnClick}
            />
          ) : (
            <div className="conv-loading" style={{ flex: 1 }}>
              {conv.has_transcript ? <><div className="conv-spinner" />Loading transcript…</> : 'No transcript available'}
            </div>
          )}
        </div>

        {/* Right: info tabs */}
        <InfoPanel conv={conv} />
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [outcomeFilter, setOutcomeFilter] = useState('')
  const [langFilter, setLangFilter] = useState('')

  // Load list — sessionStorage cache for instant reload within same tab session
  useEffect(() => {
    setLoading(true)
    const cacheKey = `${LIST_CACHE_KEY}_${outcomeFilter}_${langFilter}`
    const cached = sessionStorage.getItem(cacheKey)
    if (cached) {
      try {
        setConversations(JSON.parse(cached))
        setLoading(false)
        return
      } catch {/* ignore */}
    }

    const params = new URLSearchParams()
    if (outcomeFilter) params.set('outcome', outcomeFilter)
    if (langFilter)    params.set('language', langFilter)
    params.set('page_size', '50')

    fetch(`${API_BASE}/api/conversations?${params}`, { headers: apiHeaders() })
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(data => {
        const convs = data.conversations || []
        setConversations(convs)
        try { sessionStorage.setItem(cacheKey, JSON.stringify(convs)) } catch {/* quota */}
      })
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false))
  }, [outcomeFilter, langFilter])

  // Filter by search
  const filtered = conversations.filter(c => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      c.lead_name?.toLowerCase().includes(q) ||
      c.city_preference?.toLowerCase().includes(q) ||
      c.property_type?.toLowerCase().includes(q) ||
      c.session_id?.toLowerCase().includes(q)
    )
  })

  // Summary stats
  const total   = conversations.length
  const leads   = conversations.filter(c => c.outcome === 'lead_captured').length
  const partial = conversations.filter(c => c.outcome === 'partial_lead').length
  const hungUp  = conversations.filter(c => c.outcome === 'hung_up_early').length

  // CSV Export — pure client-side, zero API calls
  const handleExportCSV = () => {
    const headers = ['Session ID','Date','Lead Name','City','Property Type','Budget','Budget Tier','Timeline','Language','Outcome','Lead Score','Duration (s)']
    const rows = conversations.map(c => [
      c.session_id,
      c.call_date,
      c.lead_name || '',
      c.city_preference || '',
      c.property_type || '',
      c.budget || '',
      c.budget_tier || '',
      c.timeline || '',
      c.language,
      c.outcome,
      c.lead_score,
      c.call_duration_secs ?? '',
    ])
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `wakilz-leads-${new Date().toISOString().slice(0,10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="conv-root">
      {/* Top bar */}
      <div className="conv-topbar">
        <a className="conv-topbar-logo" href="/">
          <img
            src={`${import.meta.env.BASE_URL}assets/images/logo.png?v=2`}
            alt="wakilz logo"
            className="h-6 w-auto object-contain"
          />
          wakilz
        </a>
        <div className="conv-topbar-sep" />
        <div className="conv-topbar-title">Conversations</div>
        <div className="conv-topbar-spacer" />
        <div className="conv-topbar-stats">
          <div className="conv-stat-chip"><div className="dot dot-blue" />{total} Total</div>
          <div className="conv-stat-chip"><div className="dot dot-green" />{leads} Leads</div>
          <div className="conv-stat-chip"><div className="dot dot-yellow" />{partial} Partial</div>
          <div className="conv-stat-chip"><div className="dot dot-red" />{hungUp} Hung Up</div>
          <button
            className="csv-export-btn"
            onClick={handleExportCSV}
            title="Export all leads to CSV"
            disabled={conversations.length === 0}
          >
            ↓ Export CSV
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="conv-main">
        {/* Left — list */}
        <div className="conv-list-panel">
          <div className="conv-filter-bar">
            <div className="conv-search">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="6" cy="6" r="4.5" stroke="var(--text-muted)" strokeWidth="1.5"/>
                <path d="M9.5 9.5L12 12" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <input
                placeholder="Search by name, city, property…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="conv-filter-row">
              <select
                className="conv-filter-select"
                value={outcomeFilter}
                onChange={e => setOutcomeFilter(e.target.value)}
              >
                <option value="">All Outcomes</option>
                <option value="lead_captured">Lead Captured</option>
                <option value="partial_lead">Partial Lead</option>
                <option value="no_lead">No Lead</option>
                <option value="hung_up_early">Hung Up Early</option>
              </select>
              <select
                className="conv-filter-select"
                value={langFilter}
                onChange={e => setLangFilter(e.target.value)}
              >
                <option value="">All Languages</option>
                <option value="en">English</option>
                <option value="hi">Hindi</option>
              </select>
            </div>
          </div>

          <div className="conv-list">
            {loading && <div className="conv-loading"><div className="conv-spinner" />Loading calls…</div>}
            {error   && <div className="conv-empty"><div className="conv-empty-icon">⚠️</div><div className="conv-empty-title">Could not load conversations</div><div className="conv-empty-sub">{error}</div></div>}
            {!loading && !error && filtered.length === 0 && (
              <div className="conv-empty">
                <img
                  src={`${import.meta.env.BASE_URL}assets/images/logo.png?v=2`}
                  alt="wakilz logo"
                  className="h-10 w-auto object-contain opacity-50 mb-1"
                />
                <div className="conv-empty-title">No conversations found</div>
                <div className="conv-empty-sub">Make a call to see it appear here</div>
              </div>
            )}
            {filtered.map(c => (
              <ConvListItem
                key={c.session_id}
                conv={c}
                active={selectedId === c.session_id}
                onClick={() => setSelectedId(c.session_id)}
              />
            ))}
          </div>
        </div>

        {/* Right — detail */}
        {selectedId ? (
          <ConversationDetail key={selectedId} sessionId={selectedId} />
        ) : (
          <div className="conv-empty" style={{ flex: 1 }}>
            <img
              src={`${import.meta.env.BASE_URL}assets/images/logo.png?v=2`}
              alt="wakilz logo"
              className="h-12 w-auto object-contain opacity-60 mb-2"
            />
            <div className="conv-empty-title">Select a conversation</div>
            <div className="conv-empty-sub">Click any call on the left to view its transcript, audio, and insights</div>
          </div>
        )}
      </div>
    </div>
  )
}
