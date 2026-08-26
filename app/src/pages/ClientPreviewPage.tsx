/**
 * ClientPreviewPage.tsx
 *
 * Fully wired Wakilz Client Dashboard at /client.
 * - Official Wakilz brand icon + wordmark at top left
 * - Portal Tabs:
 *    1. 📊 Analytics & Leads (Live conversion funnel, KPIs, trend, drop causes, language, lead table)
 *    2. 📞 Outbound Campaigns (Rasen outbound batch calling, campaign creation, live recipient diagnostics)
 * - Animated LeadDetailsDrawer: clicking any KPI stat card or lead row slides open full intelligence + Call ID + recording
 */

import React, { useState } from 'react'
import { Link } from 'react-router'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts'
import {
  PhoneCall, CalendarCheck, Trophy, UserCheck, FileCheck,
  Building2, Globe2, ShieldCheck, Calendar, RefreshCw,
  ChevronDown, AlertCircle, Clock, TrendingUp, Phone,
  Sparkles, Layers, ArrowUpRight, Copy, Check
} from 'lucide-react'
import { useClientDashboard, type LeadRow } from '@/hooks/useClientDashboard'
import LeadDetailsDrawer from '@/components/client/LeadDetailsDrawer'
import OutboundCampaignsView from '@/components/client/OutboundCampaignsView'

// ── Design Tokens (Wakilz dark luxury theme) ─────────────────────────────────
const T = {
  deepNavy: '#0C1524',
  surface: '#162032',
  surfaceLight: '#1D2A3D',
  surfaceElevated: '#1E2B42',
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

// ── Mini Components ───────────────────────────────────────────────────────────

function Card({ children, style, id }: { children: React.ReactNode; style?: React.CSSProperties; id?: string }) {
  return (
    <div id={id} style={{
      background: T.surface, border: `1px solid ${T.border}`, borderRadius: 20,
      padding: 'clamp(16px, 2vw, 24px)', boxShadow: '0 12px 32px rgba(0,0,0,0.25)',
      backdropFilter: 'blur(20px)', ...style,
    }}>
      {children}
    </div>
  )
}

function SectionHeading({ eyebrow, title, description, rightAction }: {
  eyebrow?: string; title: string; description?: string; rightAction?: React.ReactNode
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
      <div>
        {eyebrow && (
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: T.brass, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 4, fontWeight: 600 }}>
            {eyebrow}
          </div>
        )}
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(18px, 1.8vw, 22px)', color: T.textPrimary, fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>
          {title}
        </h2>
        {description && (
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: T.textSecondary, margin: '4px 0 0' }}>
            {description}
          </p>
        )}
      </div>
      {rightAction && <div>{rightAction}</div>}
    </div>
  )
}

function StatCard({ icon: Icon, label, value, sub, tone = 'default', badge, onClick }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string
  tone?: 'default' | 'brass' | 'green' | 'accent'; badge?: string; onClick?: () => void
}) {
  const fg = tone === 'green' ? T.green : tone === 'brass' ? T.brass : tone === 'accent' ? T.accentGlow : T.textPrimary
  const bg = tone === 'green' ? T.greenSoft : tone === 'brass' ? T.brassSoft : 'rgba(90,108,255,0.12)'
  return (
    <div
      onClick={onClick}
      style={{
        background: T.surface, borderRadius: 16, padding: '20px',
        border: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column',
        boxShadow: '0 8px 24px rgba(0,0,0,0.2)', transition: 'transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
        cursor: onClick ? 'pointer' : 'default',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = T.brass
        e.currentTarget.style.transform = 'translateY(-3px)'
        e.currentTarget.style.boxShadow = '0 14px 32px rgba(0,0,0,0.4)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = T.border
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.2)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon size={16} color={fg} />
          </div>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500, color: T.textSecondary }}>
            {label}
          </span>
        </div>
        {badge && (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, fontWeight: 600, color: T.green, background: T.greenSoft, padding: '2px 7px', borderRadius: 10 }}>
            {badge}
          </span>
        )}
      </div>

      <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(24px, 2.5vw, 32px)', color: fg, fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.02em' }}>
        {value}
      </div>

      {sub && (
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: T.slate, marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>{sub}</span>
          {onClick && <span style={{ color: T.brass, fontSize: 11 }}>View details →</span>}
        </div>
      )}
    </div>
  )
}

