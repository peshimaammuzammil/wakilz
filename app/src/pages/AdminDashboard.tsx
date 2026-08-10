import { useState, useEffect, useCallback } from 'react'
import { useNavigate, Link } from 'react-router'
import { useAuth } from '@/contexts/AuthContext'
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import {
  LayoutDashboard, Users, Phone, Settings,
  LogOut, Bell, TrendingUp, Activity, Target, PhoneCall,
  ChevronRight, BarChart2, Download, RefreshCw, Search,
  CheckCircle, XCircle, Clock, AlertCircle, Eye,
  Calendar, MapPin, Home, DollarSign, Globe
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
  createdAt?: { toDate?: () => Date } | string
}

// ── Config ────────────────────────────────────────────────────────────────────

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
  lead_captured:  'Lead Captured',
  partial_lead:   'Partial Lead',
  no_lead:        'No Lead',
  hung_up_early:  'Hung Up',
}

// ── Mini Components ───────────────────────────────────────────────────────────

function OutcomeDot({ outcome }: { outcome: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      padding: '3px 9px', borderRadius: '20px', fontSize: '11px', fontWeight: 600,
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

// Mini bar chart for outcome distribution
function OutcomeBar({ conversations }: { conversations: Conversation[] }) {
  const total = conversations.length
  if (total === 0) return <div style={{ color: '#4E6080', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>No data yet</div>

  const groups = [
    { key: 'lead_captured',  label: 'Lead Captured',  color: '#4FBE87' },
    { key: 'partial_lead',   label: 'Partial Lead',   color: '#F5A623' },
    { key: 'no_lead',        label: 'No Lead',         color: '#4E6080' },
    { key: 'hung_up_early',  label: 'Hung Up',         color: '#EF4444' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Stacked bar */}
      <div style={{ display: 'flex', borderRadius: '6px', overflow: 'hidden', height: '10px', gap: '2px' }}>
        {groups.map(({ key, color }) => {
          const count = conversations.filter(c => c.outcome === key).length
          const pct = (count / total) * 100
          return pct > 0 ? (
            <div
              key={key}
              style={{ width: `${pct}%`, background: color, transition: 'width 0.6s ease' }}
              title={`${OUTCOME_LABELS[key]}: ${count} (${pct.toFixed(1)}%)`}
            />
          ) : null
        })}
      </div>
      {/* Legend */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        {groups.map(({ key, label, color }) => {
          const count = conversations.filter(c => c.outcome === key).length
          const pct = total > 0 ? ((count / total) * 100).toFixed(0) : 0
          return (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: color, flexShrink: 0 }} />
              <span style={{ fontSize: '12px', color: '#9BA3AF', flex: 1 }}>{label}</span>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#F3F0EA', fontFamily: "'IBM Plex Mono', monospace" }}>
                {count} <span style={{ color: '#4E6080', fontWeight: 400 }}>({pct}%)</span>
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// 7-day calls sparkline (simple SVG)
function CallsSparkline({ conversations }: { conversations: Conversation[] }) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const dateStr = d.toISOString().slice(0, 10)
    const count = conversations.filter(c => c.call_date === dateStr).length
    return { date: d.toLocaleDateString('en-IN', { weekday: 'short' }), count }
  })

  const max = Math.max(...days.map(d => d.count), 1)
  const W = 260, H = 60, PAD = 8

  const points = days.map((d, i) => ({
    x: PAD + (i / 6) * (W - PAD * 2),
    y: H - PAD - ((d.count / max) * (H - PAD * 2)),
    ...d,
  }))

  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ')

  const areaD = `${pathD} L ${points[points.length - 1].x.toFixed(1)} ${H} L ${points[0].x.toFixed(1)} ${H} Z`

  return (
    <div style={{ position: 'relative' }}>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5A6CFF" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#5A6CFF" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaD} fill="url(#sparkGrad)" />
        <path d={pathD} fill="none" stroke="#5A6CFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={p.count > 0 ? 3 : 0} fill="#5A6CFF" />
        ))}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
        {days.map((d, i) => (
          <span key={i} style={{ fontSize: '10px', color: '#4E6080', fontFamily: "'IBM Plex Mono', monospace", minWidth: 0, textAlign: 'center' }}>
            {d.date}
          </span>
        ))}
      </div>
    </div>
  )
}

// Budget distribution
function BudgetChart({ conversations }: { conversations: Conversation[] }) {
  const tiers = ['ultra_luxury', 'luxury', 'premium', 'affordable', 'budget']
  const labels: Record<string, string> = {
    ultra_luxury: 'Ultra Lux', luxury: 'Luxury', premium: 'Premium', affordable: 'Affordable', budget: 'Budget'
  }
  const colors = ['#E05AFF', '#5A6CFF', '#4FBE87', '#F5A623', '#9BA3AF']
  const total = conversations.filter(c => c.budget_tier).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {tiers.map((tier, i) => {
        const count = conversations.filter(c => c.budget_tier === tier).length
        const pct = total > 0 ? (count / total) * 100 : 0
        return count > 0 ? (
          <div key={tier} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '11px', color: '#9BA3AF', minWidth: '64px', fontFamily: "'IBM Plex Mono', monospace" }}>
              {labels[tier]}
            </span>
            <div style={{ flex: 1, height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.06)' }}>
              <div style={{ width: `${pct}%`, height: '100%', borderRadius: '3px', background: colors[i], transition: 'width 0.6s ease' }} />
            </div>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#F3F0EA', minWidth: '24px', textAlign: 'right', fontFamily: "'IBM Plex Mono', monospace" }}>
              {count}
            </span>
          </div>
        ) : null
      })}
    </div>
  )
}

