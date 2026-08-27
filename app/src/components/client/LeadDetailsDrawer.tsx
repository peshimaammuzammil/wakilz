/**
 * LeadDetailsDrawer.tsx
 *
 * Mobile-First High-Density Lead Intelligence Inspector.
 * - Responsive Slide-Over Drawer on desktop / Bottom Sheet on mobile
 * - Compact 48px header with live counter and search
 * - Category filter pills (All, Qualified, Site Visits, Dropped)
 * - High-density lead cards:
 *    - Smart non-empty tags only (no empty dash boxes!)
 *    - Inline 1-tap audio playback button
 *    - Sentiment indicators
 *    - Expandable AI Call Summaries & Transcripts
 */

import React, { useState, useEffect } from 'react'
import {
  X, Copy, Check, Phone,
  Clock, Activity, Volume2, Play, Pause, Search,
  Sparkles, AlertCircle, MapPin, DollarSign, Calendar
} from 'lucide-react'
import type { LeadRow } from '@/hooks/useClientDashboard'
import { fetchCallRecordingUrl } from '@/lib/clientApi'

const T = {
  deepNavy: '#0C1524',
  surface: '#162032',
  surfaceLight: '#1D2A3D',
  surfaceElevated: '#223048',
  border: 'rgba(243, 240, 234, 0.10)',
  borderStrong: 'rgba(243, 240, 234, 0.18)',
  textPrimary: '#F3F0EA',
  textSecondary: '#9BA3AF',
  textMuted: '#627088',
  accent: '#2A3FE0',
  accentGlow: '#5A6CFF',
  brass: '#E5C07B',
  brassDark: '#B8863B',
  brassSoft: 'rgba(229, 192, 123, 0.12)',
  green: '#4FBE87',
  greenSoft: 'rgba(79, 190, 135, 0.12)',
  red: '#F87171',
  redSoft: 'rgba(248, 113, 113, 0.12)',
  slate: '#8B94A5',
}

export interface LeadDetailsDrawerProps {
  isOpen: boolean
  onClose: () => void
  title: string
  subtitle?: string
  leads: LeadRow[]
  selectedLeadId?: string | null
}

