/**
 * LeadDetailsDrawer.tsx
 *
 * Animated slide-over drawer that displays detailed lead & call intelligence
 * when a user clicks on any KPI Stat Card (Qualified Leads, Site Visits Booked,
 * Conversations Held, Calls Dialed) or a row in the leads table.
 *
 * Features:
 * - Call ID with 1-click clipboard copy
 * - Complete AI transcript extraction (Intent, Budget, Location, Property Type, Timeline, Visit Slot)
 * - Full AI Call Summary
 * - Inline audio recording player (fetches signed recording URL from Rasen API)
 * - Filter & search within the open drawer
 * - Smooth luxury dark glassmorphism animations
 */

import React, { useState, useEffect } from 'react'
import {
  X, Copy, Check, Phone, User, Calendar, MapPin, DollarSign,
  Clock, Shield, Activity, Volume2, Play, Pause, Search,
  ExternalLink, Sparkles, CheckCircle2, AlertCircle, Building,
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
        transition: 'visibility 0.3s ease',
        visibility: isOpen ? 'visible' : 'hidden',
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(5, 10, 20, 0.7)',
          backdropFilter: 'blur(8px)',
          opacity: isOpen ? 1 : 0,
          transition: 'opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      />

      {/* Slide-over Panel */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          maxWidth: '680px',
          background: T.surface,
          borderLeft: `1px solid ${T.borderStrong}`,
          boxShadow: '-16px 0 48px rgba(0, 0, 0, 0.6)',
          display: 'flex',
          flexDirection: 'column',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
          zIndex: 101,
        }}
      >
        {/* Drawer Header */}
        <div
          style={{
            padding: '24px 28px',
            borderBottom: `1px solid ${T.border}`,
            background: T.deepNavy,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 16,
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <Sparkles size={14} color={T.brass} />
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  color: T.brass,
                  letterSpacing: 1.2,
                  textTransform: 'uppercase',
                  fontWeight: 600,
                }}
              >
                Lead Intelligence Inspector
              </span>
            </div>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 22,
                color: T.textPrimary,
                fontWeight: 700,
                letterSpacing: '-0.02em',
                margin: 0,
              }}
            >
              {title}
            </h2>
            {subtitle && (
              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 13,
                  color: T.textSecondary,
                  margin: '4px 0 0',
                }}
              >
                {subtitle}
              </p>
            )}
          </div>

          <button
            onClick={onClose}
            style={{
              background: T.surfaceLight,
              border: `1px solid ${T.border}`,
              color: T.textSecondary,
              width: 36,
              height: 36,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s',
              flexShrink: 0,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = T.textPrimary
              e.currentTarget.style.borderColor = T.borderStrong
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = T.textSecondary
              e.currentTarget.style.borderColor = T.border
            }}
            aria-label="Close drawer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search Bar & Count */}
        <div
          style={{
            padding: '16px 28px',
            borderBottom: `1px solid ${T.border}`,
            background: T.surfaceLight,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          <div
            style={{
              position: 'relative',
              flex: 1,
              minWidth: 220,
            }}
          >
            <Search
              size={15}
              color={T.textMuted}
              style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              type="text"
              placeholder="Search by name, phone, location, intent, or Call ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%',
                background: T.deepNavy,
                border: `1px solid ${T.borderStrong}`,
                borderRadius: 10,
                padding: '8px 12px 8px 36px',
                fontSize: 12.5,
                color: T.textPrimary,
                fontFamily: 'var(--font-body)',
                outline: 'none',
              }}
            />
          </div>

          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, color: T.textMuted }}>
            Showing {filteredLeads.length} of {leads.length} calls
          </span>
        </div>

        {/* Leads Cards List */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px 28px',
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
          }}
        >
          {filteredLeads.length === 0 ? (
            <div
              style={{
                padding: '60px 20px',
                textAlign: 'center',
                color: T.textMuted,
                fontFamily: 'var(--font-body)',
              }}
            >
              <AlertCircle size={32} color={T.slate} style={{ margin: '0 auto 12px' }} />
              <div style={{ fontSize: 15, fontWeight: 600, color: T.textSecondary }}>No calls match this filter</div>
              <div style={{ fontSize: 12.5, marginTop: 4 }}>Try adjusting your search terms or date range.</div>
            </div>
          ) : (
            filteredLeads.map((lead, idx) => {
              const isSelected = selectedLeadId === lead.id
              const isPlaying = playingAudioId === lead.callId
              const audioSrc = audioUrls[lead.callId]
              const isExpanded = expandedSummaryId === lead.callId

              return (
                <div
                  key={lead.id || idx}
                  style={{
                    background: isSelected ? T.surfaceElevated : T.surfaceLight,
                    border: `1px solid ${isSelected ? T.brass : T.borderStrong}`,
                    borderRadius: 16,
                    padding: '20px',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {/* Top Row: Call ID & Status */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 14,
                      flexWrap: 'wrap',
                      gap: 8,
                    }}
                  >
                    {/* Call ID badge with Copy */}
                    <div
                      onClick={e => copyCallId(lead.callId, e)}
                      title="Click to copy Call ID"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        background: T.deepNavy,
                        border: `1px solid ${T.borderStrong}`,
                        borderRadius: 8,
                        padding: '4px 10px',
                        cursor: 'pointer',
                        transition: 'border-color 0.2s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = T.brass)}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = T.borderStrong)}
                    >
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: T.textMuted }}>ID:</span>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 11.5,
                          color: T.textSecondary,
                          maxWidth: 160,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {lead.callId}
                      </span>
                      {copiedId === lead.callId ? (
                        <Check size={12} color={T.green} />
                      ) : (
                        <Copy size={12} color={T.textMuted} />
                      )}
                    </div>

                    {/* Booking Status & Outcome Badges */}
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 10.5,
                          fontWeight: 600,
                          padding: '3px 9px',
                          borderRadius: 12,
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

                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 10.5,
                          padding: '3px 8px',
                          borderRadius: 12,
                          background: T.deepNavy,
                          color: T.textSecondary,
                          border: `1px solid ${T.border}`,
                          textTransform: 'capitalize',
                        }}
                      >
                        {lead.outcome}
                      </span>
                    </div>
                  </div>

                  {/* Buyer Name & Phone */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
                    <div>
                      <h3 style={{ fontSize: 17, fontWeight: 700, color: T.textPrimary, margin: 0 }}>
                        {lead.name}
                      </h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                        <Phone size={12} color={T.brass} />
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, color: T.textSecondary }}>
                          {lead.phone}
                        </span>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: 11.5, color: T.textMuted }}>{lead.time}</span>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: T.textMuted }}>{lead.ts}</div>
                    </div>
                  </div>

                  {/* Extraction Metrics Grid */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                      gap: 10,
                      background: T.deepNavy,
                      borderRadius: 12,
                      padding: '12px 14px',
                      marginBottom: 14,
                      border: `1px solid ${T.border}`,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 10.5, fontFamily: 'var(--font-mono)', color: T.textMuted, textTransform: 'uppercase' }}>
                        Intent
                      </div>
                      <div style={{ fontSize: 12, color: T.textPrimary, fontWeight: 600, marginTop: 2, textTransform: 'capitalize' }}>
                        {lead.intent}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: 10.5, fontFamily: 'var(--font-mono)', color: T.textMuted, textTransform: 'uppercase' }}>
                        Budget Range
                      </div>
                      <div style={{ fontSize: 12, color: T.brass, fontWeight: 600, marginTop: 2 }}>
                        {lead.budget}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: 10.5, fontFamily: 'var(--font-mono)', color: T.textMuted, textTransform: 'uppercase' }}>
                        Location
                      </div>
                      <div style={{ fontSize: 12, color: T.textPrimary, fontWeight: 500, marginTop: 2 }}>
                        {lead.location}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: 10.5, fontFamily: 'var(--font-mono)', color: T.textMuted, textTransform: 'uppercase' }}>
                        Site Visit Slot
                      </div>
                      <div style={{ fontSize: 12, color: lead.siteVisitSlot !== '—' ? T.green : T.textSecondary, fontWeight: 600, marginTop: 2 }}>
                        {lead.siteVisitSlot}
                      </div>
                    </div>
                  </div>

                  {/* AI Conversation Summary */}
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <Activity size={12} color={T.brass} />
                      <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: T.textSecondary, textTransform: 'uppercase', fontWeight: 600 }}>
                        AI Call Summary
                      </span>
                    </div>
                    <p
                      style={{
                        fontSize: 12.5,
                        color: T.textSecondary,
                        lineHeight: 1.55,
                        margin: 0,
                        background: 'rgba(0,0,0,0.2)',
                        padding: '10px 12px',
                        borderRadius: 10,
                        border: `1px solid ${T.border}`,
                      }}
                    >
                      {isExpanded ? lead.summary : lead.summary.length > 180 ? `${lead.summary.slice(0, 180)}...` : lead.summary}
                      {lead.summary.length > 180 && (
                        <button
                          onClick={() => setExpandedSummaryId(isExpanded ? null : lead.callId)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: T.accentGlow,
                            fontSize: 11.5,
                            fontWeight: 600,
                            cursor: 'pointer',
                            marginLeft: 6,
                            padding: 0,
                          }}
                        >
                          {isExpanded ? 'Show less' : 'Read full summary'}
                        </button>
                      )}
                    </p>
                  </div>

                  {/* Bottom Strip: Duration, Sentiment & Audio Player */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderTop: `1px solid ${T.border}`,
                      paddingTop: 12,
                      flexWrap: 'wrap',
                      gap: 10,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: T.textMuted, fontFamily: 'var(--font-mono)' }}>
                        <Clock size={12} /> {Math.floor(lead.durationSecs / 60)}m {lead.durationSecs % 60}s
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11.5, color: T.textMuted, fontFamily: 'var(--font-mono)' }}>
                        Sentiment: <span style={{ color: lead.sentiment === 'positive' ? T.green : lead.sentiment === 'negative' ? T.red : T.textSecondary, textTransform: 'capitalize' }}>{lead.sentiment}</span>
                      </span>
                    </div>

                    {/* Audio Recording Button */}
                    <button
                      onClick={e => toggleAudio(lead.callId, e)}
                      disabled={loadingAudioId === lead.callId}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        background: isPlaying ? T.greenSoft : T.surface,
                        border: `1px solid ${isPlaying ? T.green : T.borderStrong}`,
                        color: isPlaying ? T.green : T.textSecondary,
                        borderRadius: 20,
                        padding: '5px 12px',
                        fontSize: 11.5,
                        fontFamily: 'var(--font-mono)',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      {loadingAudioId === lead.callId ? (
                        <span>Loading audio...</span>
                      ) : isPlaying ? (
                        <>
                          <Pause size={12} /> Playing Audio
                        </>
                      ) : (
                        <>
                          <Volume2 size={12} color={T.brass} /> Listen to Call
                        </>
                      )}
                    </button>
                  </div>

                  {/* Inline Audio Player if active */}
                  {isPlaying && audioSrc && (
                    <div style={{ marginTop: 12, background: T.deepNavy, borderRadius: 10, padding: '8px 12px', border: `1px solid ${T.green}` }}>
                      <audio
                        src={audioSrc}
                        controls
                        autoPlay
                        onEnded={() => setPlayingAudioId(null)}
                        style={{ width: '100%', height: 32 }}
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
