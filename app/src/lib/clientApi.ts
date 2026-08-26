/**
 * clientApi.ts
 * API service for the Wakilz Client Dashboard & Outbound Calling System.
 *
 * Authentication flow:
 *   1. Exchange client key (wakilz_demo) for a scoped 24h JWT via
 *      GET /api/client/verify?key=<key>
 *   2. Use that JWT as  Authorization: Bearer <token>  on all subsequent
 *      requests (/api/rasen/*).
 *
 * The token is cached in memory for the lifetime of the browser tab.
 */

// Use relative URL in local dev (via Vite proxy). In production, fallback to VITE_API_BASE_URL.
const API_BASE = ((import.meta.env.VITE_CLIENT_API_URL || import.meta.env.VITE_API_BASE_URL || '') as string).replace(/\/+$/, '')

const CLIENT_KEY = 'wakilz_demo'

// In-memory JWT cache — refreshes on page reload
let _cachedToken: string | null = null

// ── Auth ─────────────────────────────────────────────────────────────────────

export async function getClientToken(): Promise<string> {
  if (_cachedToken) return _cachedToken

  const url = `${API_BASE}/api/client/verify?key=${encodeURIComponent(CLIENT_KEY)}`
  const res = await fetch(url)
  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText)
    throw new Error(`Client auth failed (${res.status}): ${msg}`)
  }
  const data: { token: string; clientId: string; displayName: string } =
    await res.json()

  _cachedToken = data.token
  return _cachedToken
}

/** Call this on sign-out or when a 401 is received to force a fresh exchange. */
export function clearClientToken() {
  _cachedToken = null
}

async function _authedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = await getClientToken()
  const headers = new Headers(options.headers || {})
  headers.set('Authorization', `Bearer ${token}`)
  if (options.body && typeof options.body === 'string' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const targetUrl = url.startsWith('http') ? url : `${API_BASE}${url}`
  let res = await fetch(targetUrl, { ...options, headers })

  if (res.status === 401) {
    clearClientToken()
    const fresh = await getClientToken()
    headers.set('Authorization', `Bearer ${fresh}`)
    res = await fetch(targetUrl, { ...options, headers })
  }

  return res
}

// ── Rasen Inbound & Live Calls ────────────────────────────────────────────────

export interface RasenCall {
  id: string
  agent_id: string
  direction: string
  purpose: string
  status: string
  detailed_status: string
  provider: string
  to_number_last4: string | null
  duration_ms: number | null
  created_at: string
  started_at: string | null
  ended_at: string | null
  cost_paise: number | null
  turn_count: number | null
  sentiment_overall: string | null
  extraction: {
    lead_name?: string
    discovery_intent?: 'exploring' | 'specific_project' | 'investment' | null
    preferred_location?: string
    budget_range?: string
    property_type?: string
    timeline?: string
    phone_number?: string | number | null
    contact_preference?: string
    site_visit_slot?: string
    booking_status?: 'confirmed' | 'whatsapp_only' | 'not_interested' | 'escalated' | 'incomplete' | null
    objection_raised?: boolean | null
    language_used?: 'hinglish' | 'english' | null
    call_outcome?: 'lead_captured' | 'partial_lead' | 'no_lead' | 'hung_up_early' | 'escalated' | null
    'Call Summary'?: string
    'Goal met'?: boolean
  }
}

export interface RasenCallsResponse {
  calls: RasenCall[]
  total_fetched: number
  has_analysis: boolean
}

export async function fetchRasenCalls(
  startDate?: string,
  endDate?: string,
  maxCalls = 200,
  includeAnalysis = true,
): Promise<RasenCallsResponse> {
  const params = new URLSearchParams({
    max_calls: String(maxCalls),
    include_analysis: String(includeAnalysis),
  })
  if (startDate) params.set('start_date', startDate)
  if (endDate) params.set('end_date', endDate)

  const res = await _authedFetch(`${API_BASE}/api/rasen/calls?${params}`)
  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText)
    throw new Error(`Rasen calls fetch failed (${res.status}): ${msg}`)
  }
  return res.json()
}

