/**
 * ClientDashboard.tsx
 *
 * Authenticated Client Dashboard at /dashboard.
 * - Mobile-First High-Density Luxury Design
 * - Compact 52px sticky navbar with user profile dropdown sheet
 * - Single-row horizontal scrollable filter strip
 * - 2x2 Bento KPI Grid on mobile viewports
 * - High-density LeadDetailsDrawer integration
 */

import React, { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts'
import {
  PhoneCall, CalendarCheck, Trophy, UserCheck,
  Building2, Globe2, ShieldCheck, Calendar, RefreshCw,
  ChevronDown, AlertCircle, Clock, Phone,
  Sparkles, LogOut, User, X, Check, ArrowUpRight
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useClientDashboard, type LeadRow } from '@/hooks/useClientDashboard'
import { fetchAgents, setClientKey, type RasenAgent } from '@/lib/clientApi'
import LeadDetailsDrawer from '@/components/client/LeadDetailsDrawer'
import OutboundCampaignsView from '@/components/client/OutboundCampaignsView'
import TestCallStudioView from '@/components/client/TestCallStudioView'

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
      background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.01) 100%), rgba(18, 28, 45, 0.65)',
      border: '1px solid rgba(255, 255, 255, 0.10)',
      borderRadius: 20,
      padding: 'clamp(14px, 2.2vw, 24px)',
      boxShadow: '0 12px 40px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255, 255, 255, 0.12)',
      backdropFilter: 'blur(24px) saturate(180%)',
      WebkitBackdropFilter: 'blur(24px) saturate(180%)',
      ...style,
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
  const bg = tone === 'green' ? 'rgba(79, 190, 135, 0.15)' : tone === 'brass' ? 'rgba(229, 192, 123, 0.15)' : 'rgba(90, 108, 255, 0.15)'
  const iconBorder = tone === 'green' ? 'rgba(79, 190, 135, 0.3)' : tone === 'brass' ? 'rgba(229, 192, 123, 0.3)' : 'rgba(90, 108, 255, 0.3)'
  
  return (
    <div
      onClick={onClick}
      style={{
        background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.015) 100%), rgba(18, 28, 46, 0.65)',
        borderRadius: 18,
        padding: '14px 16px',
        border: '1px solid rgba(255, 255, 255, 0.10)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        boxShadow: '0 8px 30px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255, 255, 255, 0.14)',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        transition: 'transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
        cursor: onClick ? 'pointer' : 'default',
        position: 'relative',
        minHeight: 116,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'rgba(229, 192, 123, 0.5)'
        e.currentTarget.style.transform = 'translateY(-3px)'
        e.currentTarget.style.boxShadow = '0 16px 36px rgba(0,0,0,0.45), 0 0 20px rgba(229,192,123,0.15), inset 0 1px 0 rgba(255, 255, 255, 0.25)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.10)'
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255, 255, 255, 0.14)'
      }}
    >
      {/* Row 1: Icon on left, Badge cleanly on right */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: bg, border: `1px solid ${iconBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 2px 10px ${bg}` }}>
          <Icon size={16} color={fg} />
        </div>
        {badge && (
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            fontWeight: 700,
            color: fg,
            background: bg,
            border: `1px solid ${iconBorder}`,
            padding: '2px 8px',
            borderRadius: 7,
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
          fontSize: 'clamp(22px, 3.2vw, 30px)',
          color: fg,
          fontWeight: 800,
          lineHeight: 1.1,
          letterSpacing: '-0.02em',
          margin: '2px 0 2px',
        }}>
          {value}
        </div>
        <div style={{
          fontFamily: 'var(--font-body)',
          fontSize: 12.5,
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
          marginTop: 5,
          lineHeight: 1.3,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
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

// ── Main Authenticated Client Dashboard ──────────────────────────────────────

export default function ClientDashboard() {
  const { user, profile, logOut } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const clientQuery = searchParams.get('client') || 'wakilz_demo'
  const [activeTab, setActiveTab] = useState<'analytics' | 'outbound' | 'test_call'>('analytics')
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

  // Date filters
  const today = new Date().toISOString().slice(0, 10)
  const monthStart = today.slice(0, 7) + '-01'

  const [timePreset, setTimePreset] = useState<'1d' | '7d' | '30d' | 'month' | 'all' | 'custom'>('all')
  const [fromDate, setFromDate] = useState<string>('')
  const [toDate, setToDate] = useState<string>(today)

  const [agents, setAgents] = useState<RasenAgent[]>([])
  const [selectedAgentId, setSelectedAgentId] = useState<string>('')

  useEffect(() => {
    // If admin is viewing a specific client, update the global api key context
    if (profile?.role === 'admin' && clientQuery) {
      setClientKey(clientQuery)
    }
    
    fetchAgents()
      .then(res => {
        const sorted = [...res].sort((a, b) => {
          const dateA = new Date(a.published_at || (a as any).created_at || 0).getTime()
          const dateB = new Date(b.published_at || (b as any).created_at || 0).getTime()
          return dateB - dateA
        })
        setAgents(sorted)
        if (sorted.length > 0) {
          setSelectedAgentId(prev => {
            if (prev && sorted.some(a => a.id === prev)) return prev
            return sorted[0].id
          })
        }
      })
      .catch(err => console.error('Failed to fetch agents:', err))
  }, [clientQuery, profile?.role])

  // Selected agent name and domain checks
  const selectedAgent = agents.find(a => a.id === selectedAgentId)
  const isCsTurf = selectedAgent?.name === 'CS-turf'
  const isSportzone = selectedAgent?.name === 'Booking Agent'

  // Close profile dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Real data from backend
  const { data, loading, error, refresh } = useClientDashboard({
    startDate: fromDate,
    endDate: toDate,
    agentId: selectedAgentId,
    agentName: selectedAgent?.name,
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

  const handleLogout = async () => {
    await logOut()
    navigate('/signin', { replace: true })
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
  const clientDisplayName = profile?.displayName || user?.email?.split('@')[0] || 'Wakilz Client'

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
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, color: T.textSecondary }}>PORTAL</span>
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
              <span>📊</span> Analytics
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
              <span>📞</span> Outbound
            </button>

            <button
              id="tab-test-call"
              onClick={() => setActiveTab('test_call')}
              style={{
                background: activeTab === 'test_call' ? 'rgba(229, 192, 123, 0.14)' : 'transparent',
                color: activeTab === 'test_call' ? T.brass : T.textSecondary,
                border: activeTab === 'test_call' ? `1px solid ${T.brass}` : 'none',
                borderRadius: 9,
                padding: '5px 14px',
                fontSize: 12,
                fontWeight: activeTab === 'test_call' ? 700 : 400,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.15s',
              }}
            >
              <span>🧪</span> Test Call
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

            {/* Profile Avatar Button */}
            <div style={{ position: 'relative' }} ref={profileRef}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #2A3FE0, #5A6CFF)',
                  border: `1.5px solid ${T.brass}`,
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(42,63,224,0.4)',
                }}
              >
                {clientDisplayName[0].toUpperCase()}
              </button>

              {/* Profile Dropdown Sheet */}
              {profileOpen && (
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  width: 240,
                  background: T.surfaceElevated,
                  border: `1px solid ${T.borderStrong}`,
                  borderRadius: 14,
                  padding: 12,
                  boxShadow: '0 16px 36px rgba(0,0,0,0.6)',
                  zIndex: 100,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, paddingBottom: 10, borderBottom: `1px solid ${T.border}` }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #2A3FE0, #5A6CFF)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff' }}>
                      {clientDisplayName[0].toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: T.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {clientDisplayName}
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: T.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {user?.email || 'Authenticated'}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <button
                      onClick={handleLogout}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        background: T.redSoft,
                        border: '1px solid rgba(248,113,113,0.3)',
                        borderRadius: 8,
                        padding: '8px 12px',
                        color: T.red,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        width: '100%',
                        transition: 'all 0.15s',
                      }}
                    >
                      <LogOut size={13} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
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
            gridTemplateColumns: '1fr 1fr 1fr',
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
                gap: 4,
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
                gap: 4,
                boxShadow: activeTab === 'outbound' ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
              }}
            >
              <span>📞</span> Outbound
            </button>
            <button
              onClick={() => setActiveTab('test_call')}
              style={{
                background: activeTab === 'test_call' ? 'rgba(229, 192, 123, 0.14)' : 'transparent',
                color: activeTab === 'test_call' ? T.brass : T.textSecondary,
                border: activeTab === 'test_call' ? `1px solid ${T.brass}` : 'none',
                borderRadius: 9,
                padding: '6px',
                fontSize: 12,
                fontWeight: activeTab === 'test_call' ? 700 : 400,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                boxShadow: activeTab === 'test_call' ? '0 2px 8px rgba(229, 192, 123, 0.25)' : 'none',
              }}
            >
              <span>🧪</span> Test Call
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Container ── */}
      <main style={{ maxWidth: 1360, margin: '0 auto', padding: 'clamp(12px, 2vw, 24px) 16px' }}>

        {/* ── Error Banner ── */}
        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: T.redSoft, border: `1px solid rgba(248,113,113,0.3)`, borderRadius: 12, marginBottom: 14 }}>
            <AlertCircle size={16} color={T.red} style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.red }}>Connection Notice</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: T.textSecondary, marginTop: 1 }}>{error}</div>
            </div>
          </div>
        )}

        {/* ── 2. Unified Luxury Glassmorphic Scope Header (Visible on all tabs) ── */}
        <section style={{ marginBottom: 14 }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.015) 100%), rgba(16, 25, 42, 0.70)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: 16,
            padding: '6px 10px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 8px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255, 255, 255, 0.14)',
            backdropFilter: 'blur(24px) saturate(190%)',
            WebkitBackdropFilter: 'blur(24px) saturate(190%)',
          }}>
            {/* Left: Breadcrumb Scope Selector (Workspace › Agent) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
              
              {/* Workspace Pill */}
              {profile?.role === 'admin' ? (
                <div style={{
                  position: 'relative',
                  display: 'inline-flex',
                  alignItems: 'center',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  borderRadius: 10,
                  padding: '6px 10px',
                  gap: 6,
                  maxWidth: '48%',
                  flexShrink: 0,
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
                }}>
                  <Building2 size={13} color={T.brass} style={{ flexShrink: 0 }} />
                  <select
                    value={clientQuery}
                    onChange={e => setSearchParams({ client: e.target.value })}
                    style={{
                      appearance: 'none',
                      WebkitAppearance: 'none',
                      MozAppearance: 'none',
                      background: 'transparent',
                      border: 'none',
                      color: T.textPrimary,
                      fontSize: 12,
                      fontWeight: 700,
                      outline: 'none',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-body)',
                      padding: '0 14px 0 0',
                      width: '100%',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                    }}
                  >
                    <option value="wakilz_demo" style={{ background: '#162032', color: '#F3F0EA' }}>Test</option>
                    <option value="skyline_realty" style={{ background: '#162032', color: '#F3F0EA' }}>Skyline Realty</option>
                  </select>
                  <ChevronDown size={11} color={T.brass} style={{ position: 'absolute', right: 7, pointerEvents: 'none' }} />
                </div>
              ) : (
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  borderRadius: 10,
                  padding: '6px 10px',
                  gap: 6,
                  flexShrink: 0,
                }}>
                  <Building2 size={13} color={T.brass} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: T.textPrimary }}>Test</span>
                </div>
              )}

              {/* Breadcrumb Separator */}
              <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 14, fontWeight: 300, userSelect: 'none' }}>/</span>

              {/* Agent (Project) Pill */}
              <div style={{
                position: 'relative',
                display: 'inline-flex',
                alignItems: 'center',
                background: 'rgba(229,192,123,0.08)',
                border: '1px solid rgba(229,192,123,0.25)',
                borderRadius: 10,
                padding: '6px 10px',
                gap: 6,
                minWidth: 0,
                flex: 1,
                boxShadow: 'inset 0 1px 0 rgba(229,192,123,0.12)',
              }}>
                <Sparkles size={13} color={T.brass} style={{ flexShrink: 0 }} />
                <select
                  value={selectedAgentId}
                  onChange={e => setSelectedAgentId(e.target.value)}
                  style={{
                    appearance: 'none',
                    WebkitAppearance: 'none',
                    MozAppearance: 'none',
                    background: 'transparent',
                    border: 'none',
                    color: T.brass,
                    fontSize: 12,
                    fontWeight: 700,
                    outline: 'none',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-body)',
                    padding: '0 14px 0 0',
                    width: '100%',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                  }}
                >
                  {agents.length === 0 && (
                    <option value="" style={{ background: '#162032', color: '#F3F0EA' }}>
                      Select Agent
                    </option>
                  )}
                  {agents.map(a => (
                    <option key={a.id} value={a.id} style={{ background: '#162032', color: '#F3F0EA' }}>
                      {a.name}
                    </option>
                  ))}
                </select>
                <ChevronDown size={11} color={T.brass} style={{ position: 'absolute', right: 7, pointerEvents: 'none' }} />
              </div>
            </div>
          </div>
        </section>

        {/* TAB 1: ANALYTICS & LEADS */}
        {activeTab === 'analytics' && (
          <div>
            {/* Date Preset Segmented Bar (Horizontal Scroll Glass Bar) */}
            <section style={{ marginBottom: 14 }}>
              <div className="no-scrollbar" style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                overflowX: 'auto',
                padding: '6px 0 2px',
                WebkitOverflowScrolling: 'touch',
              }}>
                {([
                  { key: 'all', label: 'All Time ★', from: '' },
                  { key: '1d', label: '1D', from: today },
                  { key: '7d', label: '7D', from: new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10) },
                  { key: '30d', label: '30D', from: new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10) },
                  { key: 'month', label: 'This Month', from: today.slice(0, 7) + '-01' },
                  { key: 'custom', label: '📅 Custom', from: null },
                ] as const).map(p => {
                  const isActive = timePreset === p.key
                  return (
                    <button
                      key={p.key}
                      onClick={() => {
                        setTimePreset(p.key)
                        if (p.from !== null) { setFromDate(p.from); setToDate(today) }
                      }}
                      style={{
                        background: isActive
                          ? 'linear-gradient(135deg, rgba(229,192,123,0.22), rgba(229,192,123,0.08))'
                          : 'linear-gradient(145deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%), rgba(22,32,50,0.5)',
                        color: isActive ? T.brass : T.textSecondary,
                        border: `1px solid ${isActive ? 'rgba(229,192,123,0.55)' : 'rgba(255,255,255,0.09)'}`,
                        borderRadius: 10,
                        padding: '6px 14px',
                        fontSize: 11,
                        fontWeight: isActive ? 700 : 500,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                        boxShadow: isActive
                          ? '0 4px 16px rgba(229,192,123,0.25), inset 0 1px 0 rgba(255,255,255,0.2)'
                          : '0 2px 8px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.06)',
                        backdropFilter: 'blur(16px)',
                        WebkitBackdropFilter: 'blur(16px)',
                        height: 32,
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      {p.label}
                    </button>
                  )
                })}
              </div>

              {/* Expandable Custom Date Pickers when 'custom' is active */}
              {timePreset === 'custom' && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  background: 'linear-gradient(145deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%), rgba(18, 28, 45, 0.7)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: 14,
                  padding: '10px 14px',
                  marginTop: 6,
                  flexWrap: 'wrap',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                }}>
                  <div style={{ flex: '1 1 130px' }}>
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
                  <div style={{ flex: '1 1 130px' }}>
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
                  {isCsTurf ? (
                    <>
                      <StatCard
                        icon={PhoneCall}
                        label="Calls Dialed"
                        tone="default"
                        value={data.stats.totalCalls.toLocaleString('en-IN')}
                        sub={`${data.stats.answeredCalls} connected (${data.stats.connectRate}%)`}
                        badge="+15% wk"
                        onClick={() => openDrawer(
                          'All Outbound Calls',
                          `All ${data.stats.totalCalls} turf owner outreach calls in selected period`,
                          data.allLeads
                        )}
                      />

                      <StatCard
                        icon={Phone}
                        label="Pain Point Identified"
                        tone="green"
                        value={data.stats.qualifiedLeads.toLocaleString('en-IN')}
                        sub={`${data.stats.qualifiedRate}% admitted lost calls`}
                        badge="-15 to 25 calls"
                        onClick={() => openDrawer(
                          'Turf Owners With Missed Calls',
                          `${data.stats.qualifiedLeads} turf owners who admitted losing peak evening revenue to unmanaged calls`,
                          data.leads
                        )}
                      />

                      <StatCard
                        icon={CalendarCheck}
                        label="Software Demos Booked"
                        tone="brass"
                        value={data.stats.visitsBooked.toLocaleString('en-IN')}
                        sub={`${data.stats.visitBookedRate}% demo conversion`}
                        badge="High Intent"
                        onClick={() => openDrawer(
                          'Software Demos Booked',
                          `${data.stats.visitsBooked} confirmed 15-minute product walk-through slots`,
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
                          `${data.stats.conversations} completed outbound pitch calls with turf managers`,
                          data.allLeads.filter(l => l.durationSecs > 10)
                        )}
                      />
                    </>
                  ) : isSportzone ? (
                    <>
                      <StatCard
                        icon={PhoneCall}
                        label="Inbound Inquiries"
                        tone="default"
                        value={data.stats.totalCalls.toLocaleString('en-IN')}
                        sub={`${data.stats.answeredCalls} handled with 0s hold`}
                        badge="24/7 Live"
                        onClick={() => openDrawer(
                          'All Inbound Inquiries',
                          `All ${data.stats.totalCalls} callers seeking court availability`,
                          data.allLeads
                        )}
                      />

                      <StatCard
                        icon={CalendarCheck}
                        label="Playo Links Sent"
                        tone="green"
                        value={data.stats.visitsBooked.toLocaleString('en-IN')}
                        sub={`${data.stats.visitBookedRate}% link delivery rate`}
                        badge="Automated"
                        onClick={() => openDrawer(
                          'Playo Links Delivered',
                          `${data.stats.visitsBooked} direct payment and slot hold links dispatched via WhatsApp`,
                          data.allLeads.filter(l => l.status === 'Booked' || l.siteVisitSlot !== '—')
                        )}
                      />

                      <StatCard
                        icon={Trophy}
                        label="Gross Booking Value"
                        tone="brass"
                        value={`₹${(data.stats.visitsBooked * 1500).toLocaleString('en-IN')}`}
                        sub="Captured court revenue via AI"
                        badge="Direct Pay"
                        onClick={() => openDrawer(
                          'Confirmed Court Bookings',
                          `${data.stats.visitsBooked} court bookings captured across Box Cricket and Football`,
                          data.leads
                        )}
                      />

                      <StatCard
                        icon={Clock}
                        label="Night Calls Saved"
                        tone="accent"
                        value={data.stats.conversations.toLocaleString('en-IN')}
                        sub="Booked 8 PM – 2 AM with 0 staff"
                        badge="100% Uptime"
                        onClick={() => openDrawer(
                          'Late Night Calls Handled',
                          `${data.stats.conversations} inbound inquiries resolved outside of facility counter hours`,
                          data.allLeads.filter(l => l.durationSecs > 10)
                        )}
                      />
                    </>
                  ) : (
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
                        sub={data.stats.answeredCalls > 0 ? `${data.stats.qualifiedRate}% of connected` : '0 of 0 connected'}
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
                        sub={data.stats.qualifiedLeads > 0 ? `${data.stats.visitsBooked} of ${data.stats.qualifiedLeads} qualified` : '0 visits scheduled'}
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
                  )}
                </>
              ) : null}
            </section>

            {/* ── 4. Conversion Flow Funnel ── */}
            {(loading || (data && data.funnel.length > 0)) && (
              <section style={{ marginBottom: 20 }}>
                <Card id="funnel-card">
                  <SectionHeading
                    eyebrow={
                      isCsTurf ? 'Outbound Cold Calling Funnel' :
                      isSportzone ? '24/7 Inbound Court Booking Funnel' :
                      'Conversion Flow Diagnostics'
                    }
                    title={
                      isCsTurf ? 'Turf Owner Pitch & Demo Conversion' :
                      isSportzone ? 'Inbound Caller to Instant Playo Link' :
                      'Where the Lead Funnel Converts & Leaks'
                    }
                    description={
                      isCsTurf ? 'Real-time diagnostic trace from cold dialing to booked 15-minute software demos.' :
                      isSportzone ? 'Instant disambiguation of sport (Cricket vs Football), pricing, time slots, and WhatsApp link.' :
                      'End-to-end trace from first AI voice outreach to confirmed site visits.'
                    }
                    rightAction={data && (
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: T.green, background: T.greenSoft, padding: '3px 8px', borderRadius: 10, fontWeight: 600 }}>
                        {maxFunnelVal > 0 ? (
                          isCsTurf ? `${((data.stats.visitsBooked / maxFunnelVal) * 100).toFixed(1)}% Demo Rate` :
                          isSportzone ? `${((data.stats.visitsBooked / maxFunnelVal) * 100).toFixed(1)}% Link Rate` :
                          `${((data.stats.visitsBooked / maxFunnelVal) * 100).toFixed(1)}% Visit Rate`
                        ) : '—'}
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
                <SectionHeading
                  eyebrow={
                    isCsTurf ? 'Outbound Velocity' :
                    isSportzone ? 'Booking Velocity' :
                    'Performance Velocity'
                  }
                  title={
                    isCsTurf ? 'Calls vs Demos Booked' :
                    isSportzone ? 'Inquiries vs Playo Links' :
                    'Conversations vs Visits'
                  }
                  description={
                    isCsTurf ? 'Weekly pace of cold outreach calls vs confirmed product demo slots.' :
                    isSportzone ? 'Hourly & weekly pace of incoming inquiries vs automated Playo payment links.' :
                    'Weekly pace of AI outreach vs confirmed visit slots.'
                  }
                />
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
                          <Area type="monotone" dataKey="conversations" name={isSportzone ? "Inquiries" : "Conversations"} stroke={T.accentGlow} fill="url(#convGrad)" strokeWidth={2} />
                          <Area type="monotone" dataKey="bookings" name={isCsTurf ? "Demos Booked" : isSportzone ? "Playo Links" : "Visits Booked"} stroke={T.brass} fill="url(#bookGrad)" strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                    <div style={{ display: 'flex', gap: 12, marginTop: 6, justifyContent: 'flex-end' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: T.accentGlow, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.accentGlow }} />
                        {isSportzone ? "Inquiries" : "Conversations"}
                      </span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: T.brass, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.brass }} />
                        {isCsTurf ? "Demos" : isSportzone ? "Playo Links" : "Visits"}
                      </span>
                    </div>
                  </>
                ) : (
                  <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textMuted, fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                    No trend data for this period
                  </div>
                )}
              </Card>

              <Card id="drop-reasons-chart">
                <SectionHeading
                  eyebrow={
                    isCsTurf ? 'Objection Breakdown' :
                    isSportzone ? 'Unbooked Inquiries' :
                    'Root Cause Analysis'
                  }
                  title={
                    isCsTurf ? 'Why Turf Owners Say No' :
                    isSportzone ? "Why Callers Didn't Book" :
                    'Call Drop Breakdown'
                  }
                  description={
                    isCsTurf ? 'Primary gatekeeper and price resistance reasons logged during cold calls.' :
                    isSportzone ? 'Primary reasons an inbound caller dropped without requesting a payment link.' :
                    'Where and why conversations end without a visit booking.'
                  }
                />
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
                  eyebrow={
                    isCsTurf ? 'B2B Turf Pipeline' :
                    isSportzone ? 'Live Court Bookings' :
                    'Live Buyer Pipeline'
                  }
                  title={
                    isCsTurf ? 'Recent Turf Owner Leads' :
                    isSportzone ? 'Recent Court Inquiries' :
                    'Recent Qualified Leads'
                  }
                  description={
                    isCsTurf ? 'Extracted turf manager intents & booking audit notes. Tap any lead to inspect audio & transcript.' :
                    isSportzone ? 'Extracted player requests with sport, court slot, and instant WhatsApp link. Tap to inspect.' :
                    'Extracted from call transcripts. Tap any lead to inspect audio & transcript.'
                  }
                  rightAction={data && (
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: T.textMuted }}>
                      {data.leads.length} {isCsTurf ? 'turf leads' : isSportzone ? 'inquiries' : 'leads'} · Tap to inspect
                    </span>
                  )}
                />

                {/* Mobile Cards Mode (< 768px) */}
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
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: T.textMuted, marginTop: 2, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                              <span>{lead.budget !== '—' ? lead.budget : ''} {lead.location !== '—' ? `· ${lead.location}` : ''} {lead.time ? `· ${lead.time}` : ''}</span>
                              {isSportzone && lead.phone && lead.phone !== '—' && (
                                <a
                                  href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}?text=Hi%20${encodeURIComponent(lead.name)},%20here%20is%20your%20Sportzone%20Arena%20booking%20link:`}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={e => e.stopPropagation()}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 3,
                                    padding: '1px 6px',
                                    borderRadius: 6,
                                    background: 'rgba(79, 190, 135, 0.15)',
                                    border: '1px solid rgba(79, 190, 135, 0.3)',
                                    color: T.green,
                                    fontSize: 10,
                                    fontWeight: 600,
                                    textDecoration: 'none',
                                  }}
                                >
                                  💬 WhatsApp Link
                                </a>
                              )}
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
                      {isCsTurf ? 'No turf leads captured in this date range.' :
                       isSportzone ? 'No court inquiries captured in this date range.' :
                       'No qualified leads captured in this date range.'}
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
                  {isSportzone
                    ? 'Instant WhatsApp Booking Link · 24/7 Voice Automated · Direct Playo Integration'
                    : isCsTurf
                    ? '100% DND-Scrubbed · B2B Outreach Registered · Call Consent Logged'
                    : '100% DND-Scrubbed · TRAI / DLT Registered · Call Consent Logged'}
                </span>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: T.green }}>
                {isSportzone ? 'Arena Booking Automated' : 'Indian Telecom Compliant'}
              </span>
            </section>
          </div>
        )}

        {/* TAB 2: OUTBOUND CAMPAIGNS */}
        {activeTab === 'outbound' && (
          <OutboundCampaignsView />
        )}

        {/* TAB 3: TEST CALL STUDIO */}
        {activeTab === 'test_call' && (
          <TestCallStudioView userRole={profile?.role} selectedAgentId={selectedAgentId} />
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
