import { useState, useEffect, useCallback } from 'react'
import { useNavigate, Link } from 'react-router'
import { useAuth } from '@/contexts/AuthContext'
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import {
  LayoutDashboard, Users, Phone, Settings,
  LogOut, Bell, TrendingUp, Target, PhoneCall,
  ChevronRight, BarChart2, Download, RefreshCw, Search,
  CheckCircle, AlertCircle, Eye,
  Calendar, MapPin, Home, DollarSign, Globe, Menu, X, Activity
} from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────────────

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
}

interface FirestoreClient {
  id: string
  displayName?: string
  email?: string
  role?: string
  clientId?: string
}

// ── Config ───────────────────────────────────────────────────────────────────

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://peshimaammuzammil-sky49.hf.space'
const API_KEY  = import.meta.env.VITE_CONVERSATIONS_API_KEY || ''

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
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
}

const OUTCOME_COLORS: Record<string, string> = {
  lead_captured: '#4FBE87',
  partial_lead:  '#F5A623',
  no_lead:       '#9BA3AF',
  hung_up_early: '#EF4444',
}
const OUTCOME_LABELS: Record<string, string> = {
  lead_captured: 'Lead',
  partial_lead:  'Partial',
  no_lead:       'No Lead',
  hung_up_early: 'Hung Up',
}

// ── Mini Components ───────────────────────────────────────────────────────────

function OutcomeDot({ outcome }: { outcome: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      padding: '3px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 600,
      background: `${OUTCOME_COLORS[outcome] || '#9BA3AF'}18`,
      color: OUTCOME_COLORS[outcome] || '#9BA3AF',
      fontFamily: "'IBM Plex Mono', monospace", whiteSpace: 'nowrap',
    }}>
      <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'currentColor', flexShrink: 0 }} />
      {OUTCOME_LABELS[outcome] || outcome}
    </span>
  )
}

function LeadScoreBadge({ score }: { score: number }) {
  const color = score >= 70 ? '#4FBE87' : score >= 40 ? '#F0B429' : '#EF4444'
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: '36px', height: '20px', borderRadius: '4px',
      background: `${color}20`, color, fontSize: '11px', fontWeight: 700,
      fontFamily: "'IBM Plex Mono', monospace",
    }}>
      {score}
    </span>
  )
}

function OutcomeBar({ conversations }: { conversations: Conversation[] }) {
  const total = conversations.length
  if (total === 0) return <div style={{ color: '#4E6080', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>No data yet</div>

  const groups = [
    { key: 'lead_captured', label: 'Lead',    color: '#4FBE87' },
    { key: 'partial_lead',  label: 'Partial', color: '#F5A623' },
    { key: 'no_lead',       label: 'No Lead', color: '#4E6080' },
    { key: 'hung_up_early', label: 'Hung Up', color: '#EF4444' },
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', borderRadius: '6px', overflow: 'hidden', height: '10px', gap: '2px' }}>
        {groups.map(({ key, color }) => {
          const pct = (conversations.filter(c => c.outcome === key).length / total) * 100
          return pct > 0 ? <div key={key} style={{ width: `${pct}%`, background: color }} title={`${key}: ${pct.toFixed(0)}%`} /> : null
        })}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        {groups.map(({ key, label, color }) => {
          const count = conversations.filter(c => c.outcome === key).length
          const pct = total > 0 ? ((count / total) * 100).toFixed(0) : 0
          return (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '7px', height: '7px', borderRadius: '2px', background: color, flexShrink: 0 }} />
              <span style={{ fontSize: '11px', color: '#9BA3AF', flex: 1 }}>{label}</span>
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#F3F0EA', fontFamily: "'IBM Plex Mono', monospace" }}>
                {count} <span style={{ color: '#4E6080' }}>({pct}%)</span>
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function CallsSparkline({ conversations }: { conversations: Conversation[] }) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i))
    const dateStr = d.toISOString().slice(0, 10)
    return { date: d.toLocaleDateString('en-IN', { weekday: 'short' }), count: conversations.filter(c => c.call_date === dateStr).length }
  })
  const max = Math.max(...days.map(d => d.count), 1)
  const W = 260, H = 60, PAD = 8
  const points = days.map((d, i) => ({
    x: PAD + (i / 6) * (W - PAD * 2),
    y: H - PAD - ((d.count / max) * (H - PAD * 2)),
    ...d,
  }))
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
  const areaD = `${pathD} L ${points[points.length - 1].x.toFixed(1)} ${H} L ${points[0].x.toFixed(1)} ${H} Z`
  return (
    <div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5A6CFF" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#5A6CFF" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaD} fill="url(#sparkGrad)" />
        <path d={pathD} fill="none" stroke="#5A6CFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => p.count > 0 ? <circle key={i} cx={p.x} cy={p.y} r={3} fill="#5A6CFF" /> : null)}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
        {days.map((d, i) => (
          <span key={i} style={{ fontSize: '10px', color: '#4E6080', fontFamily: "'IBM Plex Mono', monospace" }}>{d.date}</span>
        ))}
      </div>
    </div>
  )
}