export default function LeadDetailsDrawer({
  isOpen,
  onClose,
  title,
  subtitle,
  leads,
  selectedLeadId,
}: LeadDetailsDrawerProps) {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'qualified' | 'visits' | 'dropped'>('all')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null)
  const [audioUrls, setAudioUrls] = useState<Record<string, string>>({})
  const [loadingAudioId, setLoadingAudioId] = useState<string | null>(null)
  const [expandedSummaryId, setExpandedSummaryId] = useState<string | null>(null)

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Prevent background scrolling when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const copyCallId = (callId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(callId)
    setCopiedId(callId)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const toggleAudio = async (callId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (playingAudioId === callId) {
      setPlayingAudioId(null)
      return
    }

    if (audioUrls[callId]) {
      setPlayingAudioId(callId)
      return
    }

    setLoadingAudioId(callId)
    const url = await fetchCallRecordingUrl(callId)
    setLoadingAudioId(null)
    if (url) {
      setAudioUrls(prev => ({ ...prev, [callId]: url }))
      setPlayingAudioId(callId)
    } else {
      alert('Audio recording is not available for this call session.')
    }
  }

  const filteredLeads = leads.filter(lead => {
    // Category filter
    if (categoryFilter === 'qualified' && (lead.intent === '—' || lead.budget === '—')) return false
    if (categoryFilter === 'visits' && (lead.status !== 'Site visit set' && lead.status !== 'Booked' && lead.siteVisitSlot === '—')) return false
    if (categoryFilter === 'dropped' && lead.status !== 'Dropped' && lead.outcome !== 'hung_up_early') return false

    // Search query
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      lead.name.toLowerCase().includes(q) ||
      lead.phone.toLowerCase().includes(q) ||
      lead.intent.toLowerCase().includes(q) ||
      lead.location.toLowerCase().includes(q) ||
      lead.callId.toLowerCase().includes(q) ||
      lead.summary.toLowerCase().includes(q)
    )
  })

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        pointerEvents: isOpen ? 'auto' : 'none',
        transition: 'visibility 0.25s ease',
        visibility: isOpen ? 'visible' : 'hidden',
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(5, 10, 20, 0.75)',
          backdropFilter: 'blur(8px)',
          opacity: isOpen ? 1 : 0,
          transition: 'opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      />

      {/* Slide-over / Sheet Panel */}
      <div
        className="inspector-panel"
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          maxWidth: '640px',
          background: T.surface,
          borderLeft: `1px solid ${T.borderStrong}`,
          boxShadow: '-16px 0 48px rgba(0, 0, 0, 0.6)',
          display: 'flex',
          flexDirection: 'column',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          zIndex: 101,
        }}
      >
        {/* 1. Compact Header (48px) */}
        <div
          style={{
            padding: '12px 16px',
            borderBottom: `1px solid ${T.border}`,
            background: T.deepNavy,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
              <Sparkles size={13} color={T.brass} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: T.brass, letterSpacing: 1.1, textTransform: 'uppercase', fontWeight: 600 }}>
                Lead Intelligence
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(16px, 1.8vw, 18px)', color: T.textPrimary, fontWeight: 700, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {title}
              </h2>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: T.textMuted, background: T.surfaceLight, padding: '2px 6px', borderRadius: 6 }}>
                ({filteredLeads.length})
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: T.surfaceLight,
              border: `1px solid ${T.border}`,
              color: T.textSecondary,
              width: 32,
              height: 32,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
              transition: 'all 0.15s',
            }}
            aria-label="Close drawer"
          >
            <X size={16} />
          </button>
        </div>

        {/* 2. Integrated Search Bar & Category Filters */}
        <div
          style={{
            padding: '10px 16px',
            borderBottom: `1px solid ${T.border}`,
            background: T.surfaceLight,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          {/* Search Input */}
          <div style={{ position: 'relative' }}>
            <Search
              size={14}
              color={T.textMuted}
              style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              type="text"
              placeholder="Search name, phone, intent, or Call ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%',
                background: T.deepNavy,
                border: `1px solid ${T.borderStrong}`,
                borderRadius: 8,
                padding: '7px 10px 7px 32px',
                fontSize: 12,
                color: T.textPrimary,
                fontFamily: 'var(--font-body)',
                outline: 'none',
              }}
            />
          </div>

          {/* Quick Category Filter Pills */}
          <div className="no-scrollbar" style={{ display: 'flex', alignItems: 'center', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
            {([
              { key: 'all', label: 'All Calls' },
              { key: 'qualified', label: '🎯 Qualified' },
              { key: 'visits', label: '📅 Site Visits' },
              { key: 'dropped', label: '🔴 Dropped' },
            ] as const).map(f => (
              <button
                key={f.key}
                onClick={() => setCategoryFilter(f.key)}
                style={{
                  background: categoryFilter === f.key ? T.brassSoft : T.surface,
                  color: categoryFilter === f.key ? T.brass : T.textSecondary,
                  border: `1px solid ${categoryFilter === f.key ? T.brass : T.border}`,
                  borderRadius: 6,
                  padding: '4px 10px',
                  fontSize: 11,
                  fontWeight: categoryFilter === f.key ? 700 : 500,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  transition: 'all 0.15s',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* 3. High-Density Leads List */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '12px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          {filteredLeads.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: T.textMuted }}>
              <AlertCircle size={28} color={T.slate} style={{ margin: '0 auto 8px' }} />
              <div style={{ fontSize: 14, fontWeight: 600, color: T.textSecondary }}>No calls match this filter</div>
              <div style={{ fontSize: 12, marginTop: 2 }}>Try adjusting your search terms or active pill filter.</div>
            </div>
          ) : (
            filteredLeads.map((lead, idx) => {
              const isSelected = selectedLeadId === lead.id
              const isPlaying = playingAudioId === lead.callId
              const audioSrc = audioUrls[lead.callId]
              const isExpanded = expandedSummaryId === lead.callId

              // Only show non-empty parameter tags
              const hasIntent = lead.intent && lead.intent !== '—' && lead.intent !== 'Unknown'
              const hasBudget = lead.budget && lead.budget !== '—' && lead.budget !== 'Unknown'
              const hasLocation = lead.location && lead.location !== '—' && lead.location !== 'Unknown'
              const hasSiteVisit = lead.siteVisitSlot && lead.siteVisitSlot !== '—'

              return (
                <div
                  key={lead.id || idx}
                  style={{
                    background: isSelected ? T.surfaceElevated : T.surfaceLight,
                    border: `1px solid ${isSelected ? T.brass : T.borderStrong}`,
                    borderRadius: 14,
                    padding: '12px 14px',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}
                >
                  {/* Row 1: Name, Relative Time, Status Badge */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: T.textPrimary }}>
                          {lead.name}
                        </span>
                        {lead.status === 'Booked' && <span style={{ color: T.green, fontSize: 10 }}>●</span>}
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: T.textMuted, marginTop: 1 }}>
                        {lead.phone} {lead.time ? `· ${lead.time}` : ''}
                      </div>
                    </div>

                    {/* Status badge */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 10,
                          fontWeight: 600,
                          padding: '3px 8px',
                          borderRadius: 8,
                          background:
                            lead.status === 'Booked'
                              ? T.greenSoft
                              : lead.status === 'Site visit set'
                              ? T.brassSoft
                              : lead.status === 'Dropped'
                              ? T.redSoft
                              : 'rgba(90, 108, 255, 0.12)',
                          color:
                            lead.status === 'Booked'
                              ? T.green
                              : lead.status === 'Site visit set'
                              ? T.brass
                              : lead.status === 'Dropped'
                              ? T.red
                              : T.accentGlow,
                        }}
                      >
                        {lead.status}
                      </span>
                    </div>
                  </div>

                  {/* Row 2: Smart Non-Empty Parameter Chips (No empty dash grids!) */}
                  {(hasIntent || hasBudget || hasLocation || hasSiteVisit) && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {hasLocation && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: T.deepNavy, border: `1px solid ${T.border}`, borderRadius: 6, padding: '2px 8px', fontSize: 11, color: T.textSecondary }}>
                          <span>📍</span> <strong style={{ color: T.textPrimary }}>{lead.location}</strong>
                        </span>
                      )}
                      {hasBudget && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: T.deepNavy, border: `1px solid ${T.border}`, borderRadius: 6, padding: '2px 8px', fontSize: 11, color: T.textSecondary }}>
                          <span>💰</span> <strong style={{ color: T.brass, fontFamily: 'var(--font-mono)' }}>{lead.budget}</strong>
                        </span>
                      )}
                      {hasSiteVisit && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: T.deepNavy, border: `1px solid ${T.border}`, borderRadius: 6, padding: '2px 8px', fontSize: 11, color: T.green }}>
                          <span>📅</span> <strong style={{ color: T.green }}>{lead.siteVisitSlot}</strong>
                        </span>
                      )}
                      {hasIntent && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: T.deepNavy, border: `1px solid ${T.border}`, borderRadius: 6, padding: '2px 8px', fontSize: 11, color: T.textSecondary, textTransform: 'capitalize' }}>
                          <span>🏷️</span> {lead.intent}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Row 3: AI Call Summary (Clean expandable quote) */}
                  {lead.summary && (
                    <div style={{
                      fontSize: 11.5,
                      color: T.textSecondary,
                      background: 'rgba(12,21,36,0.6)',
                      borderLeft: `2px solid ${T.brass}`,
                      padding: '6px 10px',
                      borderRadius: 4,
                      lineHeight: 1.45,
                    }}>
                      {isExpanded ? lead.summary : lead.summary.length > 140 ? `${lead.summary.slice(0, 140)}...` : lead.summary}
                      {lead.summary.length > 140 && (
                        <button
                          onClick={() => setExpandedSummaryId(isExpanded ? null : lead.callId)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: T.brass,
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: 'pointer',
                            marginLeft: 4,
                            padding: 0,
                          }}
                        >
                          {isExpanded ? 'Less' : 'Read full'}
                        </button>
                      )}
                    </div>
                  )}

                  {/* Row 4: Inline Audio Play Pill, Sentiment & Call ID */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: T.deepNavy,
                    border: `1px solid ${T.border}`,
                    borderRadius: 8,
                    padding: '6px 10px',
                    flexWrap: 'wrap',
                    gap: 8,
                  }}>
                    {/* 1-Tap Audio Play Pill */}
                    <button
                      onClick={e => toggleAudio(lead.callId, e)}
                      disabled={loadingAudioId === lead.callId}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        background: isPlaying ? T.green : T.greenSoft,
                        color: isPlaying ? '#0C1524' : T.green,
                        border: `1px solid rgba(79,190,135,0.4)`,
                        borderRadius: 12,
                        padding: '3px 9px',
                        fontFamily: 'var(--font-mono)',
                        fontSize: 10.5,
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      {loadingAudioId === lead.callId ? (
                        <span>Loading...</span>
                      ) : isPlaying ? (
                        <>
                          <Pause size={11} /> 0m {lead.durationSecs % 60}s Pause
                        </>
                      ) : (
                        <>
                          <Play size={11} fill="currentColor" /> {Math.floor(lead.durationSecs / 60)}m {lead.durationSecs % 60}s Play
                        </>
                      )}
                    </button>

                    {/* Sentiment */}
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: T.textSecondary, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: lead.sentiment === 'positive' ? T.green : lead.sentiment === 'negative' ? T.red : T.textMuted }} />
                      <span style={{ textTransform: 'capitalize' }}>{lead.sentiment}</span>
                    </span>

                    {/* Copy ID */}
                    <div
                      onClick={e => copyCallId(lead.callId, e)}
                      title="Click to copy Call ID"
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 10.5,
                        color: copiedId === lead.callId ? T.green : T.textMuted,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 3,
                        cursor: 'pointer',
                      }}
                    >
                      <span>#{lead.callId.slice(0, 6)}</span>
                      {copiedId === lead.callId ? <Check size={11} /> : <Copy size={11} />}
                    </div>
                  </div>

                  {/* Inline Active Audio Stream */}
                  {isPlaying && audioSrc && (
                    <div style={{ background: T.deepNavy, borderRadius: 8, padding: '6px 8px', border: `1px solid ${T.green}` }}>
                      <audio
                        src={audioSrc}
                        controls
                        autoPlay
                        onEnded={() => setPlayingAudioId(null)}
                        style={{ width: '100%', height: 28 }}
                      />
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
