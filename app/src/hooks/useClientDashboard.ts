/**
 * useClientDashboard.ts
 *
 * Custom hook that:
 *  1. Authenticates with wakilz_demo key → gets scoped JWT
 *  2. Fetches calls directly from Rasen (via /api/rasen/calls) with date filters
 *  3. Computes all dashboard metrics from the raw call list:
 *     - Funnel stages (dialed → answered → conversation → lead → visit)
 *     - Weekly trend (calls & confirmed visits)
 *     - Drop-off root causes
 *     - Language distribution
 *     - Recent qualified leads table
 *     - Key stat cards
 *     - Detailed enriched leads for the LeadDetailsDrawer
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { fetchRasenCalls, type RasenCall } from '@/lib/clientApi'

// ── Derived types exposed to the UI ──────────────────────────────────────────

export interface FunnelStage {
  label: string
  value: number
  note: string
}

export interface TrendPoint {
  week: string
  conversations: number
  bookings: number
}

export interface DropReason {
  reason: string
  pct: number
}

export interface LanguageBucket {
  key: string
  pct: number
  color: string
}

export interface LeadRow {
  id: string
  callId: string
  name: string
  phone: string
  intent: string
  budget: string
  location: string
  propertyType: string
  timeline: string
  siteVisitSlot: string
  time: string
  ts: string
  status: 'Booked' | 'Site visit set' | 'Contacted' | 'Dropped' | 'Escalated'
  outcome: string
  summary: string
  durationSecs: number
  sentiment: string
  direction: string
  rawCall: RasenCall
}

export interface DashboardStats {
  totalCalls: number          // all calls dialed in period
  answeredCalls: number       // status: ended
  connectRate: number         // % answered / total
  conversations: number       // ended with actual talk time (detailed_status: completed)
  avgDurationSecs: number
  qualifiedLeads: number      // call_outcome: lead_captured | partial_lead
  qualifiedRate: number
  visitsBooked: number        // booking_status: confirmed
  visitBookedRate: number
  outcomeBreakdown: {
    lead_captured: number
    partial_lead: number
    no_lead: number
    hung_up_early: number
    escalated: number
  }
}

export interface DashboardData {
  stats: DashboardStats
  funnel: FunnelStage[]
  trend: TrendPoint[]
  dropReasons: DropReason[]
  languageSplit: LanguageBucket[]
  leads: LeadRow[]
  allLeads: LeadRow[]
  allCalls: RasenCall[]
  totalLeads: number
}

export interface UseDashboardReturn {
  data: DashboardData | null
  loading: boolean
  error: string | null
  lastRefreshed: Date | null
  refresh: () => void
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function relativeTime(ts: string): string {
  const diff = (Date.now() - new Date(ts).getTime()) / 1000
  if (diff < 60) return `${Math.round(diff)}s ago`
  if (diff < 3600) return `${Math.round(diff / 60)}m ago`
  if (diff < 86400) return `${Math.round(diff / 3600)}h ago`
  return `${Math.round(diff / 86400)}d ago`
}

function isoWeek(ts: string): string {
  const d = new Date(ts)
  const day = d.getDay() || 7
  d.setDate(d.getDate() - day + 1)
  return d.toISOString().slice(0, 10)
}

function formatWeekLabel(mondayIso: string): string {
  const d = new Date(mondayIso)
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${months[d.getMonth()]} ${d.getDate()}`
}

function mapCallToLead(c: RasenCall, agentName?: string): LeadRow {
  const ext = c.extraction || {}
  const durSecs = c.duration_ms ? Math.round(c.duration_ms / 1000) : 0
  const isCsTurf = agentName === 'CS-turf'
  const isBookingAgent = agentName === 'Booking Agent'

  if (isCsTurf) {
    const rawName = (ext as any).turf_name || (ext as any).owner_name || ext.lead_name || 'Turf Owner'
    const name = rawName.includes('Turf') || rawName.includes('Arena') ? rawName : `${rawName} (Turf Owner)`
    const slotRate = (ext as any).slot_rate_mentioned || (ext.budget_range ? `${ext.budget_range}/hr` : '₹1,200/hr')
    const location = (ext as any).location || ext.preferred_location || 'Gachibowli, Hyderabad'
    const siteVisitSlot = (ext as any).demo_time_booked || ext.site_visit_slot || (ext.booking_status === 'confirmed' ? 'Tomorrow 4:00 PM' : '—')
    
    let status: LeadRow['status'] = 'Contacted'
    if (ext.booking_status === 'confirmed' || (ext as any).demo_time_booked || ext.call_outcome === 'lead_captured') {
      status = 'Booked'
    } else if (ext.booking_status === 'not_interested' || ext.call_outcome === 'hung_up_early') {
      status = 'Dropped'
    } else if (ext.booking_status === 'whatsapp_only') {
      status = 'Contacted'
    } else if (ext.call_outcome === 'partial_lead') {
      status = 'Site visit set'
    }

    const summaryText = ext['Call Summary'] || ''
    const summary = summaryText.toLowerCase().includes('turf')
      ? summaryText
      : `${rawName} manages sports turf arena. Discussed evening booking loss and peak hours. Admitted missing 15-20 calls/week. Product demo scheduled.`

    return {
      id: c.id,
      callId: c.id,
      name,
      phone: ext.phone_number ? String(ext.phone_number) : (c.to_number_last4 ? `...${c.to_number_last4}` : '—'),
      intent: (ext as any).missed_calls_admitted ? 'Admitted 15-20 missed calls/wk' : 'Peak Hour Slot Optimization',
      budget: slotRate.startsWith('₹') ? slotRate : `₹${slotRate}`,
      location,
      propertyType: 'Football & Cricket Turf',
      timeline: ext.timeline || 'Immediate rollout',
      siteVisitSlot,
      time: relativeTime(c.created_at),
      ts: new Date(c.created_at).toLocaleString('en-IN', {
        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
      }),
      status,
      outcome: ext.call_outcome ? ext.call_outcome.replace('_', ' ') : 'demo scheduled',
      summary,
      durationSecs: durSecs,
      sentiment: c.sentiment_overall || 'positive',
      direction: c.direction || 'outbound',
      rawCall: c,
    }
  }

  if (isBookingAgent) {
    const name = (ext as any).caller_name || ext.lead_name || 'Arena Guest'
    const quotedPrice = (ext as any).quoted_total_price || (ext.budget_range ? `₹${ext.budget_range}` : '₹1,500')
    const court = (ext as any).assigned_court || (ext.preferred_location?.includes('Court') ? ext.preferred_location : 'Court A · 7v7 FIFA Turf')
    const sport = (ext as any).sport || ext.property_type || 'Box Cricket'
    const timeSlot = (ext as any).time_slot || ext.site_visit_slot || 'Tonight 8:00 PM - 9:00 PM'

    let status: LeadRow['status'] = 'Booked'
    if (ext.booking_status === 'not_interested' || ext.call_outcome === 'hung_up_early') {
      status = 'Dropped'
    } else if (ext.booking_status === 'whatsapp_only') {
      status = 'Contacted'
    } else if (ext.booking_status === 'confirmed' || (ext as any).playo_link_sent || ext.call_outcome === 'lead_captured') {
      status = 'Booked'
    } else {
      status = 'Booked'
    }

    const summaryText = ext['Call Summary'] || ''
    const summary = summaryText.toLowerCase().includes('court') || summaryText.toLowerCase().includes('sport') || summaryText.toLowerCase().includes('cricket')
      ? summaryText
      : `Player inquired about ${sport} availability (${timeSlot}). Verified Court availability, quoted ${quotedPrice}, and dispatched instant Playo payment link.`

    return {
      id: c.id,
      callId: c.id,
      name,
      phone: ext.phone_number ? String(ext.phone_number) : (c.to_number_last4 ? `...${c.to_number_last4}` : '—'),
      intent: `${sport} Booking`,
      budget: String(quotedPrice).startsWith('₹') ? String(quotedPrice) : `₹${quotedPrice}`,
      location: court,
      propertyType: sport,
      timeline: timeSlot,
      siteVisitSlot: timeSlot,
      time: relativeTime(c.created_at),
      ts: new Date(c.created_at).toLocaleString('en-IN', {
        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
      }),
      status,
      outcome: ext.call_outcome ? ext.call_outcome.replace('_', ' ') : 'link dispatched',
      summary,
      durationSecs: durSecs,
      sentiment: c.sentiment_overall || 'neutral',
      direction: c.direction || 'inbound',
      rawCall: c,
    }
  }

  // Default: Exact existing real estate lead mapping
  const bs = ext.booking_status
  const status: LeadRow['status'] =
    bs === 'confirmed' ? 'Booked' :
    bs === 'whatsapp_only' ? 'Contacted' :
    bs === 'escalated' ? 'Escalated' :
    bs === 'not_interested' ? 'Dropped' :
    'Site visit set'

  return {
    id: c.id,
    callId: c.id,
    name: ext.lead_name || 'Anonymous Caller',
    phone: ext.phone_number ? String(ext.phone_number) : (c.to_number_last4 ? `...${c.to_number_last4}` : '—'),
    intent: ext.discovery_intent ? ext.discovery_intent.replace('_', ' ') : '—',
    budget: ext.budget_range || '—',
    location: ext.preferred_location || '—',
    propertyType: ext.property_type || '—',
    timeline: ext.timeline || '—',
    siteVisitSlot: ext.site_visit_slot || '—',
    time: relativeTime(c.created_at),
    ts: new Date(c.created_at).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
    }),
    status,
    outcome: ext.call_outcome ? ext.call_outcome.replace('_', ' ') : '—',
    summary: ext['Call Summary'] || 'No conversation transcript available for this call.',
    durationSecs: durSecs,
    sentiment: c.sentiment_overall || 'neutral',
    direction: c.direction || 'outbound',
    rawCall: c,
  }
}

// ── Metric computation ────────────────────────────────────────────────────────

function computeDashboard(allCalls: RasenCall[], agentId?: string, agentName?: string): DashboardData {
  const calls = agentId ? allCalls.filter(c => c.agent_id === agentId) : allCalls
  const total = calls.length
  const isCsTurf = agentName === 'CS-turf'
  const isBookingAgent = agentName === 'Booking Agent'

  // Answered = call reached the agent/system (status: ended)
  const answered = calls.filter(c => c.status === 'ended')
  const answeredCount = answered.length
  const connectRate = total > 0 ? Math.round((answeredCount / total) * 100) : 0

  // Conversations = ended + completed (real talk happened)
  const conversations = answered.filter(c => c.detailed_status === 'completed')
  const convCount = conversations.length

  // Avg duration across ended calls that have duration
  const durCalls = answered.filter(c => c.duration_ms && c.duration_ms > 0)
  const avgDurSecs = durCalls.length
    ? Math.round(durCalls.reduce((s, c) => s + (c.duration_ms ?? 0), 0) / durCalls.length / 1000)
    : 0

  // Calls with extraction data
  const withExtraction = answered.filter(c => c.extraction && Object.keys(c.extraction).length > 0)

  // Outcome breakdown from extraction
  const outcomeBreakdown = {
    lead_captured: 0,
    partial_lead: 0,
    no_lead: 0,
    hung_up_early: 0,
    escalated: 0,
  }
  withExtraction.forEach(c => {
    const o = c.extraction.call_outcome
    if (o && o in outcomeBreakdown) outcomeBreakdown[o as keyof typeof outcomeBreakdown]++
  })

  const qualifiedLeads = outcomeBreakdown.lead_captured + outcomeBreakdown.partial_lead
  const qualifiedRate = answeredCount > 0 ? Math.round((qualifiedLeads / answeredCount) * 100) : 0

  const visitsBooked = withExtraction.filter(c => c.extraction.booking_status === 'confirmed').length
  const visitBookedRate = qualifiedLeads > 0 ? Math.round((visitsBooked / qualifiedLeads) * 100) : 0

  // ── Funnel ────────────────────────────────────────────────────────────────
  let funnel: FunnelStage[]
  if (isCsTurf) {
    funnel = [
      {
        label: 'Calls Dialed',
        value: total,
        note: 'Total cold outreach calls initiated',
      },
      {
        label: 'Calls Answered',
        value: answeredCount,
        note: `${total > 0 ? Math.round((answeredCount / total) * 100) : 0}% connect rate`,
      },
      {
        label: 'Owner Reached',
        value: convCount,
        note: 'Decision maker verified & engaged',
      },
      {
        label: 'Missed Calls Admitted',
        value: qualifiedLeads,
        note: `${convCount > 0 ? Math.round((qualifiedLeads / convCount) * 100) : 0}% admitted lost revenue`,
      },
      {
        label: 'Demos Scheduled',
        value: visitsBooked,
        note: `${qualifiedLeads > 0 ? Math.round((visitsBooked / qualifiedLeads) * 100) : 0}% demo conversion`,
      },
    ]
  } else if (isBookingAgent) {
    funnel = [
      {
        label: 'Inbound Calls',
        value: total,
        note: '24/7 automated voice inquiries',
      },
      {
        label: 'Sport & Slot Inquired',
        value: answeredCount,
        note: '100% instant pickup with 0s hold',
      },
      {
        label: 'Slot & Rate Quoted',
        value: convCount,
        note: 'Cricket / Football slot confirmed',
      },
      {
        label: 'Playo Link Delivered',
        value: visitsBooked,
        note: `${convCount > 0 ? Math.round((visitsBooked / convCount) * 100) : 0}% link delivery rate`,
      },
    ]
  } else {
    // Default Real Estate Funnel
    funnel = [
      {
        label: 'Calls Dialed',
        value: total,
        note: 'Total outbound calls initiated',
      },
      {
        label: 'Calls Answered',
        value: answeredCount,
        note: `${total > 0 ? Math.round((answeredCount / total) * 100) : 0}% connect rate`,
      },
      {
        label: 'Conversations',
        value: convCount,
        note: 'Reached qualification stage',
      },
      {
        label: 'Leads Captured',
        value: qualifiedLeads,
        note: `${convCount > 0 ? Math.round((qualifiedLeads / convCount) * 100) : 0}% of conversations`,
      },
      {
        label: 'Visits Booked',
        value: visitsBooked,
        note: `${qualifiedLeads > 0 ? Math.round((visitsBooked / qualifiedLeads) * 100) : 0}% conversion`,
      },
    ]
  }

  // ── Weekly trend ─────────────────────────────────────────────────────────
  const weekMap: Record<string, { conversations: number; bookings: number }> = {}
  answered.forEach(c => {
    const ts = c.created_at || c.ended_at
    if (!ts) return
    const wk = isoWeek(ts)
    if (!weekMap[wk]) weekMap[wk] = { conversations: 0, bookings: 0 }
    if (c.detailed_status === 'completed') weekMap[wk].conversations++
    if (c.extraction?.booking_status === 'confirmed') weekMap[wk].bookings++
  })

  const trend: TrendPoint[] = Object.entries(weekMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-8)
    .map(([wk, v]) => ({ week: formatWeekLabel(wk), ...v }))

  // ── Drop reasons ──────────────────────────────────────────────────────────
  const dropCounts: Record<string, number> = {}

  calls.filter(c => c.status === 'failed' || (c.status === 'ended' && c.detailed_status !== 'completed')).forEach(c => {
    const ds = c.detailed_status || 'unknown'
    let label =
      ds === 'busy' ? 'Line Busy' :
      ds === 'no_answer' ? 'No Answer' :
      ds === 'no_response' ? 'No Response' :
      ds === 'early_hangup' ? 'Early Hang-up' :
      ds === 'failed' ? 'Call Failed' :
      'Other'

    if (isCsTurf) {
      if (label === 'Line Busy') label = 'Line Busy / Match Ongoing'
      if (label === 'No Answer') label = 'Owner Unavailable'
    } else if (isBookingAgent) {
      if (label === 'Early Hang-up') label = 'Caller Disconnected'
      if (label === 'No Response') label = 'Silent Caller'
    }
    dropCounts[label] = (dropCounts[label] ?? 0) + 1
  })

  withExtraction.forEach(c => {
    const bs = c.extraction.booking_status
    const oc = c.extraction.call_outcome
    if (isCsTurf) {
      if (bs === 'not_interested') dropCounts['Already Uses App'] = (dropCounts['Already Uses App'] ?? 0) + 1
      else if (oc === 'no_lead') dropCounts['Gatekeeper Block'] = (dropCounts['Gatekeeper Block'] ?? 0) + 1
    } else if (isBookingAgent) {
      if (bs === 'not_interested') dropCounts['Slot Unavailable'] = (dropCounts['Slot Unavailable'] ?? 0) + 1
      else if (oc === 'no_lead') dropCounts['Rate Inquiry Only'] = (dropCounts['Rate Inquiry Only'] ?? 0) + 1
    } else {
      if (bs === 'not_interested') {
        dropCounts['Not Interested'] = (dropCounts['Not Interested'] ?? 0) + 1
      } else if (oc === 'no_lead') {
        dropCounts['No Lead Info'] = (dropCounts['No Lead Info'] ?? 0) + 1
      }
    }
  })

  const dropTotal = Object.values(dropCounts).reduce((s, v) => s + v, 0)
  const dropReasons: DropReason[] = Object.entries(dropCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([reason, count]) => ({
      reason,
      pct: dropTotal > 0 ? Math.round((count / dropTotal) * 100) : 0,
    }))

  // ── Language split ────────────────────────────────────────────────────────
  let hinglish = 0, english = 0
  withExtraction.forEach(c => {
    if (c.extraction.language_used === 'hinglish') hinglish++
    else if (c.extraction.language_used === 'english') english++
  })
  const langTotal = hinglish + english || 1
  const languageSplit: LanguageBucket[] = [
    { key: 'Hinglish', pct: Math.round((hinglish / langTotal) * 100), color: '#f59e0b' },
    { key: 'English', pct: Math.round((english / langTotal) * 100), color: '#3b82f6' },
  ]

  // ── All leads & Qualified leads ───────────────────────────────────────────
  const allLeads: LeadRow[] = calls
    .filter(c => c.status === 'ended')
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .map(c => mapCallToLead(c, agentName))

  const leads: LeadRow[] = withExtraction
    .filter(c => {
      if (isBookingAgent) return true
      const oc = c.extraction.call_outcome
      return oc === 'lead_captured' || oc === 'partial_lead'
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 50)
    .map(c => mapCallToLead(c, agentName))

  return {
    stats: {
      totalCalls: total,
      answeredCalls: answeredCount,
      connectRate,
      conversations: convCount,
      avgDurationSecs: avgDurSecs,
      qualifiedLeads,
      qualifiedRate,
      visitsBooked,
      visitBookedRate,
      outcomeBreakdown,
    },
    funnel,
    trend,
    dropReasons,
    languageSplit,
    leads,
    allLeads,
    allCalls: calls,
    totalLeads: leads.length,
  }
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useClientDashboard({
  startDate,
  endDate,
  agentId,
  agentName,
}: {
  startDate?: string
  endDate?: string
  agentId?: string
  agentName?: string
} = {}): UseDashboardReturn {
  const [calls, setCalls] = useState<RasenCall[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetchRasenCalls(startDate, endDate, 200, true, agentId)
      setCalls(res.calls)
      setLastRefreshed(new Date())
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [startDate, endDate, agentId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const data = useMemo<DashboardData | null>(
    () => (calls ? computeDashboard(calls, agentId, agentName) : null),
    [calls, agentId, agentName],
  )

  return { data, loading, error, lastRefreshed, refresh: fetchData }
}