function BudgetChart({ conversations }: { conversations: Conversation[] }) {
  const tiers = ['ultra_luxury', 'luxury', 'premium', 'affordable', 'budget']
  const labels: Record<string, string> = { ultra_luxury: 'Ultra Lux', luxury: 'Luxury', premium: 'Premium', affordable: 'Affordable', budget: 'Budget' }
  const colors = ['#E05AFF', '#5A6CFF', '#4FBE87', '#F5A623', '#9BA3AF']
  const total = conversations.filter(c => c.budget_tier).length
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {tiers.map((tier, i) => {
        const count = conversations.filter(c => c.budget_tier === tier).length
        const pct = total > 0 ? (count / total) * 100 : 0
        return count > 0 ? (
          <div key={tier} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', color: '#9BA3AF', minWidth: '60px', fontFamily: "'IBM Plex Mono', monospace" }}>{labels[tier]}</span>
            <div style={{ flex: 1, height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.06)' }}>
              <div style={{ width: `${pct}%`, height: '100%', borderRadius: '3px', background: colors[i] }} />
            </div>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#F3F0EA', minWidth: '20px', textAlign: 'right', fontFamily: "'IBM Plex Mono', monospace" }}>{count}</span>
          </div>
        ) : null
      })}
    </div>
  )
}

type NavKey = 'overview' | 'calls' | 'clients' | 'settings'

const NAV: { key: NavKey; icon: typeof LayoutDashboard; label: string }[] = [
  { key: 'overview', icon: LayoutDashboard, label: 'Overview'  },
  { key: 'calls',    icon: PhoneCall,        label: 'All Calls' },
  { key: 'clients',  icon: Users,            label: 'Clients'   },
  { key: 'settings', icon: Settings,         label: 'Settings'  },
]

// ── Responsive styles ─────────────────────────────────────────────────────────

const RESPONSIVE_CSS = `
  .adm-root { display: flex; height: 100vh; overflow: hidden; background: #0C1524; font-family: 'Inter', sans-serif; }

  /* Sidebar */
  .adm-sidebar {
    width: 220px; height: 100vh; flex-shrink: 0;
    background: #0f1b2d; border-right: 1px solid rgba(255,255,255,0.07);
    display: grid; grid-template-rows: auto 1fr auto;
    transition: transform 0.25s ease;
    z-index: 200;
  }
  .adm-overlay {
    display: none; position: fixed; inset: 0;
    background: rgba(0,0,0,0.6); backdrop-filter: blur(2px);
    z-index: 199;
  }
  .adm-overlay.open { display: block; }

  /* Main */
  .adm-main { flex: 1; overflow-y: auto; padding: 28px 32px; box-sizing: border-box; }

  /* Mobile topbar */
  .adm-mobile-topbar {
    display: none; align-items: center; gap: 12px;
    padding: 14px 16px; background: #0f1b2d;
    border-bottom: 1px solid rgba(255,255,255,0.07);
    position: sticky; top: 0; z-index: 100;
  }
  .adm-hamburger {
    display: flex; align-items: center; justify-content: center;
    width: 36px; height: 36px; border-radius: 8px;
    border: 1px solid rgba(255,255,255,0.10);
    background: transparent; color: #9BA3AF; cursor: pointer;
    flex-shrink: 0;
  }

  /* KPI grid */
  .adm-kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }

  /* Charts grid */
  .adm-chart-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; }

  /* Overview bottom grid */
  .adm-bottom-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 14px; }

  /* Side stats stack */
  .adm-side-stack { display: flex; flex-direction: column; gap: 14px; }

  /* Calls table cols */
  .adm-table-row { display: grid; grid-template-columns: 1fr 130px 110px 90px 70px 90px 60px 44px; padding: 12px 16px; align-items: center; }
  .adm-table-header { display: grid; grid-template-columns: 1fr 130px 110px 90px 70px 90px 60px 44px; padding: 10px 16px; }
  .adm-col-loc, .adm-col-prop, .adm-col-budget, .adm-col-lang, .adm-col-eye { }

  /* Spinner */
  .admin-spinner {
    width: 16px; height: 16px; border-radius: 50%;
    border: 2px solid rgba(90,108,255,0.2);
    border-top-color: #5A6CFF;
    animation: admin-spin 0.7s linear infinite;
    flex-shrink: 0;
  }
  @keyframes admin-spin { to { transform: rotate(360deg); } }

  /* Card base */
  .adm-card {
    background: #0f1b2d;
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 16px; padding: 20px;
  }

  /* Section label */
  .adm-label {
    font-size: 11px; font-weight: 600; color: #4E6080;
    letter-spacing: 0.08em; text-transform: uppercase;
    font-family: 'IBM Plex Mono', monospace; margin-bottom: 14px;
  }

  /* Nav button hover */
  .adm-nav-btn:hover { background: rgba(255,255,255,0.05) !important; }

  /* ── Tablet (≤ 1024px) ── */
  @media (max-width: 1024px) {
    .adm-kpi-grid { grid-template-columns: repeat(2, 1fr); }
    .adm-chart-grid { grid-template-columns: 1fr 1fr; }
    .adm-bottom-grid { grid-template-columns: 1fr; }
    .adm-sidebar { width: 200px; }
    .adm-main { padding: 24px 24px; }
  }

  /* ── Mobile (≤ 768px) ── */
  @media (max-width: 768px) {
    .adm-root { flex-direction: column; height: auto; overflow: visible; }
    .adm-sidebar {
      position: fixed; top: 0; left: 0; bottom: 0;
      width: 260px; transform: translateX(-100%);
    }
    .adm-sidebar.open { transform: translateX(0); }
    .adm-mobile-topbar { display: flex; }
    .adm-main {
      padding: 16px; flex: 1;
      min-height: calc(100vh - 65px);
    }
    .adm-kpi-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
    .adm-chart-grid { grid-template-columns: 1fr; gap: 12px; }
    .adm-bottom-grid { grid-template-columns: 1fr; gap: 12px; }
    .adm-side-stack { gap: 12px; }

    /* Calls table — card style on mobile */
    .adm-table-header { display: none; }
    .adm-table-row {
      display: flex; flex-direction: column; gap: 8px;
      padding: 14px 14px; border-radius: 10px;
      border: 1px solid rgba(255,255,255,0.06) !important;
      margin: 0 10px 8px; background: rgba(255,255,255,0.02);
    }
    .adm-table-row-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
    .adm-table-row-mid { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .adm-col-loc, .adm-col-prop, .adm-col-budget, .adm-col-lang, .adm-col-eye { display: none; }

    /* Settings grid */
    .adm-settings-grid { grid-template-columns: 1fr !important; }

    /* Header buttons */
    .adm-header-actions { gap: 6px !important; }
    .adm-header-actions .adm-notif-btn { display: none; }
    .adm-header-actions .adm-refresh-btn span { display: none; }
    .adm-header-actions .adm-refresh-btn { padding: 8px 10px !important; }

    /* Client table */
    .adm-client-row { grid-template-columns: 1fr 80px !important; }
    .adm-client-col-email, .adm-client-col-id { display: none; }
  }

  /* ── Small mobile (≤ 420px) ── */
  @media (max-width: 420px) {
    .adm-kpi-grid { grid-template-columns: 1fr; }
    .adm-card { padding: 16px; }
    .adm-main { padding: 12px; }
  }
`

