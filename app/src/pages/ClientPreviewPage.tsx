/**
 * ClientPreviewPage.tsx
 *
 * Fully wired Wakilz Client Dashboard at /client.
 * - Mobile-First High-Density Luxury Design
 * - Compact 52px sticky navbar
 * - Single-row horizontal scrollable filter strip
 * - 2x2 Bento KPI Grid on mobile viewports
 * - High-density LeadDetailsDrawer integration
 */

import React, { useState } from 'react'
import { Link } from 'react-router'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts'
import {
  PhoneCall, CalendarCheck, Trophy, UserCheck,
  Building2, Globe2, ShieldCheck, Calendar, RefreshCw,
  ChevronDown, AlertCircle, Clock, Phone,
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
      background: T.surface, border: `1px solid ${T.border}`, borderRadius: 18,
      padding: 'clamp(14px, 2.2vw, 24px)', boxShadow: '0 12px 32px rgba(0,0,0,0.25)',
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
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
      <div>
        {eyebrow && (
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: T.brass, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 3, fontWeight: 600 }}>
            {eyebrow}
          </div>
        )}
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(16px, 1.8vw, 20px)', color: T.textPrimary, fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>
          {title}
        </h2>
        {description && (
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 12.5, color: T.textSecondary, margin: '3px 0 0' }}>
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
        background: T.surface,
        borderRadius: 16,
        padding: '12px 14px',
        border: `1px solid ${T.border}`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
        transition: 'transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease',
        cursor: onClick ? 'pointer' : 'default',
        position: 'relative',
        minHeight: 114,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = T.brass
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = '0 12px 28px rgba(0,0,0,0.35)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = T.border
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.2)'
      }}
    >
      {/* Row 1: Icon on left, Badge cleanly on right */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={15} color={fg} />
        </div>
        {badge && (
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            fontWeight: 700,
            color: fg,
            background: bg,
            border: `1px solid ${bg}`,
            padding: '2px 7px',
            borderRadius: 6,
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}>
            {badge}
          </span>
        )}
      </div>

      {/* Row 2: Value & Label */}
      <div>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(22px, 3vw, 28px)',
          color: fg,
          fontWeight: 700,
          lineHeight: 1.1,
          letterSpacing: '-0.02em',
          margin: '2px 0 2px',
        }}>
          {value}
        </div>
        <div style={{
          fontFamily: 'var(--font-body)',
          fontSize: 12,
          fontWeight: 600,
          color: T.textSecondary,
          lineHeight: 1.25,
        }}>
          {label}
        </div>
      </div>

      {/* Row 3: Subtext */}
      {sub && (
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10.5,
          color: T.textMuted,
          marginTop: 4,
          lineHeight: 1.3,
        }}>
          {sub}
        </div>
      )}
    </div>
  )
}