// ── Nav ────────────────────────────────────────────────────────────────────────

type NavKey = 'overview' | 'calls' | 'clients' | 'settings'

const NAV: { key: NavKey; icon: typeof LayoutDashboard; label: string }[] = [
  { key: 'overview',  icon: LayoutDashboard, label: 'Overview'  },
  { key: 'calls',     icon: PhoneCall,        label: 'All Calls' },
  { key: 'clients',   icon: Users,            label: 'Clients'   },
  { key: 'settings',  icon: Settings,         label: 'Settings'  },
]

// ── Main Component ─────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const { profile, logOut } = useAuth()
  const navigate = useNavigate()
  const [activeNav, setActiveNav] = useState<NavKey>('overview')

  // Conversations state
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  // Clients state (from Firestore)
  const [clients, setClients] = useState<FirestoreClient[]>([])
  const [clientsLoading, setClientsLoading] = useState(false)

  // Calls tab state
  const [search, setSearch] = useState('')
  const [outcomeFilter, setOutcomeFilter] = useState('')

  const initials = (profile?.displayName || profile?.email || 'A')[0].toUpperCase()

  const handleLogout = async () => {
    await logOut()
    navigate('/', { replace: true })
  }

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      params.set('page_size', '200')
      const res = await fetch(`${API_BASE}/api/conversations?${params}`, { headers: apiHeaders() })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setConversations(data.conversations || [])
      setLastRefresh(new Date())
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch Firestore clients
  const fetchClients = useCallback(async () => {
    setClientsLoading(true)
    try {
      const q = query(collection(db, 'users'), orderBy('email'), limit(50))
      const snap = await getDocs(q)
      const list: FirestoreClient[] = snap.docs.map(d => ({ id: d.id, ...d.data() as Omit<FirestoreClient, 'id'> }))
      setClients(list)
    } catch {
      // Firestore might not have permission or collection doesn't exist yet
      setClients([])
    } finally {
      setClientsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchConversations()
    fetchClients()
  }, [fetchConversations, fetchClients])

  // Computed stats
  const totalCalls = conversations.length
  const leadsCaptured = conversations.filter(c => c.outcome === 'lead_captured').length
  const visitsBooked = conversations.filter(c => c.intent_signals?.ready_to_visit).length
  const avgScore = totalCalls > 0
    ? Math.round(conversations.reduce((sum, c) => sum + (c.lead_score || 0), 0) / totalCalls)
    : 0
  const conversionRate = totalCalls > 0 ? ((leadsCaptured / totalCalls) * 100).toFixed(1) : '0.0'

  // Filtered calls for table
  const filteredCalls = conversations.filter(c => {
    const matchesOutcome = !outcomeFilter || c.outcome === outcomeFilter
    const q = search.toLowerCase()
    const matchesSearch = !search || (
      c.lead_name?.toLowerCase().includes(q) ||
      c.city_preference?.toLowerCase().includes(q) ||
      c.property_type?.toLowerCase().includes(q) ||
      c.session_id?.toLowerCase().includes(q)
    )
    return matchesOutcome && matchesSearch
  })

  // CSV export
  const handleExport = () => {
    const headers = ['Session ID','Date','Lead Name','City','Property Type','Budget','Budget Tier','Language','Outcome','Lead Score','Duration (s)']
    const rows = conversations.map(c => [
      c.session_id, c.call_date, c.lead_name || '', c.city_preference || '',
      c.property_type || '', c.budget || '', c.budget_tier || '',
      c.language, c.outcome, c.lead_score, c.call_duration_secs ?? '',
    ])
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `wakilz-leads-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ── Styles ──────────────────────────────────────────────────────────────────

  const cardStyle: React.CSSProperties = {
    background: '#0f1b2d',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: '16px',
    padding: '22px 20px',
  }

  const sectionLabelStyle: React.CSSProperties = {
    fontSize: '11px',
    fontWeight: 600,
    color: '#4E6080',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    fontFamily: "'IBM Plex Mono', monospace",
    marginBottom: '16px',
  }

  // ── Render helpers ───────────────────────────────────────────────────────────

  const renderOverview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
        {[
          {
            label: 'Total Calls', value: loading ? '…' : totalCalls.toString(),
            icon: PhoneCall, color: '#5A6CFF',
            sub: 'All time conversations',
          },
          {
            label: 'Lead Captures', value: loading ? '…' : leadsCaptured.toString(),
            icon: Target, color: '#4FBE87',
            sub: `${conversionRate}% conversion rate`,
          },
          {
            label: 'Visits Booked', value: loading ? '…' : visitsBooked.toString(),
            icon: Calendar, color: '#F5A623',
            sub: 'Ready to visit flagged',
          },
          {
            label: 'Avg Lead Score', value: loading ? '…' : avgScore.toString(),
            icon: TrendingUp, color: '#E05AFF',
            sub: 'Out of 100',
          },
        ].map(({ label, value, icon: Icon, color, sub }) => (
          <div key={label} style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
              <span style={{ fontSize: '12px', color: '#9BA3AF', fontFamily: "'IBM Plex Mono', monospace" }}>{label}</span>
              <div style={{ width: '34px', height: '34px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${color}22`, flexShrink: 0 }}>
                <Icon size={14} color={color} />
              </div>
            </div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '30px', fontWeight: 700, color: '#F3F0EA', lineHeight: 1 }}>
              {value}
            </div>
            <div style={{ fontSize: '11px', color: '#4E6080', marginTop: '6px' }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
        {/* Outcome distribution */}
        <div style={cardStyle}>
          <div style={sectionLabelStyle}>Outcome Distribution</div>
          {loading ? (
            <div style={{ height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div className="admin-spinner" />
            </div>
          ) : (
            <OutcomeBar conversations={conversations} />
          )}
        </div>

        {/* 7-day trend */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={sectionLabelStyle}>Calls — Last 7 Days</div>
          </div>
          {loading ? (
            <div style={{ height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div className="admin-spinner" />
            </div>
          ) : (
            <CallsSparkline conversations={conversations} />
          )}
        </div>

        {/* Budget tiers */}
        <div style={cardStyle}>
          <div style={sectionLabelStyle}>Budget Tiers</div>
          {loading ? (
            <div style={{ height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div className="admin-spinner" />
            </div>
          ) : (
            <BudgetChart conversations={conversations} />
          )}
        </div>
      </div>

      {/* Recent calls + quick stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '14px' }}>
        {/* Recent calls */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={sectionLabelStyle}>Recent Calls</div>
            <button
              onClick={() => setActiveNav('calls')}
              style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: '#5A6CFF', fontSize: '12px', cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}
            >
              View all <ChevronRight size={12} />
            </button>
          </div>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#4E6080', fontSize: 13, padding: '20px 0' }}>
              <div className="admin-spinner" />Loading calls…
            </div>
          ) : error ? (
            <div style={{ color: '#EF4444', fontSize: 13, padding: '12px 0' }}>⚠ {error}</div>
          ) : conversations.length === 0 ? (
            <div style={{ color: '#4E6080', fontSize: 13, padding: '20px 0', textAlign: 'center' }}>No conversations found</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {conversations.slice(0, 6).map(c => (
                <Link
                  key={c.session_id}
                  to={`/conversations/${c.session_id}`}
                  style={{ textDecoration: 'none' }}
                >
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '10px 12px', borderRadius: '10px',
                    cursor: 'pointer', transition: 'background 0.15s',
                  }}
                    onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.04)'}
                    onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}
                  >
                    {/* Avatar */}
                    <div style={{
                      width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0,
                      background: `${OUTCOME_COLORS[c.outcome] || '#9BA3AF'}22`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '14px', fontWeight: 700,
                      color: OUTCOME_COLORS[c.outcome] || '#9BA3AF',
                    }}>
                      {(c.lead_name || 'U')[0].toUpperCase()}
                    </div>
                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#F3F0EA', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.lead_name || 'Unknown Caller'}
                      </div>
                      <div style={{ fontSize: '11px', color: '#4E6080', display: 'flex', gap: '8px', marginTop: '2px', flexWrap: 'wrap' }}>
                        {c.city_preference && <span>{c.city_preference}</span>}
                        {c.property_type && <span>· {c.property_type}</span>}
                        <span>· {formatDuration(c.call_duration_secs)}</span>
                      </div>
                    </div>
                    {/* Meta */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flexShrink: 0 }}>
                      <OutcomeDot outcome={c.outcome} />
                      <span style={{ fontSize: '11px', color: '#4E6080', fontFamily: "'IBM Plex Mono', monospace" }}>
                        {formatRelativeTime(c.call_start_iso)}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Quick stats panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Intent signals */}
          <div style={cardStyle}>
            <div style={sectionLabelStyle}>Intent Signals</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { label: 'Ready to Visit', value: conversations.filter(c => c.intent_signals?.ready_to_visit).length, color: '#4FBE87', Icon: CheckCircle },
                { label: 'Callback Agreed', value: conversations.filter(c => c.intent_signals?.callback_agreed).length, color: '#5A6CFF', Icon: Phone },
                { label: 'Objections', value: conversations.filter(c => c.intent_signals?.objection_detected).length, color: '#F5A623', Icon: AlertCircle },
                { label: 'Agent Requested', value: conversations.filter(c => c.intent_signals?.agent_escalation_requested).length, color: '#E05AFF', Icon: Users },
              ].map(({ label, value, color, Icon }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Icon size={13} color={color} style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: '12px', color: '#9BA3AF', flex: 1 }}>{label}</span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color, fontFamily: "'IBM Plex Mono', monospace" }}>{loading ? '…' : value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Language breakdown */}
          <div style={cardStyle}>
            <div style={sectionLabelStyle}>Languages</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { label: '🇬🇧 English', key: 'en' },
                { label: '🇮🇳 Hindi', key: 'hi' },
              ].map(({ label, key }) => {
                const count = conversations.filter(c => c.language === key).length
                const pct = totalCalls > 0 ? Math.round((count / totalCalls) * 100) : 0
                return (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '12px', color: '#9BA3AF', flex: 1 }}>{label}</span>
                    <div style={{ width: '60px', height: '5px', borderRadius: '3px', background: 'rgba(255,255,255,0.06)' }}>
                      <div style={{ width: `${pct}%`, height: '100%', borderRadius: '3px', background: '#5A6CFF' }} />
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#F3F0EA', fontFamily: "'IBM Plex Mono', monospace", minWidth: '30px', textAlign: 'right' }}>
                      {loading ? '…' : count}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Top cities */}
          <div style={cardStyle}>
            <div style={sectionLabelStyle}>Top Cities</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(() => {
                const cityCounts: Record<string, number> = {}
                conversations.forEach(c => { if (c.city_preference) cityCounts[c.city_preference] = (cityCounts[c.city_preference] || 0) + 1 })
                return Object.entries(cityCounts)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 4)
                  .map(([city, count]) => (
                    <div key={city} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <MapPin size={11} color="#4E6080" style={{ flexShrink: 0 }} />
                      <span style={{ fontSize: '12px', color: '#9BA3AF', flex: 1 }}>{city}</span>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#F3F0EA', fontFamily: "'IBM Plex Mono', monospace" }}>{count}</span>
                    </div>
                  ))
              })()}
              {!loading && conversations.filter(c => c.city_preference).length === 0 && (
                <span style={{ fontSize: 12, color: '#4E6080' }}>No data yet</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderCalls = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Filter bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '14px 16px', background: '#0f1b2d',
        border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px',
      }}>
        <Search size={14} color="#4E6080" style={{ flexShrink: 0 }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, city, property type…"
          style={{
            flex: 1, background: 'none', border: 'none', outline: 'none',
            color: '#F3F0EA', fontSize: '13px', fontFamily: "'Inter', sans-serif",
          }}
        />
        <select
          value={outcomeFilter}
          onChange={e => setOutcomeFilter(e.target.value)}
          style={{
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)',
            borderRadius: '8px', color: '#9BA3AF', fontSize: '12px',
            padding: '6px 10px', cursor: 'pointer', outline: 'none',
            fontFamily: "'IBM Plex Mono', monospace",
          }}
        >
          <option value="">All Outcomes</option>
          <option value="lead_captured">Lead Captured</option>
          <option value="partial_lead">Partial Lead</option>
          <option value="no_lead">No Lead</option>
          <option value="hung_up_early">Hung Up</option>
        </select>
        <button
          onClick={handleExport}
          disabled={conversations.length === 0}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '7px 14px', borderRadius: '8px',
            background: 'rgba(90,108,255,0.12)', border: '1px solid rgba(90,108,255,0.25)',
            color: '#7C8FFF', fontSize: '12px', cursor: 'pointer', fontWeight: 600,
            fontFamily: "'IBM Plex Mono', monospace',",
          }}
        >
          <Download size={12} /> Export CSV
        </button>
        <span style={{ fontSize: '11px', color: '#4E6080', fontFamily: "'IBM Plex Mono', monospace", whiteSpace: 'nowrap' }}>
          {filteredCalls.length} results
        </span>
      </div>

      {/* Table */}
      <div style={{ background: '#0f1b2d', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 130px 110px 90px 70px 90px 60px 44px',
          padding: '10px 18px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(255,255,255,0.02)',
        }}>
          {['Lead', 'Location', 'Property', 'Budget', 'Lang', 'Outcome', 'Score', ''].map(h => (
            <div key={h} style={{ fontSize: '10px', fontWeight: 600, color: '#4E6080', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: "'IBM Plex Mono', monospace" }}>
              {h}
            </div>
          ))}
        </div>

        {/* Rows */}
        <div style={{ maxHeight: '520px', overflowY: 'auto' }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '32px 18px', color: '#4E6080' }}>
              <div className="admin-spinner" /> Loading conversations…
            </div>
          ) : filteredCalls.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#4E6080', fontSize: 13 }}>
              {error ? `⚠ ${error}` : 'No calls match your filters'}
            </div>
          ) : filteredCalls.map((c, i) => (
            <Link
              key={c.session_id}
              to={`/conversations/${c.session_id}`}
              style={{ textDecoration: 'none', display: 'block' }}
            >
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 130px 110px 90px 70px 90px 60px 44px',
                padding: '12px 18px',
                borderBottom: i < filteredCalls.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                cursor: 'pointer', alignItems: 'center', transition: 'background 0.12s',
              }}
                onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.03)'}
                onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}
              >
                {/* Lead name + time */}
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#F3F0EA', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.lead_name || 'Unknown Caller'}
                  </div>
                  <div style={{ fontSize: '11px', color: '#4E6080', fontFamily: "'IBM Plex Mono', monospace", marginTop: '2px' }}>
                    {formatRelativeTime(c.call_start_iso)} · {formatDuration(c.call_duration_secs)}
                  </div>
                </div>
                {/* City */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  {c.city_preference
                    ? <><MapPin size={11} color="#4E6080" /><span style={{ fontSize: '12px', color: '#9BA3AF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.city_preference}</span></>
                    : <span style={{ color: '#4E6080', fontSize: 11 }}>—</span>
                  }
                </div>
                {/* Property type */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  {c.property_type
                    ? <><Home size={11} color="#4E6080" /><span style={{ fontSize: '12px', color: '#9BA3AF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.property_type}</span></>
                    : <span style={{ color: '#4E6080', fontSize: 11 }}>—</span>
                  }
                </div>
                {/* Budget */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {c.budget
                    ? <><DollarSign size={11} color="#4E6080" /><span style={{ fontSize: '11px', color: '#9BA3AF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.budget}</span></>
                    : <span style={{ color: '#4E6080', fontSize: 11 }}>—</span>
                  }
                </div>
                {/* Language */}
                <div style={{ fontSize: '12px', color: '#9BA3AF' }}>
                  {c.language === 'hi' ? '🇮🇳 hi' : '🇬🇧 en'}
                </div>
                {/* Outcome */}
                <div><OutcomeDot outcome={c.outcome} /></div>
                {/* Score */}
                <div><LeadScoreBadge score={c.lead_score} /></div>
                {/* View */}
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <Eye size={13} color="#4E6080" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )

  const renderClients = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ background: '#0f1b2d', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', overflow: 'hidden' }}>
        <div style={{ padding: '18px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={sectionLabelStyle}>Registered Users</div>
          <span style={{ fontSize: '11px', color: '#4E6080', fontFamily: "'IBM Plex Mono', monospace" }}>
            {clients.length} user{clients.length !== 1 ? 's' : ''}
          </span>
        </div>
        {clientsLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '32px 20px', color: '#4E6080' }}>
            <div className="admin-spinner" /> Loading users…
          </div>
        ) : clients.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#4E6080', fontSize: 13 }}>
            No users in Firestore yet — users are created when they first sign in.
          </div>
        ) : (
          <div>
            {/* Header */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 200px 100px 120px',
              padding: '10px 20px', background: 'rgba(255,255,255,0.02)',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}>
              {['User', 'Email', 'Role', 'Client ID'].map(h => (
                <div key={h} style={{ fontSize: '10px', fontWeight: 600, color: '#4E6080', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: "'IBM Plex Mono', monospace" }}>{h}</div>
              ))}
            </div>
            {clients.map((client, i) => (
              <div key={client.id} style={{
                display: 'grid', gridTemplateColumns: '1fr 200px 100px 120px',
                padding: '14px 20px', alignItems: 'center',
                borderBottom: i < clients.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
              }}>
                {/* Avatar + name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                    background: client.role === 'admin'
                      ? 'linear-gradient(135deg, #2A3FE0, #7C8FFF)'
                      : 'linear-gradient(135deg, #1F7A4D, #4FBE87)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '13px', fontWeight: 700, color: '#fff',
                  }}>
                    {(client.displayName || client.email || '?')[0].toUpperCase()}
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#F3F0EA' }}>
                    {client.displayName || client.email?.split('@')[0] || 'Unknown'}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: '#9BA3AF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'IBM Plex Mono', monospace" }}>
                  {client.email || '—'}
                </div>
                <div>
                  <span style={{
                    padding: '3px 8px', borderRadius: '5px', fontSize: '10px', fontWeight: 600,
                    background: client.role === 'admin' ? 'rgba(90,108,255,0.15)' : 'rgba(79,190,135,0.12)',
                    color: client.role === 'admin' ? '#5A6CFF' : '#4FBE87',
                    fontFamily: "'IBM Plex Mono', monospace", textTransform: 'uppercase',
                  }}>
                    {client.role || 'client'}
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: '#4E6080', fontFamily: "'IBM Plex Mono', monospace" }}>
                  {client.clientId || '—'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )

  const renderSettings = () => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
      {/* API Config */}
      <div style={cardStyle}>
        <div style={sectionLabelStyle}>API Configuration</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[
            { label: 'API Base URL', value: API_BASE, icon: Globe },
            { label: 'Project ID', value: 'wakilz-dasboard', icon: Activity },
            { label: 'Auth Domain', value: 'wakilz-dasboard.firebaseapp.com', icon: CheckCircle },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label}>
              <div style={{ fontSize: '11px', color: '#4E6080', marginBottom: '4px', fontFamily: "'IBM Plex Mono', monospace" }}>{label}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <Icon size={12} color="#4E6080" />
                <span style={{ fontSize: '12px', color: '#9BA3AF', fontFamily: "'IBM Plex Mono', monospace", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Admin account */}
      <div style={cardStyle}>
        <div style={sectionLabelStyle}>Admin Account</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{
            width: '46px', height: '46px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #2A3FE0, #7C8FFF)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '20px', fontWeight: 700, color: '#fff', flexShrink: 0,
          }}>
            {initials}
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#F3F0EA' }}>{profile?.displayName || 'Admin'}</div>
            <div style={{ fontSize: '12px', color: '#4E6080', fontFamily: "'IBM Plex Mono', monospace" }}>{profile?.email}</div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[
            { label: 'Role', value: 'admin' },
            { label: 'UID', value: profile?.uid || '—' },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
              <span style={{ fontSize: '12px', color: '#4E6080' }}>{label}</span>
              <span style={{ fontSize: '12px', color: '#9BA3AF', fontFamily: "'IBM Plex Mono', monospace", maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</span>
            </div>
          ))}
        </div>
        <button
          onClick={handleLogout}
          style={{
            marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px',
            width: '100%', padding: '10px 14px', borderRadius: '10px',
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
            color: '#ff6b7a', fontSize: '13px', cursor: 'pointer', justifyContent: 'center',
            fontFamily: "'Inter', sans-serif", fontWeight: 600,
          }}
        >
          <LogOut size={14} /> Sign out
        </button>
      </div>

      {/* Data refresh */}
      <div style={cardStyle}>
        <div style={sectionLabelStyle}>Data</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#F3F0EA' }}>Total Conversations</div>
              <div style={{ fontSize: '11px', color: '#4E6080', marginTop: '2px' }}>From API</div>
            </div>
            <span style={{ fontSize: '20px', fontWeight: 700, color: '#5A6CFF', fontFamily: "'Space Grotesk', sans-serif" }}>{totalCalls}</span>
          </div>
          <div style={{ fontSize: '11px', color: '#4E6080' }}>
            Last refreshed: {lastRefresh.toLocaleTimeString('en-IN')}
          </div>
          <button
            onClick={fetchConversations}
            disabled={loading}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 16px', borderRadius: '10px',
              background: 'rgba(90,108,255,0.12)', border: '1px solid rgba(90,108,255,0.25)',
              color: '#7C8FFF', fontSize: '13px', cursor: 'pointer', fontWeight: 600,
              fontFamily: "'Inter', sans-serif",
            }}
          >
            <RefreshCw size={13} style={{ animation: loading ? 'admin-spin 1s linear infinite' : 'none' }} />
            {loading ? 'Refreshing…' : 'Refresh Data'}
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      <style>{`
        .admin-spinner {
          width: 16px; height: 16px; border-radius: 50%;
          border: 2px solid rgba(90,108,255,0.2);
          border-top-color: #5A6CFF;
          animation: admin-spin 0.7s linear infinite;
          flex-shrink: 0;
        }
        @keyframes admin-spin { to { transform: rotate(360deg); } }
        .admin-nav-btn:hover { background: rgba(255,255,255,0.06) !important; }
      `}</style>

      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#0C1524', fontFamily: "'Inter', sans-serif" }}>

        {/* ─── SIDEBAR ─── */}
        <aside style={{
          width: '240px', height: '100vh', flexShrink: 0,
          background: '#0f1b2d',
          borderRight: '1px solid rgba(255,255,255,0.07)',
          display: 'grid', gridTemplateRows: 'auto 1fr auto',
        }}>

          {/* Brand */}
          <div style={{ padding: '20px 18px 14px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <img
                src="/assets/images/logo.png" alt="wakilz"
                style={{ height: '22px', objectFit: 'contain', flexShrink: 0 }}
                onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '18px', color: '#F3F0EA', letterSpacing: '-0.02em' }}>
                wakilz
              </span>
            </div>
            <span style={{
              display: 'inline-flex', alignItems: 'center',
              padding: '3px 10px', borderRadius: '5px',
              background: 'rgba(90,108,255,0.15)',
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '10px', fontWeight: 600, color: '#5A6CFF', letterSpacing: '0.1em',
            }}>
              ADMIN
            </span>
          </div>

          {/* Nav */}
          <nav style={{ padding: '10px 10px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {NAV.map(({ key, icon: Icon, label }) => {
              const active = activeNav === key
              return (
                <button
                  key={key}
                  className="admin-nav-btn"
                  onClick={() => setActiveNav(key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    width: '100%', padding: '10px 12px', borderRadius: '8px',
                    border: 'none',
                    background: active ? 'rgba(90,108,255,0.15)' : 'transparent',
                    color: active ? '#7C8FFF' : '#9BA3AF',
                    fontSize: '13px', fontWeight: active ? 600 : 400,
                    cursor: 'pointer', textAlign: 'left',
                    fontFamily: "'Inter', sans-serif", boxSizing: 'border-box',
                    transition: 'background 0.15s, color 0.15s',
                  }}
                >
                  <Icon size={14} style={{ flexShrink: 0 }} />
                  {label}
                  {active && <ChevronRight size={12} style={{ marginLeft: 'auto' }} />}
                </button>
              )
            })}

            {/* Link to conversations page */}
            <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <Link
                to="/conversations"
                style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '8px', color: '#9BA3AF', fontSize: '13px', transition: 'background 0.15s' }}
                onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.04)'}
                onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'}
              >
                <BarChart2 size={14} style={{ flexShrink: 0 }} />
                Conversations
              </Link>
            </div>
          </nav>

          {/* User footer */}
          <div style={{ padding: '14px 16px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', overflow: 'hidden' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                background: 'linear-gradient(135deg, #2A3FE0, #7C8FFF)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '13px', fontWeight: 700, color: '#fff',
              }}>
                {initials}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#F3F0EA', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {profile?.displayName || 'Admin'}
                </div>
                <div style={{ fontSize: '10px', color: '#4E6080', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: "'IBM Plex Mono', monospace" }}>
                  {profile?.email}
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              style={{
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
        </aside>

        {/* ─── MAIN ─── */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '30px 36px', boxSizing: 'border-box' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px' }}>
            <div>
              <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '24px', fontWeight: 700, color: '#F3F0EA', letterSpacing: '-0.02em', margin: '0 0 4px' }}>
                {activeNav === 'overview' ? 'Admin Overview' :
                 activeNav === 'calls'    ? 'All Calls' :
                 activeNav === 'clients'  ? 'Clients' : 'Settings'}
              </h1>
              <p style={{ fontSize: '13px', color: '#9BA3AF', margin: 0 }}>
                {activeNav === 'overview' ? `${totalCalls} total conversations · Last updated ${lastRefresh.toLocaleTimeString('en-IN')}` :
                 activeNav === 'calls'    ? `${filteredCalls.length} of ${totalCalls} calls shown` :
                 activeNav === 'clients'  ? `${clients.length} registered users` : 'System configuration'}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={fetchConversations}
                disabled={loading}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '9px 16px', borderRadius: '10px',
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)',
                  color: '#9BA3AF', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                  fontFamily: "'IBM Plex Mono', monospace",
                }}
              >
                <RefreshCw size={12} style={{ animation: loading ? 'admin-spin 0.7s linear infinite' : 'none' }} />
                Refresh
              </button>
              <button style={{
                display: 'flex', alignItems: 'center', gap: '7px',
                padding: '9px 18px', borderRadius: '10px',
                background: 'linear-gradient(135deg, #2A3FE0, #5A6CFF)',
                border: 'none', color: '#fff', fontSize: '12px', fontWeight: 600,
                cursor: 'pointer', fontFamily: "'IBM Plex Mono', monospace",
                boxShadow: '0 4px 16px rgba(42,63,224,0.30)',
              }}>
                <Bell size={12} /> Notifications
              </button>
            </div>
          </div>

          {/* Content */}
          {activeNav === 'overview' && renderOverview()}
          {activeNav === 'calls'    && renderCalls()}
          {activeNav === 'clients'  && renderClients()}
          {activeNav === 'settings' && renderSettings()}
        </main>
      </div>
    </>
  )
}