// ── Main Component ────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const { profile, logOut } = useAuth()
  const navigate = useNavigate()
  const [activeNav, setActiveNav] = useState<NavKey>('overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  const [clients, setClients] = useState<FirestoreClient[]>([])
  const [clientsLoading, setClientsLoading] = useState(false)

  const [search, setSearch] = useState('')
  const [outcomeFilter, setOutcomeFilter] = useState('')

  const initials = (profile?.displayName || profile?.email || 'A')[0].toUpperCase()

  const handleLogout = async () => { await logOut(); navigate('/', { replace: true }) }

  const closeSidebar = () => setSidebarOpen(false)

  const handleNavClick = (key: NavKey) => {
    setActiveNav(key)
    closeSidebar()
  }

  const fetchConversations = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const res = await fetch(`${API_BASE}/api/conversations?page_size=200`, { headers: apiHeaders() })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setConversations(data.conversations || [])
      setLastRefresh(new Date())
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally { setLoading(false) }
  }, [])

  const fetchClients = useCallback(async () => {
    setClientsLoading(true)
    try {
      const snap = await getDocs(query(collection(db, 'users'), orderBy('email'), limit(50)))
      setClients(snap.docs.map(d => ({ id: d.id, ...d.data() as Omit<FirestoreClient, 'id'> })))
    } catch { setClients([]) } finally { setClientsLoading(false) }
  }, [])

  useEffect(() => { fetchConversations(); fetchClients() }, [fetchConversations, fetchClients])

  // Close sidebar on ESC
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') closeSidebar() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const totalCalls = conversations.length
  const leadsCaptured = conversations.filter(c => c.outcome === 'lead_captured').length
  const visitsBooked = conversations.filter(c => c.intent_signals?.ready_to_visit).length
  const avgScore = totalCalls > 0 ? Math.round(conversations.reduce((s, c) => s + (c.lead_score || 0), 0) / totalCalls) : 0
  const conversionRate = totalCalls > 0 ? ((leadsCaptured / totalCalls) * 100).toFixed(1) : '0.0'

  const filteredCalls = conversations.filter(c => {
    const matchOutcome = !outcomeFilter || c.outcome === outcomeFilter
    const q = search.toLowerCase()
    const matchSearch = !search || (
      c.lead_name?.toLowerCase().includes(q) ||
      c.city_preference?.toLowerCase().includes(q) ||
      c.property_type?.toLowerCase().includes(q) ||
      c.session_id?.toLowerCase().includes(q)
    )
    return matchOutcome && matchSearch
  })

  const handleExport = () => {
    const headers = ['Session ID','Date','Lead Name','City','Property Type','Budget','Budget Tier','Language','Outcome','Lead Score','Duration (s)']
    const rows = conversations.map(c => [c.session_id, c.call_date, c.lead_name||'', c.city_preference||'', c.property_type||'', c.budget||'', c.budget_tier||'', c.language, c.outcome, c.lead_score, c.call_duration_secs??''])
    const csv = [headers,...rows].map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
    const a = Object.assign(document.createElement('a'), { href: url, download: `wakilz-leads-${new Date().toISOString().slice(0,10)}.csv` })
    a.click(); URL.revokeObjectURL(url)
  }

  // ── Sidebar content (shared between desktop & mobile) ─────────────────────

  const SidebarContent = () => (
    <>
      {/* Brand */}
      <div style={{ padding: '18px 16px 14px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
            <img src="/assets/images/logo.png" alt="wakilz"
              style={{ height: '20px', objectFit: 'contain', flexShrink: 0 }}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '17px', color: '#F3F0EA', letterSpacing: '-0.02em' }}>
              wakilz
            </span>
          </div>
          {/* Close button on mobile */}
          <button onClick={closeSidebar} className="adm-close-btn" style={{
            display: 'none', // shown only on mobile via media query handled by class
            background: 'none', border: 'none', color: '#9BA3AF', cursor: 'pointer', padding: '4px',
          }}>
            <X size={18} />
          </button>
        </div>
        <span style={{
          display: 'inline-flex', alignItems: 'center', marginTop: '10px',
          padding: '3px 10px', borderRadius: '5px',
          background: 'rgba(90,108,255,0.15)',
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '10px', fontWeight: 600, color: '#5A6CFF', letterSpacing: '0.1em',
        }}>ADMIN</span>
      </div>

      {/* Nav */}
      <div style={{ padding: '10px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {NAV.map(({ key, icon: Icon, label }) => {
          const active = activeNav === key
          return (
            <button key={key} className="adm-nav-btn" onClick={() => handleNavClick(key)} style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              width: '100%', padding: '10px 12px', borderRadius: '8px', border: 'none',
              background: active ? 'rgba(90,108,255,0.15)' : 'transparent',
              color: active ? '#7C8FFF' : '#9BA3AF',
              fontSize: '13px', fontWeight: active ? 600 : 400,
              cursor: 'pointer', textAlign: 'left',
              fontFamily: "'Inter', sans-serif", boxSizing: 'border-box',
              transition: 'background 0.15s, color 0.15s',
            }}>
              <Icon size={14} style={{ flexShrink: 0 }} />
              {label}
              {active && <ChevronRight size={12} style={{ marginLeft: 'auto' }} />}
            </button>
          )
        })}

        <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <Link to="/conversations" onClick={closeSidebar} style={{
            textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px',
            padding: '10px 12px', borderRadius: '8px', color: '#9BA3AF', fontSize: '13px',
          }}
            onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.04)'}
            onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'}
          >
            <BarChart2 size={14} style={{ flexShrink: 0 }} />
            Conversations
          </Link>
        </div>
      </div>

      {/* User footer */}
      <div style={{ padding: '14px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '10px', overflow: 'hidden' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, #2A3FE0, #7C8FFF)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '13px', fontWeight: 700, color: '#fff',
          }}>{initials}</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#F3F0EA', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {profile?.displayName || 'Admin'}
            </div>
            <div style={{ fontSize: '10px', color: '#4E6080', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: "'IBM Plex Mono', monospace" }}>
              {profile?.email}
            </div>
          </div>
        </div>
        <button onClick={handleLogout} style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          width: '100%', padding: '8px 12px', borderRadius: '8px',
          border: '1px solid rgba(255,255,255,0.10)',
          background: 'transparent', color: '#9BA3AF',
          fontSize: '12px', cursor: 'pointer',
          fontFamily: "'Inter', sans-serif", boxSizing: 'border-box',
          transition: 'background 0.15s, color 0.15s',
        }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.08)'; (e.currentTarget as HTMLButtonElement).style.color = '#ff6b7a' }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#9BA3AF' }}
        >
          <LogOut size={12} /> Sign out
        </button>
      </div>
    </>
  )

  // ── Overview ──────────────────────────────────────────────────────────────

  const renderOverview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* KPI cards */}
      <div className="adm-kpi-grid">
        {[
          { label: 'Total Calls',    value: loading ? '…' : totalCalls.toString(),       icon: PhoneCall,  color: '#5A6CFF', sub: 'All time' },
          { label: 'Lead Captures',  value: loading ? '…' : leadsCaptured.toString(),    icon: Target,     color: '#4FBE87', sub: `${conversionRate}% rate` },
          { label: 'Visits Booked',  value: loading ? '…' : visitsBooked.toString(),     icon: Calendar,   color: '#F5A623', sub: 'Ready to visit' },
          { label: 'Avg Lead Score', value: loading ? '…' : avgScore.toString(),          icon: TrendingUp, color: '#E05AFF', sub: 'Out of 100' },
        ].map(({ label, value, icon: Icon, color, sub }) => (
          <div key={label} className="adm-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <span style={{ fontSize: '11px', color: '#9BA3AF', fontFamily: "'IBM Plex Mono', monospace" }}>{label}</span>
              <div style={{ width: '32px', height: '32px', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${color}22`, flexShrink: 0 }}>
                <Icon size={13} color={color} />
              </div>
            </div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '28px', fontWeight: 700, color: '#F3F0EA', lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: '11px', color: '#4E6080', marginTop: '6px' }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="adm-chart-grid">
        <div className="adm-card">
          <div className="adm-label">Outcome Distribution</div>
          {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}><div className="admin-spinner" /></div> : <OutcomeBar conversations={conversations} />}
        </div>
        <div className="adm-card">
          <div className="adm-label">Calls — Last 7 Days</div>
          {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}><div className="admin-spinner" /></div> : <CallsSparkline conversations={conversations} />}
        </div>
        <div className="adm-card">
          <div className="adm-label">Budget Tiers</div>
          {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}><div className="admin-spinner" /></div> : <BudgetChart conversations={conversations} />}
        </div>
      </div>

      {/* Bottom grid */}
      <div className="adm-bottom-grid">
        {/* Recent calls */}
        <div className="adm-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div className="adm-label" style={{ marginBottom: 0 }}>Recent Calls</div>
            <button onClick={() => setActiveNav('calls')} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: '#5A6CFF', fontSize: '12px', cursor: 'pointer' }}>
              View all <ChevronRight size={12} />
            </button>
          </div>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#4E6080', fontSize: 13, padding: '16px 0' }}><div className="admin-spinner" /> Loading…</div>
          ) : error ? (
            <div style={{ color: '#EF4444', fontSize: 13 }}>⚠ {error}</div>
          ) : conversations.length === 0 ? (
            <div style={{ color: '#4E6080', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>No conversations yet</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {conversations.slice(0, 6).map(c => (
                <Link key={c.session_id} to={`/conversations/${c.session_id}`} style={{ textDecoration: 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 10px', borderRadius: '9px', cursor: 'pointer', transition: 'background 0.12s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.04)'}
                    onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}
                  >
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0, background: `${OUTCOME_COLORS[c.outcome]||'#9BA3AF'}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: OUTCOME_COLORS[c.outcome]||'#9BA3AF' }}>
                      {(c.lead_name||'U')[0].toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#F3F0EA', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.lead_name || 'Unknown'}</div>
                      <div style={{ fontSize: '11px', color: '#4E6080', display: 'flex', gap: '6px', marginTop: '2px' }}>
                        {c.city_preference && <span>{c.city_preference}</span>}
                        <span>· {formatDuration(c.call_duration_secs)}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px', flexShrink: 0 }}>
                      <OutcomeDot outcome={c.outcome} />
                      <span style={{ fontSize: '10px', color: '#4E6080', fontFamily: "'IBM Plex Mono', monospace" }}>{formatRelativeTime(c.call_start_iso)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right side stats */}
        <div className="adm-side-stack">
          <div className="adm-card">
            <div className="adm-label">Intent Signals</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { label: 'Ready to Visit',    value: conversations.filter(c => c.intent_signals?.ready_to_visit).length,                    color: '#4FBE87', Icon: CheckCircle },
                { label: 'Callback Agreed',   value: conversations.filter(c => c.intent_signals?.callback_agreed).length,                   color: '#5A6CFF', Icon: Phone      },
                { label: 'Objections',         value: conversations.filter(c => c.intent_signals?.objection_detected).length,               color: '#F5A623', Icon: AlertCircle },
                { label: 'Agent Requested',    value: conversations.filter(c => c.intent_signals?.agent_escalation_requested).length,       color: '#E05AFF', Icon: Users       },
              ].map(({ label, value, color, Icon }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                  <Icon size={13} color={color} style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: '12px', color: '#9BA3AF', flex: 1 }}>{label}</span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color, fontFamily: "'IBM Plex Mono', monospace" }}>{loading ? '…' : value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="adm-card">
            <div className="adm-label">Top Cities</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(() => {
                const cc: Record<string,number> = {}
                conversations.forEach(c => { if (c.city_preference) cc[c.city_preference] = (cc[c.city_preference]||0)+1 })
                const entries = Object.entries(cc).sort((a,b) => b[1]-a[1]).slice(0,4)
                return entries.length > 0 ? entries.map(([city, count]) => (
                  <div key={city} style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                    <MapPin size={11} color="#4E6080" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: '12px', color: '#9BA3AF', flex: 1 }}>{city}</span>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#F3F0EA', fontFamily: "'IBM Plex Mono', monospace" }}>{count}</span>
                  </div>
                )) : <span style={{ fontSize: 12, color: '#4E6080' }}>No data yet</span>
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  // ── All Calls ─────────────────────────────────────────────────────────────

  const renderCalls = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Filter bar */}
      <div className="adm-card" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 14px', borderRadius: '12px', flexWrap: 'wrap' }}>
        <Search size={13} color="#4E6080" style={{ flexShrink: 0 }} />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search name, city, property…"
          style={{ flex: 1, minWidth: '120px', background: 'none', border: 'none', outline: 'none', color: '#F3F0EA', fontSize: '13px', fontFamily: "'Inter', sans-serif" }} />
        <select value={outcomeFilter} onChange={e => setOutcomeFilter(e.target.value)}
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '8px', color: '#9BA3AF', fontSize: '11px', padding: '5px 8px', cursor: 'pointer', outline: 'none', fontFamily: "'IBM Plex Mono', monospace" }}>
          <option value="">All Outcomes</option>
          <option value="lead_captured">Lead Captured</option>
          <option value="partial_lead">Partial Lead</option>
          <option value="no_lead">No Lead</option>
          <option value="hung_up_early">Hung Up</option>
        </select>
        <button onClick={handleExport} disabled={!conversations.length}
          style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '8px', background: 'rgba(90,108,255,0.12)', border: '1px solid rgba(90,108,255,0.25)', color: '#7C8FFF', fontSize: '11px', cursor: 'pointer', fontWeight: 600, fontFamily: "'IBM Plex Mono', monospace", whiteSpace: 'nowrap' }}>
          <Download size={11} /> CSV
        </button>
        <span style={{ fontSize: '11px', color: '#4E6080', fontFamily: "'IBM Plex Mono', monospace", whiteSpace: 'nowrap' }}>{filteredCalls.length} results</span>
      </div>

      {/* Table */}
      <div style={{ background: '#0f1b2d', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', overflow: 'hidden' }}>
        {/* Desktop header */}
        <div className="adm-table-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
          {['Lead', 'Location', 'Property', 'Budget', 'Lang', 'Outcome', 'Score', ''].map(h => (
            <div key={h} style={{ fontSize: '10px', fontWeight: 600, color: '#4E6080', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: "'IBM Plex Mono', monospace" }}>{h}</div>
          ))}
        </div>

        <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '28px 16px', color: '#4E6080' }}><div className="admin-spinner" /> Loading…</div>
          ) : filteredCalls.length === 0 ? (
            <div style={{ padding: '36px', textAlign: 'center', color: '#4E6080', fontSize: 13 }}>{error ? `⚠ ${error}` : 'No calls match'}</div>
          ) : filteredCalls.map((c, i) => (
            <Link key={c.session_id} to={`/conversations/${c.session_id}`} style={{ textDecoration: 'none', display: 'block' }}>
              {/* Desktop row */}
              <div className="adm-table-row" style={{ borderBottom: i < filteredCalls.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', cursor: 'pointer', transition: 'background 0.12s' }}
                onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.03)'}
                onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}
              >
                {/* Lead col */}
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#F3F0EA', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.lead_name || 'Unknown'}
                  </div>
                  <div style={{ fontSize: '11px', color: '#4E6080', fontFamily: "'IBM Plex Mono', monospace", marginTop: '2px' }}>
                    {formatRelativeTime(c.call_start_iso)} · {formatDuration(c.call_duration_secs)}
                  </div>
                  {/* Mobile-only extras */}
                  <div className="adm-table-row-mid" style={{ display: 'none' }}>
                    <OutcomeDot outcome={c.outcome} />
                    {c.city_preference && <span style={{ fontSize: '11px', color: '#4E6080' }}>📍 {c.city_preference}</span>}
                    <LeadScoreBadge score={c.lead_score} />
                  </div>
                </div>
                {/* Desktop-only cols */}
                <div className="adm-col-loc" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {c.city_preference ? <><MapPin size={10} color="#4E6080" /><span style={{ fontSize: '12px', color: '#9BA3AF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.city_preference}</span></> : <span style={{ color: '#4E6080', fontSize: 11 }}>—</span>}
                </div>
                <div className="adm-col-prop" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {c.property_type ? <><Home size={10} color="#4E6080" /><span style={{ fontSize: '12px', color: '#9BA3AF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.property_type}</span></> : <span style={{ color: '#4E6080', fontSize: 11 }}>—</span>}
                </div>
                <div className="adm-col-budget">
                  {c.budget ? <span style={{ fontSize: '11px', color: '#9BA3AF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{c.budget}</span> : <span style={{ color: '#4E6080', fontSize: 11 }}>—</span>}
                </div>
                <div className="adm-col-lang" style={{ fontSize: '12px', color: '#9BA3AF' }}>{c.language === 'hi' ? '🇮🇳' : '🇬🇧'}</div>
                <div className="adm-col-lang"><OutcomeDot outcome={c.outcome} /></div>
                <div><LeadScoreBadge score={c.lead_score} /></div>
                <div className="adm-col-eye" style={{ display: 'flex', justifyContent: 'center' }}><Eye size={13} color="#4E6080" /></div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )

  // ── Clients ───────────────────────────────────────────────────────────────

  const renderClients = () => (
    <div className="adm-card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '16px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="adm-label" style={{ marginBottom: 0 }}>Registered Users</div>
        <span style={{ fontSize: '11px', color: '#4E6080', fontFamily: "'IBM Plex Mono', monospace" }}>{clients.length} users</span>
      </div>
      {clientsLoading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '28px 18px', color: '#4E6080' }}><div className="admin-spinner" /> Loading…</div>
      ) : clients.length === 0 ? (
        <div style={{ padding: '36px', textAlign: 'center', color: '#4E6080', fontSize: 13 }}>No users yet</div>
      ) : (
        <div>
          <div className="adm-client-row" style={{ display: 'grid', gridTemplateColumns: '1fr 200px 100px 120px', padding: '10px 18px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            {['User', 'Email', 'Role', 'Client ID'].map(h => (
              <div key={h} style={{ fontSize: '10px', fontWeight: 600, color: '#4E6080', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: "'IBM Plex Mono', monospace" }}>{h}</div>
            ))}
          </div>
          {clients.map((client, i) => (
            <div key={client.id} className="adm-client-row" style={{ display: 'grid', gridTemplateColumns: '1fr 200px 100px 120px', padding: '13px 18px', alignItems: 'center', borderBottom: i < clients.length-1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                <div style={{ width: '30px', height: '30px', borderRadius: '50%', flexShrink: 0, background: client.role==='admin' ? 'linear-gradient(135deg,#2A3FE0,#7C8FFF)' : 'linear-gradient(135deg,#1F7A4D,#4FBE87)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: '#fff' }}>
                  {(client.displayName||client.email||'?')[0].toUpperCase()}
                </div>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#F3F0EA', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {client.displayName || client.email?.split('@')[0] || 'Unknown'}
                </span>
              </div>
              <div className="adm-client-col-email" style={{ fontSize: '11px', color: '#9BA3AF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'IBM Plex Mono', monospace" }}>{client.email||'—'}</div>
              <div>
                <span style={{ padding: '3px 8px', borderRadius: '5px', fontSize: '10px', fontWeight: 600, background: client.role==='admin'?'rgba(90,108,255,0.15)':'rgba(79,190,135,0.12)', color: client.role==='admin'?'#5A6CFF':'#4FBE87', fontFamily: "'IBM Plex Mono', monospace", textTransform: 'uppercase' }}>
                  {client.role||'client'}
                </span>
              </div>
              <div className="adm-client-col-id" style={{ fontSize: '11px', color: '#4E6080', fontFamily: "'IBM Plex Mono', monospace" }}>{client.clientId||'—'}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  // ── Settings ──────────────────────────────────────────────────────────────

  const renderSettings = () => (
    <div className="adm-settings-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
      <div className="adm-card">
        <div className="adm-label">API Config</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[
            { label: 'API Base URL', value: API_BASE, icon: Globe },
            { label: 'Project ID',   value: 'wakilz-dasboard', icon: Activity },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label}>
              <div style={{ fontSize: '10px', color: '#4E6080', marginBottom: '4px', fontFamily: "'IBM Plex Mono', monospace" }}>{label}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '7px 10px', background: 'rgba(255,255,255,0.04)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <Icon size={11} color="#4E6080" />
                <span style={{ fontSize: '11px', color: '#9BA3AF', fontFamily: "'IBM Plex Mono', monospace", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="adm-card">
        <div className="adm-label">Admin Account</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'linear-gradient(135deg,#2A3FE0,#7C8FFF)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 700, color: '#fff', flexShrink: 0 }}>{initials}</div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#F3F0EA' }}>{profile?.displayName || 'Admin'}</div>
            <div style={{ fontSize: '11px', color: '#4E6080', fontFamily: "'IBM Plex Mono', monospace" }}>{profile?.email}</div>
          </div>
        </div>
        <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 14px', borderRadius: '10px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ff6b7a', fontSize: '13px', cursor: 'pointer', width: '100%', justifyContent: 'center', fontFamily: "'Inter', sans-serif", fontWeight: 600 }}>
          <LogOut size={13} /> Sign out
        </button>
      </div>

      <div className="adm-card">
        <div className="adm-label">Data</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', marginBottom: '12px' }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#F3F0EA' }}>Total Conversations</div>
            <div style={{ fontSize: '11px', color: '#4E6080', marginTop: '2px' }}>Last: {lastRefresh.toLocaleTimeString('en-IN')}</div>
          </div>
          <span style={{ fontSize: '20px', fontWeight: 700, color: '#5A6CFF', fontFamily: "'Space Grotesk', sans-serif" }}>{totalCalls}</span>
        </div>
        <button onClick={fetchConversations} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 16px', borderRadius: '10px', background: 'rgba(90,108,255,0.12)', border: '1px solid rgba(90,108,255,0.25)', color: '#7C8FFF', fontSize: '13px', cursor: 'pointer', fontWeight: 600, fontFamily: "'Inter', sans-serif" }}>
          <RefreshCw size={12} style={{ animation: loading ? 'admin-spin 0.7s linear infinite' : 'none' }} />
          {loading ? 'Refreshing…' : 'Refresh Data'}
        </button>
      </div>
    </div>
  )

  // ── Render ────────────────────────────────────────────────────────────────

  const pageTitle = { overview: 'Admin Overview', calls: 'All Calls', clients: 'Clients', settings: 'Settings' }[activeNav]
  const pageSub = {
    overview: `${totalCalls} conversations · ${lastRefresh.toLocaleTimeString('en-IN')}`,
    calls:    `${filteredCalls.length} of ${totalCalls} calls`,
    clients:  `${clients.length} registered users`,
    settings: 'System configuration',
  }[activeNav]

  return (
    <>
      <style>{RESPONSIVE_CSS}</style>

      {/* Mobile overlay */}
      <div className={`adm-overlay${sidebarOpen ? ' open' : ''}`} onClick={closeSidebar} />

      <div className="adm-root">
        {/* Sidebar */}
        <aside className={`adm-sidebar${sidebarOpen ? ' open' : ''}`}>
          <SidebarContent />
        </aside>

        {/* Right side */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>

          {/* Mobile topbar */}
          <div className="adm-mobile-topbar">
            <button className="adm-hamburger" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
              <Menu size={18} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '16px', color: '#F3F0EA' }}>wakilz</span>
              <span style={{ padding: '2px 7px', borderRadius: '4px', background: 'rgba(90,108,255,0.15)', fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', fontWeight: 600, color: '#5A6CFF' }}>ADMIN</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
              <button onClick={fetchConversations} disabled={loading}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', color: '#9BA3AF', cursor: 'pointer' }}>
                <RefreshCw size={13} style={{ animation: loading ? 'admin-spin 0.7s linear infinite' : 'none' }} />
              </button>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg,#2A3FE0,#7C8FFF)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: '#fff' }}>
                {initials}
              </div>
            </div>
          </div>

          {/* Main */}
          <main className="adm-main">
            {/* Desktop header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '22px' }}>
              <div>
                <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '22px', fontWeight: 700, color: '#F3F0EA', letterSpacing: '-0.02em', margin: '0 0 4px' }}>
                  {pageTitle}
                </h1>
                <p style={{ fontSize: '12px', color: '#9BA3AF', margin: 0 }}>{pageSub}</p>
              </div>
              <div className="adm-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                <button onClick={fetchConversations} disabled={loading} className="adm-refresh-btn"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '9px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', color: '#9BA3AF', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: "'IBM Plex Mono', monospace" }}>
                  <RefreshCw size={12} style={{ animation: loading ? 'admin-spin 0.7s linear infinite' : 'none' }} />
                  <span>Refresh</span>
                </button>
                <button className="adm-notif-btn" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '9px', background: 'linear-gradient(135deg,#2A3FE0,#5A6CFF)', border: 'none', color: '#fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: "'IBM Plex Mono', monospace", boxShadow: '0 4px 16px rgba(42,63,224,0.28)', whiteSpace: 'nowrap' }}>
                  <Bell size={12} /> Notifications
                </button>
              </div>
            </div>

            {/* Tab bottom nav for mobile */}
            <div style={{ display: 'none' }} className="adm-mobile-tabs">
              {NAV.map(({ key, icon: Icon, label }) => (
                <button key={key} onClick={() => setActiveNav(key)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', padding: '8px 4px', background: 'none', border: 'none', color: activeNav === key ? '#7C8FFF' : '#4E6080', cursor: 'pointer', fontSize: '10px', fontFamily: "'IBM Plex Mono', monospace" }}>
                  <Icon size={16} />
                  {label}
                </button>
              ))}
            </div>

            {activeNav === 'overview' && renderOverview()}
            {activeNav === 'calls'    && renderCalls()}
            {activeNav === 'clients'  && renderClients()}
            {activeNav === 'settings' && renderSettings()}
          </main>
        </div>
      </div>

      {/* Mobile bottom tab bar */}
      <style>{`
        @media (max-width: 768px) {
          .adm-mobile-tabs { display: flex !important; }
          .adm-close-btn { display: flex !important; }
          .adm-settings-grid { grid-template-columns: 1fr !important; }
        }
        .adm-mobile-tabs {
          position: fixed; bottom: 0; left: 0; right: 0; z-index: 150;
          background: #0f1b2d; border-top: 1px solid rgba(255,255,255,0.07);
          padding: 4px 0 max(4px, env(safe-area-inset-bottom));
        }
        @media (max-width: 768px) {
          .adm-main { padding-bottom: 70px !important; }
        }
        @media (min-width: 769px) {
          .adm-mobile-topbar { display: none !important; }
          .adm-mobile-tabs { display: none !important; }
        }
      `}</style>
    </>
  )
}