function SkeletonCard() {
  return (
    <div style={{ background: T.surface, borderRadius: 16, padding: '16px', border: `1px solid ${T.border}`, height: 110 }}>
      <div style={{ background: T.surfaceLight, borderRadius: 6, height: 12, width: '50%', marginBottom: 12 }} />
      <div style={{ background: T.surfaceLight, borderRadius: 6, height: 24, width: '35%', marginBottom: 8 }} />
      <div style={{ background: T.surfaceLight, borderRadius: 6, height: 10, width: '70%' }} />
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
  const { data, loading, error, refresh } = useClientDashboard({
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

      {/* ── 1. Compact Sticky Topbar (52px) ── */}
      <header style={{
        borderBottom: `1px solid ${T.border}`,
        background: 'rgba(12,21,36,0.95)',
        backdropFilter: 'blur(20px)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        <div style={{
          maxWidth: 1360,
          margin: '0 auto',
          padding: '8px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 52,
          gap: 12,
        }}>

          {/* Left: Official Logo + Live Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
              <img
                src={`${import.meta.env.BASE_URL}assets/images/logo.png?v=2`}
                alt="wakilz logo"
                style={{ height: 22, width: 'auto', objectFit: 'contain' }}
              />
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: T.textPrimary, letterSpacing: '-0.02em' }}>
                wakilz
              </span>
            </Link>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: T.surfaceLight, border: `1px solid ${T.border}`, padding: '2px 8px', borderRadius: 12 }}>
              <span className="pulse-indicator" style={{ width: 6, height: 6, borderRadius: '50%', background: T.green, boxShadow: `0 0 6px ${T.green}` }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, color: T.textSecondary }}>PORTAL PREVIEW</span>
            </div>
          </div>

          {/* Center Tabs on Desktop */}
          <div style={{
            display: 'none',
            background: T.surface,
            border: `1px solid ${T.borderStrong}`,
            borderRadius: 12,
            padding: 3,
            gap: 4,
          }} className="desktop-tabs">
            <button
              id="tab-analytics"
              onClick={() => setActiveTab('analytics')}
              style={{
                background: activeTab === 'analytics' ? T.surfaceLight : 'transparent',
                color: activeTab === 'analytics' ? T.textPrimary : T.textSecondary,
                border: activeTab === 'analytics' ? `1px solid ${T.borderStrong}` : 'none',
                borderRadius: 9,
                padding: '5px 14px',
                fontSize: 12,
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
                padding: '5px 14px',
                fontSize: 12,
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

          {/* Right Utilities */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: '3px 8px' }}>
              <Globe2 size={12} color={T.brass} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: T.textSecondary }}>EN·HI</span>
            </div>

            <button
              id="refresh-btn"
              onClick={refresh}
              title="Refresh Dashboard"
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: T.surface,
                border: `1px solid ${T.border}`,
                color: T.textSecondary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            </button>

            <Link
              to="/signin"
              style={{
                background: 'linear-gradient(135deg, #2A3FE0, #5A6CFF)',
                border: `1px solid ${T.borderStrong}`,
                borderRadius: 14,
                padding: '4px 12px',
                color: '#fff',
                fontSize: 11.5,
                fontWeight: 600,
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <span>Sign In</span>
              <ArrowUpRight size={12} />
            </Link>
          </div>
        </div>

        {/* Mobile Tab Switcher (Visible on mobile screens) */}
        <div className="mobile-tabs-bar" style={{ padding: '0 16px 8px' }}>
          <div style={{
            background: T.surface,
            border: `1px solid ${T.borderStrong}`,
            borderRadius: 12,
            padding: 3,
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 4,
          }}>
            <button
              onClick={() => setActiveTab('analytics')}
              style={{
                background: activeTab === 'analytics' ? T.surfaceLight : 'transparent',
                color: activeTab === 'analytics' ? T.textPrimary : T.textSecondary,
                border: activeTab === 'analytics' ? `1px solid ${T.borderStrong}` : 'none',
                borderRadius: 9,
                padding: '6px',
                fontSize: 12,
                fontWeight: activeTab === 'analytics' ? 600 : 400,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                boxShadow: activeTab === 'analytics' ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
              }}
            >
              <span>📊</span> Analytics
            </button>
            <button
              onClick={() => setActiveTab('outbound')}
              style={{
                background: activeTab === 'outbound' ? T.surfaceLight : 'transparent',
                color: activeTab === 'outbound' ? T.textPrimary : T.textSecondary,
                border: activeTab === 'outbound' ? `1px solid ${T.borderStrong}` : 'none',
                borderRadius: 9,
                padding: '6px',
                fontSize: 12,
                fontWeight: activeTab === 'outbound' ? 600 : 400,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                boxShadow: activeTab === 'outbound' ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
              }}
            >
              <span>📞</span> Outbound
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Container ── */}
      <main style={{ maxWidth: 1360, margin: '0 auto', padding: 'clamp(12px, 2vw, 24px) 16px' }}>

        {/* TAB 1: ANALYTICS & LEADS */}
        {activeTab === 'analytics' && (
          <div>
            {/* ── Error Banner ── */}
            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: T.redSoft, border: `1px solid rgba(248,113,113,0.3)`, borderRadius: 12, marginBottom: 16 }}>
                <AlertCircle size={16} color={T.red} style={{ flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.red }}>Connection Notice</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: T.textSecondary, marginTop: 1 }}>{error}</div>
                </div>
              </div>
            )}

            {/* ── 2. Compact Single-Row Filter Strip (Mobile-First) ── */}
            <section style={{ marginBottom: 16 }}>
              <div className="no-scrollbar" style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                overflowX: 'auto',
                paddingBottom: 4,
              }}>
                {/* Agent scope chip */}
                <div style={{
                  background: T.surfaceElevated,
                  border: `1px solid ${T.borderStrong}`,
                  borderRadius: 10,
                  padding: '6px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  whiteSpace: 'nowrap',
                  fontSize: 12,
                  fontWeight: 600,
                  color: T.textPrimary,
                  flexShrink: 0,
                }}>
                  <span style={{ color: T.brass }}>✨</span>
                  <span>Afroze Pasha (Preview)</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: T.textMuted, marginLeft: 2 }}>
                    ({loading ? '...' : `${data?.stats.totalCalls ?? 0} calls`})
                  </span>
                </div>

                {/* Preset filter pills */}
                {([
                  { key: '7d', label: '7D', from: new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10) },
                  { key: '30d', label: '30D', from: new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10) },
                  { key: 'month', label: 'This Month ★', from: today.slice(0, 7) + '-01' },
                  { key: 'custom', label: '📅 Custom', from: null },
                ] as const).map(p => (
                  <button
                    key={p.key}
                    onClick={() => {
                      setTimePreset(p.key)
                      if (p.from) { setFromDate(p.from); setToDate(today) }
                    }}
                    style={{
                      background: timePreset === p.key ? T.brassSoft : T.surface,
                      color: timePreset === p.key ? T.brass : T.textSecondary,
                      border: `1px solid ${timePreset === p.key ? T.brass : T.border}`,
                      borderRadius: 8,
                      padding: '6px 12px',
                      fontSize: 11.5,
                      fontWeight: timePreset === p.key ? 700 : 500,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                      transition: 'all 0.15s',
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Expandable Custom Date Pickers when 'custom' is active */}
              {timePreset === 'custom' && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  background: T.surface,
                  border: `1px solid ${T.borderStrong}`,
                  borderRadius: 12,
                  padding: '10px 14px',
                  marginTop: 8,
                  flexWrap: 'wrap',
                }}>
                  <div style={{ flex: '1 1 120px' }}>
                    <label htmlFor="from-date" style={{ display: 'block', fontSize: 10, fontFamily: 'var(--font-mono)', color: T.textMuted, marginBottom: 2 }}>From Date</label>
                    <input
                      id="from-date"
                      type="date"
                      value={fromDate}
                      onChange={e => setFromDate(e.target.value)}
                      style={{ width: '100%', background: T.deepNavy, color: T.textPrimary, border: `1px solid ${T.borderStrong}`, borderRadius: 8, padding: '6px 10px', fontSize: 12, fontFamily: 'var(--font-mono)', outline: 'none' }}
                    />
                  </div>
                  <span style={{ color: T.textMuted, fontSize: 12, marginTop: 14 }}>→</span>
                  <div style={{ flex: '1 1 120px' }}>
                    <label htmlFor="to-date" style={{ display: 'block', fontSize: 10, fontFamily: 'var(--font-mono)', color: T.textMuted, marginBottom: 2 }}>To Date</label>
                    <input
                      id="to-date"
                      type="date"
                      value={toDate}
                      onChange={e => setToDate(e.target.value)}
                      style={{ width: '100%', background: T.deepNavy, color: T.textPrimary, border: `1px solid ${T.borderStrong}`, borderRadius: 8, padding: '6px 10px', fontSize: 12, fontFamily: 'var(--font-mono)', outline: 'none' }}
                    />
                  </div>
                </div>
              )}
            </section>

            {/* ── 3. 2x2 Bento KPI Grid ── */}
            <section className="bento-kpi-grid" style={{
              display: 'grid',
              gap: 12,
              marginBottom: 20,
            }}>
              {loading ? (
                <>{[0, 1, 2, 3].map(i => <SkeletonCard key={i} />)}</>
              ) : data ? (
                <>
                  <StatCard
                    icon={PhoneCall}
                    label="Calls Dialed"
                    tone="default"
                    value={data.stats.totalCalls.toLocaleString('en-IN')}
                    sub={`${data.stats.answeredCalls} connected (${data.stats.connectRate}%)`}
                    badge="+12%"
                    onClick={() => openDrawer(
                      'All Dialed Calls',
                      `All ${data.stats.totalCalls} outreach calls in selected period`,
                      data.allLeads
                    )}
                  />

                  <StatCard
                    icon={Phone}
                    label="Qualified Leads"
                    tone="green"
                    value={data.stats.qualifiedLeads.toLocaleString('en-IN')}
                    sub={`${data.stats.qualifiedRate}% of connected`}
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
                    sub={`${data.stats.visitsBooked} of ${data.stats.qualifiedLeads} qualified`}
                    badge={`${data.stats.visitBookedRate}% conv`}
                    onClick={() => openDrawer(
                      'Site Visits Booked',
                      `${data.stats.visitsBooked} scheduled site inspections with date/time slots`,
                      data.allLeads.filter(l => l.status === 'Booked' || l.siteVisitSlot !== '—')
                    )}
                  />

                  <StatCard
                    icon={Trophy}
                    label="Conversations Held"
                    tone="accent"
                    value={data.stats.conversations.toLocaleString('en-IN')}
                    sub={`Avg ${formatDuration(data.stats.avgDurationSecs)} duration`}
                    badge="Engaged"
                    onClick={() => openDrawer(
                      'Conversations Held',
                      `${data.stats.conversations} completed voice calls reaching discovery & intent verification`,
                      data.allLeads.filter(l => l.durationSecs > 10)
                    )}
                  />
                </>
              ) : null}
            </section>

            {/* ── 4. Conversion Flow Funnel ── */}
            {(loading || (data && data.funnel.length > 0)) && (
              <section style={{ marginBottom: 20 }}>
                <Card id="funnel-card">
                  <SectionHeading
                    eyebrow="Conversion Flow Diagnostics"
                    title="Where the Lead Funnel Converts & Leaks"
                    description="End-to-end trace from first AI voice outreach to confirmed site visits."
                    rightAction={data && (
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: T.green, background: T.greenSoft, padding: '3px 8px', borderRadius: 10, fontWeight: 600 }}>
                        {maxFunnelVal > 0 ? `${((data.stats.visitsBooked / maxFunnelVal) * 100).toFixed(1)}% Visit Rate` : '—'}
                      </span>
                    )}
                  />
                  {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {[0, 1, 2, 3].map(i => (
                        <div key={i} style={{ background: T.surfaceLight, borderRadius: 10, padding: '10px 14px', border: `1px solid ${T.border}` }}>
                          <div style={{ background: T.surface, borderRadius: 4, height: 10, width: `${80 - i * 15}%`, marginBottom: 8 }} />
                          <div style={{ background: T.surface, borderRadius: 4, height: 6, width: `${80 - i * 15}%` }} />
                        </div>
                      ))}
                    </div>
                  ) : data && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
                      {data.funnel.map((stage, i) => {
                        const widthPct = Math.max((stage.value / maxFunnelVal) * 100, 2)
                        const prev = i > 0 ? data.funnel[i - 1].value : stage.value
                        const dropPct = i > 0 && prev > 0 ? Math.round(((prev - stage.value) / prev) * 100) : 0
                        const isFinal = i === data.funnel.length - 1
                        return (
                          <div key={stage.label} style={{ background: T.surfaceLight, borderRadius: 12, padding: '10px 14px', border: `1px solid ${T.border}` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, flexWrap: 'wrap', gap: 6 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ width: 18, height: 18, borderRadius: '50%', background: isFinal ? T.greenSoft : T.brassSoft, color: isFinal ? T.green : T.brass, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700 }}>{i + 1}</span>
                                <span style={{ fontSize: 12.5, color: T.textPrimary, fontWeight: 600 }}>{stage.label}</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                {i > 0 && dropPct > 0 && (
                                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: T.red, background: T.redSoft, padding: '1px 6px', borderRadius: 8 }}>
                                    -{dropPct}% drop
                                  </span>
                                )}
                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: T.textSecondary }}>
                                  <strong style={{ color: T.textPrimary, fontSize: 13 }}>{stage.value.toLocaleString('en-IN')}</strong>
                                  <span style={{ color: T.textMuted, fontSize: 10.5, marginLeft: 3 }}>
                                    ({maxFunnelVal > 0 ? ((stage.value / maxFunnelVal) * 100).toFixed(0) : 0}%)
                                  </span>
                                </span>
                              </div>
                            </div>
                            <div style={{ height: 6, background: T.deepNavy, borderRadius: 3, overflow: 'hidden' }}>
                              <div style={{ width: `${widthPct}%`, height: '100%', background: isFinal ? T.green : 'linear-gradient(90deg, #2A3FE0, #E5C07B)', borderRadius: 3, transition: 'width 0.6s ease' }} />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </Card>
              </section>
            )}

            {/* ── 5. Velocity & Root Cause Charts ── */}
            <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 20 }}>
              <Card id="trend-chart">
                <SectionHeading eyebrow="Performance Velocity" title="Conversations vs Visits" description="Weekly pace of AI outreach vs confirmed visit slots." />
                {loading ? (
                  <div style={{ height: 180, background: T.surfaceLight, borderRadius: 10, marginTop: 8 }} />
                ) : data && data.trend.length > 0 ? (
                  <>
                    <div style={{ height: 180, marginTop: 8 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data.trend} margin={{ top: 8, right: 8, left: -25, bottom: 0 }}>
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
                          <XAxis dataKey="week" tick={{ fontSize: 10, fontFamily: 'var(--font-mono)', fill: T.textMuted }} axisLine={{ stroke: T.border }} tickLine={false} />
                          <YAxis tick={{ fontSize: 10, fontFamily: 'var(--font-mono)', fill: T.textMuted }} axisLine={{ stroke: T.border }} tickLine={false} />
                          <Tooltip contentStyle={{ background: T.surfaceElevated, borderColor: T.borderStrong, borderRadius: 10, fontSize: 11, color: T.textPrimary }} />
                          <Area type="monotone" dataKey="conversations" name="Conversations" stroke={T.accentGlow} fill="url(#convGrad)" strokeWidth={2} />
                          <Area type="monotone" dataKey="bookings" name="Visits Booked" stroke={T.brass} fill="url(#bookGrad)" strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                    <div style={{ display: 'flex', gap: 12, marginTop: 6, justifyContent: 'flex-end' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: T.accentGlow, display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: T.accentGlow }} /> Conversations</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: T.brass, display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: T.brass }} /> Visits</span>
                    </div>
                  </>
                ) : (
                  <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textMuted, fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                    No trend data for this period
                  </div>
                )}
              </Card>

              <Card id="drop-reasons-chart">
                <SectionHeading eyebrow="Root Cause Analysis" title="Call Drop Breakdown" description="Where and why conversations end without a visit booking." />
                {loading ? (
                  <div style={{ height: 180, background: T.surfaceLight, borderRadius: 10, marginTop: 8 }} />
                ) : data && data.dropReasons.length > 0 ? (
                  <div style={{ height: 180, marginTop: 8 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.dropReasons} layout="vertical" margin={{ left: 5, right: 15, top: 0, bottom: 0 }}>
                        <XAxis type="number" hide domain={[0, 100]} />
                        <YAxis type="category" dataKey="reason" width={130} tick={{ fontSize: 10.5, fontFamily: 'var(--font-body)', fill: T.textSecondary }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ background: T.surfaceElevated, borderColor: T.borderStrong, borderRadius: 10, fontSize: 11, color: T.textPrimary }} formatter={(v) => [`${v}% share`]} />
                        <Bar dataKey="pct" fill={T.red} radius={[0, 4, 4, 0]} barSize={12} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textMuted, fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                    No drop data for this period
                  </div>
                )}
              </Card>
            </section>

            {/* ── 6. Recent Qualified Leads (Mobile & Desktop) ── */}
            <section style={{ marginBottom: 20 }}>
              <Card id="leads-table">
                <SectionHeading
                  eyebrow="Live Buyer Pipeline"
                  title="Recent Qualified Leads"
                  description="Extracted from call transcripts. Tap any lead to inspect audio & transcript."
                  rightAction={data && (
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: T.textMuted }}>
                      {data.leads.length} leads · Tap to inspect
                    </span>
                  )}
                />

                {/* Mobile Cards Mode */}
                <div className="mobile-leads-list" style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                  {loading ? (
                    [0, 1, 2].map(i => <div key={i} style={{ background: T.surfaceLight, borderRadius: 10, height: 60 }} />)
                  ) : data && data.leads.length > 0 ? (
                    data.leads.map(lead => {
                      const sc = statusColors[lead.status] ?? statusColors.Contacted
                      return (
                        <div
                          key={lead.id}
                          onClick={() => openDrawer(lead.name, `Call Details & AI Transcript for ${lead.phone}`, [lead, ...data.leads.filter(l => l.id !== lead.id)], lead.id)}
                          style={{
                            background: T.surfaceLight,
                            border: `1px solid ${T.border}`,
                            borderRadius: 12,
                            padding: '10px 12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            cursor: 'pointer',
                            transition: 'border-color 0.15s',
                          }}
                        >
                          <div style={{ minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontSize: 13, fontWeight: 700, color: T.textPrimary }}>{lead.name}</span>
                              <span style={{ fontSize: 10, color: sc.fg }}>●</span>
                            </div>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: T.textMuted, marginTop: 2 }}>
                              {lead.budget !== '—' ? lead.budget : ''} {lead.location !== '—' ? `· ${lead.location}` : ''} {lead.time ? `· ${lead.time}` : ''}
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 8, background: sc.bg, color: sc.fg, border: `1px solid ${sc.border}` }}>
                              {lead.status}
                            </span>
                            <span style={{ color: T.brass, fontSize: 12 }}>→</span>
                          </div>
                        </div>
                      )
                    })
                  ) : !loading && (
                    <div style={{ padding: '30px 0', textAlign: 'center', color: T.textMuted, fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                      No qualified leads captured in this date range.
                    </div>
                  )}
                </div>
              </Card>
            </section>

            {/* ── Compliance Strip ── */}
            <section style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '10px 16px', background: T.greenSoft, border: '1px solid rgba(79,190,135,0.25)', borderRadius: 14, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShieldCheck size={16} color={T.green} style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 11.5, color: T.green, fontWeight: 600 }}>
                  100% DND-Scrubbed · TRAI / DLT Registered · Call Consent Logged
                </span>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: T.green }}>
                Indian Telecom Compliant
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

      {/* Responsive Styles */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        
        .bento-kpi-grid {
          grid-template-columns: repeat(2, 1fr);
        }

        @media (min-width: 768px) {
          .desktop-tabs {
            display: flex !important;
          }
          .mobile-tabs-bar {
            display: none !important;
          }
          .bento-kpi-grid {
            grid-template-columns: repeat(4, 1fr) !important;
          }
        }
      `}</style>
    </div>
  )
}