export async function fetchCallRecordingUrl(callId: string): Promise<string | null> {
  try {
    const res = await _authedFetch(`${API_BASE}/api/rasen/calls/${callId}/recording`)
    if (!res.ok) return null
    const data = await res.json()
    return data.url || null
  } catch {
    return null
  }
}

// ── Rasen Outbound & Batch Calling Types & APIs ───────────────────────────────

export interface RasenAgent {
  id: string
  name: string
  direction?: string
  published_version_no?: number
  published_at?: string
}

export interface RasenPhoneNumber {
  id: string
  phone: string
  label?: string
  provider?: string
  status?: string
}

export interface BatchRecipient {
  id?: string
  phone_number: string
  variables?: Record<string, any>
  first_message?: string
  system_prompt?: string
  language?: string
  voice_id?: string
  status?: 'completed' | 'calling' | 'failed' | 'pending'
  duration_ms?: number
  created_at?: string
}

export interface BatchCall {
  id: string
  workspace_id?: string
  agent_id: string
  agent_name?: string
  phone_number_id?: string
  phone_number?: string
  name: string
  status: 'scheduled' | 'running' | 'completed' | 'failed' | 'cancelled'
  ringing_timeout?: number
  concurrency_limit?: number
  scheduled_at?: string | null
  total: number
  calling: number
  completed: number
  failed: number
  duration_secs?: number
  created_at: string
  updated_at?: string
}

export interface CreateBatchPayload {
  name: string
  agent_id?: string
  phone_number_id?: string
  ringing_timeout?: number
  concurrency_limit?: number
  scheduled_at?: string | null
  recipients: {
    phone_number: string
    variables?: Record<string, any>
    first_message?: string
    system_prompt?: string
    language?: string
    voice_id?: string
  }[]
}

export interface TestCallPayload {
  phone_number: string
  agent_id?: string
  phone_number_id?: string
  variables?: Record<string, any>
}

export async function fetchAgents(): Promise<RasenAgent[]> {
  const res = await _authedFetch(`${API_BASE}/api/rasen/agents`)
  if (!res.ok) throw new Error('Failed to fetch voice agents')
  return res.json()
}

export async function fetchPhoneNumbers(): Promise<RasenPhoneNumber[]> {
  const res = await _authedFetch(`${API_BASE}/api/rasen/phone-numbers`)
  if (!res.ok) throw new Error('Failed to fetch caller ID phone numbers')
  return res.json()
}

export async function fetchBatchCalls(limit = 50, offset = 0): Promise<{ items: BatchCall[]; total: number }> {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) })
  const res = await _authedFetch(`${API_BASE}/api/rasen/batch-calls?${params}`)
  if (!res.ok) throw new Error('Failed to fetch outbound campaigns')
  return res.json()
}

export async function createBatchCall(payload: CreateBatchPayload): Promise<BatchCall> {
  const res = await _authedFetch(`${API_BASE}/api/rasen/batch-calls`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText)
    throw new Error(`Failed to create batch call: ${msg}`)
  }
  return res.json()
}

export async function fetchBatchDetails(batchId: string): Promise<BatchCall> {
  const res = await _authedFetch(`${API_BASE}/api/rasen/batch-calls/${batchId}`)
  if (!res.ok) throw new Error('Failed to fetch campaign details')
  return res.json()
}

export async function fetchBatchRecipients(batchId: string): Promise<{ items: BatchRecipient[] }> {
  const res = await _authedFetch(`${API_BASE}/api/rasen/batch-calls/${batchId}/recipients`)
  if (!res.ok) throw new Error('Failed to fetch campaign recipients')
  return res.json()
}

export async function cancelBatchCall(batchId: string): Promise<any> {
  const res = await _authedFetch(`${API_BASE}/api/rasen/batch-calls/${batchId}/cancel`, {
    method: 'POST',
  })
  if (!res.ok) throw new Error('Failed to cancel campaign')
  return res.json()
}

export async function triggerTestCall(payload: TestCallPayload): Promise<any> {
  const res = await _authedFetch(`${API_BASE}/api/rasen/test-call`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText)
    throw new Error(`Test call failed: ${msg}`)
  }
  return res.json()
}