function SkeletonCard() {
  return (
    <div style={{ background: T.surface, borderRadius: 16, padding: '20px', border: `1px solid ${T.border}`, height: 120 }}>
      <div style={{ background: T.surfaceLight, borderRadius: 8, height: 14, width: '50%', marginBottom: 16 }} />
      <div style={{ background: T.surfaceLight, borderRadius: 8, height: 28, width: '35%', marginBottom: 10 }} />
      <div style={{ background: T.surfaceLight, borderRadius: 8, height: 10, width: '70%' }} />
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function ClientPreviewPage() {
  const [activeTab, setActiveTab] = useState<'analytics' | 'outbound'>('analytics')

  // Date filters
  const today = new Date().toISOString().slice(0, 10)
  const monthStart = today.slice(0, 7) + '-01'

  const [timePreset, setTimePreset] = useState<'7d' | '30d' | 'month' | 'custom'>('month')
  const [fromDate, setFromDate] = useState<string>(monthStart)
  const [toDate, setToDate] = useState<string>(today)

  // Real data from backend
  const { data, loading, error, lastRefreshed, refresh } = useClientDashboard({
    startDate: fromDate,
    endDate: toDate,
  })

  // Drawer state for Lead Intelligence
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false)
  const [drawerTitle, setDrawerTitle] = useState<string>('Lead Intelligence')
  const [drawerSubtitle, setDrawerSubtitle] = useState<string>('')
  const [drawerLeads, setDrawerLeads] = useState<LeadRow[]>([])
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null)

  const openDrawer = (title: string, subtitle: string, leads: LeadRow[], selectedId?: string) => {
    setDrawerTitle(title)
    setDrawerSubtitle(subtitle)
    setDrawerLeads(leads)
    setSelectedLeadId(selectedId || null)
    setDrawerOpen(true)
  }

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}m ${s}s`
  }

  const statusColors = {
    Booked: { bg: T.greenSoft, fg: T.green, border: 'rgba(79,190,135,0.3)' },
    'Site visit set': { bg: T.brassSoft, fg: T.brass, border: 'rgba(229,192,123,0.3)' },
    Contacted: { bg: 'rgba(90,108,255,0.12)', fg: T.accentGlow, border: 'rgba(90,108,255,0.3)' },
    Dropped: { bg: T.redSoft, fg: T.red, border: 'rgba(248,113,113,0.3)' },
    Escalated: { bg: 'rgba(245,166,35,0.12)', fg: '#F5A623', border: 'rgba(245,166,35,0.3)' },
  }

  const maxFunnelVal = (data?.funnel[0]?.value) || 1

  return (
    <div style={{ minHeight: '100vh', background: T.deepNavy, color: T.textPrimary, fontFamily: 'var(--font-body)', paddingBottom: 60 }}>

      {/* ── Sticky Header ── */}
      <header style={{ borderBottom: `1px solid ${T.border}`, background: 'rgba(12,21,36,0.92)', backdropFilter: 'blur(24px)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1360, margin: '0 auto', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>

          {/* Official Wakilz Logo at Top Left */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
              <img
                src={`${import.meta.env.BASE_URL}assets/images/logo.png?v=2`}
                alt="wakilz logo"
                style={{ height: 26, width: 'auto', objectFit: 'contain' }}
              />
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: T.textPrimary, letterSpacing: '-0.02em' }}>
                wakilz
              </span>
            </Link>

            <div style={{ background: T.surfaceLight, border: `1px solid ${T.border}`, padding: '4px 10px', borderRadius: 20, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.green, boxShadow: `0 0 8px ${T.green}` }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, color: T.textSecondary }}>CLIENT PORTAL</span>
            </div>
          </div>

          {/* Center Tabs: Analytics & Leads vs Outbound Campaigns */}
          <div style={{ display: 'flex', background: T.surface, border: `1px solid ${T.borderStrong}`, borderRadius: 12, padding: 3, gap: 4 }}>
            <button
              id="tab-analytics"
              onClick={() => setActiveTab('analytics')}
              style={{
                background: activeTab === 'analytics' ? T.surfaceLight : 'transparent',
                color: activeTab === 'analytics' ? T.textPrimary : T.textSecondary,
                border: activeTab === 'analytics' ? `1px solid ${T.borderStrong}` : 'none',
                borderRadius: 9,
                padding: '6px 16px',
                fontSize: 12.5,
                fontWeight: activeTab === 'analytics' ? 600 : 400,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.15s',
              }}
            >
              <span>📊</span> Analytics & Leads
            </button>

            <button
              id="tab-outbound"
              onClick={() => setActiveTab('outbound')}
              style={{
                background: activeTab === 'outbound' ? T.surfaceLight : 'transparent',
                color: activeTab === 'outbound' ? T.textPrimary : T.textSecondary,
                border: activeTab === 'outbound' ? `1px solid ${T.borderStrong}` : 'none',
                borderRadius: 9,
                padding: '6px 16px',
                fontSize: 12.5,
                fontWeight: activeTab === 'outbound' ? 600 : 400,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.15s',
              }}
            >
              <span>📞</span> Outbound Campaigns
            </button>
          </div>

          {/* Right utilities */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 20, padding: '5px 12px' }}>
              <Globe2 size={13} color={T.brass} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: T.textSecondary }}>EN · HI Multilingual</span>
            </div>

            {lastRefreshed && (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: T.textMuted }}>
                Updated {lastRefreshed.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
              </span>
            )}

            <button id="refresh-btn" onClick={refresh}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 20, padding: '6px 14px', color: T.textSecondary, fontSize: 12, cursor: 'pointer', transition: 'all 0.2s ease', fontFamily: 'var(--font-body)' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = T.borderStrong; e.currentTarget.style.color = T.textPrimary }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textSecondary }}
            >
              <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Container ── */}
      <main style={{ maxWidth: 1360, margin: '0 auto', padding: 'clamp(16px, 2.5vw, 32px) 20px' }}>

        {/* TAB 1: ANALYTICS & LEADS */}
        {activeTab === 'analytics' && (
          <div>
            {/* ── Error Banner ── */}
            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', background: T.redSoft, border: `1px solid rgba(248,113,113,0.3)`, borderRadius: 14, marginBottom: 24 }}>
                <AlertCircle size={18} color={T.red} style={{ flexShrink: 0 }} />
                <div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 13.5, fontWeight: 600, color: T.red }}>Failed to connect to backend</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: T.textSecondary, marginTop: 2 }}>{error}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: T.textMuted, marginTop: 4 }}>Make sure the backend is running at http://localhost:8080</div>
                </div>
              </div>
            )}

            {/* ── Filters: Project & Date Range ── */}
            <section style={{ background: T.surface, border: `1px solid ${T.borderStrong}`, borderRadius: 20, padding: '20px 24px', marginBottom: 28, boxShadow: '0 16px 40px rgba(0,0,0,0.3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
                {/* Project indicator (single client) */}
                <div style={{ flex: '1 1 260px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-mono)', fontSize: 11, color: T.brass, letterSpacing: 1.1, textTransform: 'uppercase', marginBottom: 6, fontWeight: 600 }}>
                    <Building2 size={13} /> Campaign Scope
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: T.deepNavy, border: `1px solid ${T.borderStrong}`, borderRadius: 12, padding: '12px 14px' }}>
                    <span style={{ fontSize: 18 }}>🌟</span>
                    <div>
                      <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 700, color: T.textPrimary }}>Wakilz Demo Client</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: T.textMuted, marginTop: 1 }}>
                        {loading ? 'Loading...' : `${data?.stats.totalCalls.toLocaleString('en-IN') ?? 0} calls in period`}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Date Range Controls */}
                <div style={{ flex: '2 1 480px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-mono)', fontSize: 11, color: T.textSecondary, letterSpacing: 1.1, textTransform: 'uppercase', fontWeight: 600 }}>
                      <Calendar size={13} color={T.brass} /> Time Period
                    </span>
                    {/* Preset chips */}
                    <div style={{ display: 'flex', background: T.deepNavy, borderRadius: 10, padding: 3, gap: 2 }}>
                      {([
                        { key: '7d', label: '7 Days', from: new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10) },
                        { key: '30d', label: '30 Days', from: new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10) },
                        { key: 'month', label: 'This Month', from: today.slice(0, 7) + '-01' },
                        { key: 'custom', label: 'Custom', from: null },
                      ] as const).map(p => (
                        <button key={p.key}
                          onClick={() => {
                            setTimePreset(p.key)
                            if (p.from) { setFromDate(p.from); setToDate(today) }
                          }}
                          style={{
                            background: timePreset === p.key ? T.surfaceLight : 'transparent',
                            color: timePreset === p.key ? T.textPrimary : T.textSecondary,
                            border: 'none', borderRadius: 8, padding: '5px 10px', fontSize: 12,
                            fontWeight: timePreset === p.key ? 600 : 400, cursor: 'pointer',
                            transition: 'all 0.15s', fontFamily: 'var(--font-body)',
                          }}
                        >{p.label}</button>
                      ))}
                    </div>
                  </div>
                  {/* From / To date pickers */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <div style={{ flex: '1 1 140px' }}>
                      <label htmlFor="from-date" style={{ display: 'block', fontSize: 10.5, fontFamily: 'var(--font-mono)', color: T.textMuted, marginBottom: 2 }}>From Date</label>
                      <input id="from-date" type="date" value={fromDate}
                        onChange={e => { setFromDate(e.target.value); setTimePreset('custom') }}
                        style={{ width: '100%', background: T.deepNavy, color: T.textPrimary, border: `1px solid ${T.borderStrong}`, borderRadius: 10, padding: '8px 12px', fontSize: 12.5, fontFamily: 'var(--font-mono)', outline: 'none' }}
                      />
                    </div>
                    <span style={{ color: T.textMuted, fontSize: 12, marginTop: 16 }}>→</span>
                    <div style={{ flex: '1 1 140px' }}>
                      <label htmlFor="to-date" style={{ display: 'block', fontSize: 10.5, fontFamily: 'var(--font-mono)', color: T.textMuted, marginBottom: 2 }}>To Date</label>
                      <input id="to-date" type="date" value={toDate}
                        onChange={e => { setToDate(e.target.value); setTimePreset('custom') }}
                        style={{ width: '100%', background: T.deepNavy, color: T.textPrimary, border: `1px solid ${T.borderStrong}`, borderRadius: 10, padding: '8px 12px', fontSize: 12.5, fontFamily: 'var(--font-mono)', outline: 'none' }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* ── KPI Stat Cards with Clickable Drawer Triggers ── */}
            <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 16, marginBottom: 28 }}>
              {loading ? (
                <>{[0, 1, 2, 3].map(i => <SkeletonCard key={i} />)}</>
              ) : data ? (
                <>
                  <StatCard
                    icon={PhoneCall}
                    label="Calls Dialed"
                    tone="default"
                    value={data.stats.totalCalls.toLocaleString('en-IN')}
                    sub={`${data.stats.answeredCalls} answered · Avg. ${formatDuration(data.stats.avgDurationSecs)}/call`}
                    onClick={() => openDrawer(
                      'All Dialed Calls',
                      `All ${data.stats.totalCalls} outreach calls in selected period`,
                      data.allLeads
                    )}
                  />

                  <StatCard
                    icon={Phone}
                    label="Qualified Leads"
                    tone="accent"
                    value={data.stats.qualifiedLeads.toLocaleString('en-IN')}
                    sub={`${data.stats.qualifiedRate}% qualification rate`}
                    badge={`${data.stats.qualifiedRate}% rate`}
                    onClick={() => openDrawer(
                      'Qualified Leads',
                      `${data.stats.qualifiedLeads} high-intent buyers verified with budget, location & timeline`,
                      data.leads
                    )}
                  />

                  <StatCard
                    icon={CalendarCheck}
                    label="Site Visits Booked"
                    tone="brass"
                    value={data.stats.visitsBooked.toLocaleString('en-IN')}
                    sub={`${data.stats.visitBookedRate}% of qualified leads booked a visit`}
                    onClick={() => openDrawer(
                      'Site Visits Booked',
                      `${data.stats.visitsBooked} scheduled site inspections with date/time slots`,
                      data.allLeads.filter(l => l.status === 'Booked' || l.siteVisitSlot !== '—')
                    )}
                  />

                  <StatCard
                    icon={Trophy}
                    label="Conversations Held"
                    tone="green"
                    value={data.stats.conversations.toLocaleString('en-IN')}
                    sub="Reached qualification stage"
                    badge="Completed"
                    onClick={() => openDrawer(
                      'Conversations Held',
                      `${data.stats.conversations} completed voice calls reaching discovery & intent verification`,
                      data.allLeads.filter(l => l.durationSecs > 10)
                    )}
                  />
                </>
              ) : null}
            </section>

            {/* ── Funnel ── */}
            {(loading || (data && data.funnel.length > 0)) && (
              <section style={{ marginBottom: 28 }}>
                <Card id="funnel-card">
                  <SectionHeading
                    eyebrow="Conversion Flow Diagnostics"
                    title="Where the Lead Funnel Converts & Leaks"
                    description="End-to-end trace from first AI voice outreach to confirmed site visits — computed from real call data."
                    rightAction={data && (
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: T.green, background: T.greenSoft, padding: '4px 10px', borderRadius: 14, fontWeight: 600 }}>
                        {maxFunnelVal > 0 ? `${((data.stats.visitsBooked / maxFunnelVal) * 100).toFixed(2)}% Bot-to-Visit Rate` : '—'}
                      </span>
                    )}
                  />
                  {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {[0, 1, 2, 3, 4].map(i => (
                        <div key={i} style={{ background: T.surfaceLight, borderRadius: 12, padding: '14px 16px', border: `1px solid ${T.border}` }}>
                          <div style={{ background: T.surface, borderRadius: 4, height: 12, width: `${80 - i * 10}%`, marginBottom: 10 }} />
                          <div style={{ background: T.surface, borderRadius: 4, height: 8, width: `${80 - i * 10}%` }} />
                        </div>
                      ))}
                    </div>
                  ) : data && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 12 }}>
                      {data.funnel.map((stage, i) => {
                        const widthPct = Math.max((stage.value / maxFunnelVal) * 100, 2)
                        const prev = i > 0 ? data.funnel[i - 1].value : stage.value
                        const dropPct = i > 0 && prev > 0 ? Math.round(((prev - stage.value) / prev) * 100) : 0
                        const isFinal = i === data.funnel.length - 1
                        return (
                          <div key={stage.label} style={{ background: T.surfaceLight, borderRadius: 14, padding: '14px 16px', border: `1px solid ${T.border}` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ width: 22, height: 22, borderRadius: '50%', background: isFinal ? T.greenSoft : T.brassSoft, color: isFinal ? T.green : T.brass, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700 }}>{i + 1}</span>
                                <span style={{ fontFamily: 'var(--font-body)', fontSize: 13.5, color: T.textPrimary, fontWeight: 600 }}>{stage.label}</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                {i > 0 && dropPct > 0 && (
                                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: T.red, background: T.redSoft, padding: '2px 8px', borderRadius: 10 }}>
                                    -{dropPct}% drop
                                  </span>
                                )}
                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: T.textSecondary }}>
                                  <strong style={{ color: T.textPrimary, fontSize: 15 }}>{stage.value.toLocaleString('en-IN')}</strong>
                                  <span style={{ color: T.textMuted, fontSize: 11, marginLeft: 4 }}>
                                    ({maxFunnelVal > 0 ? ((stage.value / maxFunnelVal) * 100).toFixed(1) : 0}%)
                                  </span>
                                </span>
                              </div>
                            </div>
                            <div style={{ height: 8, background: T.deepNavy, borderRadius: 4, overflow: 'hidden' }}>
                              <div style={{ width: `${widthPct}%`, height: '100%', background: isFinal ? T.green : 'linear-gradient(90deg, #2A3FE0, #E5C07B)', borderRadius: 4, transition: 'width 0.6s ease' }} />
                            </div>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: T.textMuted, marginTop: 6 }}>
                              {stage.note}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </Card>
              </section>
            )}

            {/* ── Charts: Velocity + Root Cause Analysis ── */}
            <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20, marginBottom: 28 }}>
              <Card id="trend-chart">
                <SectionHeading eyebrow="Performance Velocity" title="Conversations vs. Visit Bookings" description="Weekly pace of AI outreach vs confirmed visit slots." />
                {loading ? (
                  <div style={{ height: 220, background: T.surfaceLight, borderRadius: 10, marginTop: 10 }} />
                ) : data && data.trend.length > 0 ? (
                  <>
                    <div style={{ height: 200, marginTop: 10 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data.trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="convGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={T.accentGlow} stopOpacity={0.5} />
                              <stop offset="100%" stopColor={T.accentGlow} stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="bookGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={T.brass} stopOpacity={0.5} />
                              <stop offset="100%" stopColor={T.brass} stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid vertical={false} stroke="rgba(243,240,234,0.06)" />
                          <XAxis dataKey="week" tick={{ fontSize: 11, fontFamily: 'var(--font-mono)', fill: T.textMuted }} axisLine={{ stroke: T.border }} tickLine={false} />
                          <YAxis tick={{ fontSize: 11, fontFamily: 'var(--font-mono)', fill: T.textMuted }} axisLine={{ stroke: T.border }} tickLine={false} />
                          <Tooltip contentStyle={{ background: T.surfaceElevated, borderColor: T.borderStrong, borderRadius: 10, fontFamily: 'var(--font-body)', fontSize: 12, color: T.textPrimary, boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }} />
                          <Area type="monotone" dataKey="conversations" name="Conversations" stroke={T.accentGlow} fill="url(#convGrad)" strokeWidth={2.5} />
                          <Area type="monotone" dataKey="bookings" name="Visits Booked" stroke={T.brass} fill="url(#bookGrad)" strokeWidth={2.5} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                    <div style={{ display: 'flex', gap: 16, marginTop: 10, justifyContent: 'flex-end' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: T.accentGlow, display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: T.accentGlow }} /> Conversations</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: T.brass, display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: T.brass }} /> Visits Booked</span>
                    </div>
                  </>
                ) : (
                  <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textMuted, fontFamily: 'var(--font-mono)', fontSize: 13 }}>
                    No data for this period
                  </div>
                )}
              </Card>

              <Card id="drop-reasons-chart">
                <SectionHeading eyebrow="Root Cause Analysis" title="Call Drop Breakdown" description="Where and why conversations end without a visit booking." />
                {loading ? (
                  <div style={{ height: 220, background: T.surfaceLight, borderRadius: 10, marginTop: 10 }} />
                ) : data && data.dropReasons.length > 0 ? (
                  <div style={{ height: 220, marginTop: 10 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.dropReasons} layout="vertical" margin={{ left: 10, right: 20, top: 0, bottom: 0 }}>
                        <XAxis type="number" hide domain={[0, 100]} />
                        <YAxis type="category" dataKey="reason" width={155} tick={{ fontSize: 11.5, fontFamily: 'var(--font-body)', fill: T.textSecondary }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ background: T.surfaceElevated, borderColor: T.borderStrong, borderRadius: 10, fontFamily: 'var(--font-body)', fontSize: 12, color: T.textPrimary }} formatter={(v) => [`${v}% share of drops`]} />
                        <Bar dataKey="pct" fill={T.red} radius={[0, 6, 6, 0]} barSize={16} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textMuted, fontFamily: 'var(--font-mono)', fontSize: 13 }}>
                    No drop data for this period
                  </div>
                )}
              </Card>
            </section>

            {/* ── Outcome Breakdown + Language Split ── */}
            <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, marginBottom: 28 }}>
              {/* Outcome Breakdown */}
              <Card id="outcome-breakdown">
                <SectionHeading eyebrow="Call Quality" title="Outcome Distribution" description="How each call resolved — from lead captured to hung up." />
                {loading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}>
                    {[0, 1, 2, 3].map(i => <div key={i} style={{ background: T.surfaceLight, borderRadius: 8, height: 28 }} />)}
                  </div>
                ) : data ? (
                  <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[
                      { key: 'lead_captured', label: '✅ Lead Captured', color: T.green },
                      { key: 'partial_lead', label: '🔶 Partial Lead', color: T.brass },
                      { key: 'no_lead', label: '⬜ No Qualifying Info', color: T.slate },
                      { key: 'hung_up_early', label: '🔴 Hung Up Early', color: T.red },
                      { key: 'escalated', label: '⚠️ Escalated', color: '#F5A623' },
                    ].map(({ key, label, color }) => {
                      const count = data.stats.outcomeBreakdown[key as keyof typeof data.stats.outcomeBreakdown]
                      const pct = data.stats.totalCalls > 0 ? Math.round((count / data.stats.totalCalls) * 100) : 0
                      return (
                        <div key={key}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 4 }}>
                            <span style={{ color: T.textSecondary }}>{label}</span>
                            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color }}>{count.toLocaleString('en-IN')} ({pct}%)</span>
                          </div>
                          <div style={{ height: 8, background: T.deepNavy, borderRadius: 4, overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.5s ease' }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : null}
              </Card>

              {/* Language split + Avg duration */}
              <Card id="lang-duration-card">
                <SectionHeading eyebrow="Reach & Quality" title="Caller Language & Duration" description="Multilingual distribution and average call engagement time." />
                {loading ? (
                  <div style={{ background: T.surfaceLight, borderRadius: 10, height: 160, marginTop: 14 }} />
                ) : data ? (
                  <div style={{ marginTop: 14 }}>
                    {/* Avg Duration callout */}
                    <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
                      <div style={{ flex: 1, background: T.surfaceLight, borderRadius: 14, padding: 16, border: `1px solid ${T.border}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                          <Clock size={13} color={T.brass} />
                          <span style={{ fontFamily: 'var(--font-body)', fontSize: 11.5, color: T.textSecondary }}>Avg call duration</span>
                        </div>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: T.textPrimary, fontWeight: 700 }}>
                          {formatDuration(data.stats.avgDurationSecs)}
                        </div>
                      </div>
                      <div style={{ flex: 1, background: T.surfaceLight, borderRadius: 14, padding: 16, border: `1px solid ${T.border}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                          <UserCheck size={13} color={T.green} />
                          <span style={{ fontFamily: 'var(--font-body)', fontSize: 11.5, color: T.textSecondary }}>Qualified / total</span>
                        </div>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: T.green, fontWeight: 700 }}>
                          {data.stats.qualifiedRate}%
                        </div>
                      </div>
                    </div>

                    {/* Language split */}
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 12.5, fontWeight: 600, color: T.textPrimary, marginBottom: 8 }}>Language Distribution</div>
                    <div style={{ display: 'flex', height: 12, borderRadius: 6, overflow: 'hidden', background: T.deepNavy }}>
                      {data.languageSplit.map(l => <div key={l.key} style={{ width: `${l.pct}%`, background: l.color }} title={`${l.key}: ${l.pct}%`} />)}
                    </div>
                    <div style={{ display: 'flex', gap: 14, marginTop: 8, flexWrap: 'wrap' }}>
                      {data.languageSplit.map(l => (
                        <span key={l.key} style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: T.textSecondary }}>
                          <span style={{ color: l.color }}>●</span> {l.key} {l.pct}%
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </Card>
            </section>

            {/* ── Recent Qualified Leads Table ── */}
            <section style={{ marginBottom: 28 }}>
              <Card id="leads-table">
                <SectionHeading
                  eyebrow="Live Buyer Pipeline"
                  title="Recent Qualified Leads"
                  description="Extracted from call transcripts — real-time, timestamped. Click any row to inspect complete call details."
                  rightAction={data && (
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: T.textMuted }}>
                      {data.leads.length} leads shown · Click row to inspect
                    </span>
                  )}
                />
                <div style={{ overflowX: 'auto', marginTop: 14 }}>
                  {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {[0, 1, 2, 3, 4].map(i => <div key={i} style={{ background: T.surfaceLight, borderRadius: 8, height: 52 }} />)}
                    </div>
                  ) : data && data.leads.length > 0 ? (
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 620 }}>
                      <thead>
                        <tr style={{ borderBottom: `1px solid ${T.borderStrong}` }}>
                          {['BUYER', 'INTENT', 'BUDGET', 'LOCATION', 'WHEN', 'STATUS', 'INSPECT'].map(h => (
                            <th key={h} style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)', fontSize: 11, color: T.textSecondary, fontWeight: 600, textAlign: h === 'INSPECT' ? 'right' : 'left' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {data.leads.map(lead => {
                          const sc = statusColors[lead.status] ?? statusColors.Contacted
                          return (
                            <tr
                              key={lead.id}
                              onClick={() => openDrawer(lead.name, `Call Details & AI Transcript for ${lead.phone}`, [lead, ...data.leads.filter(l => l.id !== lead.id)], lead.id)}
                              style={{ borderBottom: `1px solid ${T.border}`, transition: 'background 0.15s', cursor: 'pointer' }}
                              onMouseEnter={e => (e.currentTarget.style.background = T.surfaceLight)}
                              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                            >
                              <td style={{ padding: '12px 14px' }}>
                                <div style={{ fontWeight: 600, fontSize: 13.5, color: T.textPrimary }}>{lead.name}</div>
                                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: T.textMuted }}>{lead.phone}</div>
                              </td>
                              <td style={{ padding: '12px 14px', fontSize: 12.5, color: T.textSecondary }}>{lead.intent}</td>
                              <td style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)', fontSize: 12, color: T.brass, fontWeight: 600 }}>{lead.budget}</td>
                              <td style={{ padding: '12px 14px', fontSize: 12.5, color: T.textSecondary }}>{lead.location}</td>
                              <td style={{ padding: '12px 14px' }}>
                                <div style={{ fontSize: 12, color: T.textSecondary }}>{lead.time}</div>
                                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: T.textMuted }}>{lead.ts}</div>
                              </td>
                              <td style={{ padding: '12px 14px' }}>
                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 20, background: sc.bg, color: sc.fg, border: `1px solid ${sc.border}`, whiteSpace: 'nowrap' }}>
                                  {lead.status}
                                </span>
                              </td>
                              <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                                <button
                                  onClick={e => {
                                    e.stopPropagation()
                                    openDrawer(lead.name, `Call Details & AI Transcript for ${lead.phone}`, [lead, ...data.leads.filter(l => l.id !== lead.id)], lead.id)
                                  }}
                                  style={{
                                    background: T.deepNavy,
                                    border: `1px solid ${T.borderStrong}`,
                                    color: T.accentGlow,
                                    padding: '4px 10px',
                                    borderRadius: 8,
                                    fontSize: 11,
                                    cursor: 'pointer',
                                  }}
                                >
                                  Inspect →
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  ) : !loading && (
                    <div style={{ padding: '40px 0', textAlign: 'center', color: T.textMuted, fontFamily: 'var(--font-mono)', fontSize: 13 }}>
                      No qualified leads captured in this date range.
                    </div>
                  )}
                </div>
              </Card>
            </section>

            {/* ── Compliance Strip ── */}
            <section style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '14px 20px', background: T.greenSoft, border: '1px solid rgba(79,190,135,0.25)', borderRadius: 16, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <ShieldCheck size={20} color={T.green} style={{ flexShrink: 0 }} />
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 12.5, color: T.green, fontWeight: 600 }}>
                  100% DND-Scrubbed · TRAI / DLT Registered · Call Consent Logged on Every Interaction
                </span>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: T.green }}>
                Compliant with Indian Telecom Regulations
              </span>
            </section>
          </div>
        )}

        {/* TAB 2: OUTBOUND CAMPAIGNS */}
        {activeTab === 'outbound' && (
          <OutboundCampaignsView />
        )}
      </main>

      {/* ── Animated Lead Details Drawer ── */}
      <LeadDetailsDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={drawerTitle}
        subtitle={drawerSubtitle}
        leads={drawerLeads}
        selectedLeadId={selectedLeadId}
      />

      {/* Inline spin animation */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
