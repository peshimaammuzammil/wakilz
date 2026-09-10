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

// Production: VITE_API_BASE_URL → https://wakilz-voice-635406175951.asia-south1.run.app
// Local dev: empty string → Vite proxy forwards /api/* to localhost:8080
const API_BASE = ((import.meta.env.VITE_API_BASE_URL || '') as string).replace(/\/+$/, '')

let CLIENT_KEY = 'wakilz_demo'

export function setClientKey(key: string) {
  CLIENT_KEY = key
  clearClientToken() // Force re-fetch token for new client
}

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
  agentId?: string,
): Promise<RasenCallsResponse> {
  const params = new URLSearchParams({
    max_calls: String(maxCalls),
    include_analysis: String(includeAnalysis),
  })
  if (startDate) params.set('start_date', startDate)
  if (endDate) params.set('end_date', endDate)
  if (agentId) params.set('agent_id', agentId)

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

/**
 * Fetch a single call by ID — searches /api/rasen/calls list (always deployed).
 * Falls back gracefully; never throws.
 */
export async function fetchCallById(callId: string): Promise<any | null> {
  try {
    // Try direct endpoint first (available after backend redeploy)
    const direct = await _authedFetch(`${API_BASE}/api/rasen/calls/${callId}`)
    if (direct.ok) return await direct.json()
  } catch (_) {}

  // Fallback: search the list — always works on deployed backend
  try {
    const listRes = await _authedFetch(`${API_BASE}/api/rasen/calls?max_calls=50&include_analysis=true`)
    if (listRes.ok) {
      const data = await listRes.json()
      const match = (data.calls || []).find((c: any) => c.id === callId)
      if (match) return match
    }
  } catch (_) {}

  return null
}

/**
 * Fetch full call analysis (transcript + extraction).
 * Tries /analysis endpoint first, falls back to list search.
 */
export async function fetchCallAnalysisFull(callId: string): Promise<{
  transcript: any[]
  extraction: Record<string, any>
  status: string
  recording_url?: string
  _raw?: any
}> {
  // Try direct analysis endpoint (available after backend redeploy)
  try {
    const res = await _authedFetch(`${API_BASE}/api/rasen/calls/${callId}/analysis`)
    if (res.ok) {
      const d = await res.json()

      // Transcript: available from analysis endpoint post-call
      const transcript =
        d.transcript ??
        d.turns ??
        d.conversation_turns ??
        d.messages ??
        []

      // Extraction: Rasen returns {fields: [{id, name, value, ...}]}
      // Convert to a flat {name: value} map for UI consumption
      const rawEx = d.extraction || {}
      const extraction: Record<string, any> = {}
      if (Array.isArray(rawEx.fields)) {
        for (const f of rawEx.fields) {
          if (f.name !== undefined) extraction[f.name] = f.value ?? ''
          if (f.id !== undefined && !extraction[f.id]) extraction[f.id] = f.value ?? ''
        }
      }
      // Also handle legacy {data: {...}} format
      if (rawEx.data && typeof rawEx.data === 'object') {
        Object.assign(extraction, rawEx.data)
      }

      return {
        transcript,
        extraction,
        status: rawEx.status ?? d.extraction?.status ?? d.status ?? 'unknown',
        recording_url: d.recording_url,
        _raw: d,
      }
    }
  } catch (_) {}

  // Fallback: get from list (extraction only, no transcript until backend redeploy)
  try {
    const match = await fetchCallById(callId)
    if (match) {
      const transcript =
        match.transcript ??
        match.turns ??
        match.conversation_turns ??
        []

      return {
        transcript,
        extraction: match.extraction || {},
        status: match.detailed_status || match.status || 'unknown',
        recording_url: match.recording_url,
        _raw: match,
      }
    }
  } catch (_) {}

  return { transcript: [], extraction: {}, status: 'unknown' }
}

/**
 * Poll live transcript utterances for an active (or recently ended) call.
 *
 * Uses the dedicated Rasen transcript endpoint (NOT /analysis).
 * Items have: { id, role: "user"|"assistant", text, is_final, ... }
 *
 * Usage:
 *   let afterId = 0
 *   const { items, next_after_id, stream_complete } = await fetchLiveTranscript(callId, afterId)
 *   afterId = next_after_id
 *   // repeat until stream_complete === true
 */
export async function fetchLiveTranscript(
  callId: string,
  afterId: number = 0,
  limit: number = 200,
): Promise<{
  call_id: string
  status: string
  items: Array<{
    id: number
    role: 'user' | 'assistant'
    text: string
    is_final: boolean
    interrupted: boolean
    language: string | null
    offset_ms: number | null
    created_at: string
  }>
  next_after_id: number
  stream_complete: boolean
}> {
  try {
    const res = await _authedFetch(
      `${API_BASE}/api/rasen/calls/${callId}/transcript?after_id=${afterId}&limit=${limit}`
    )
    if (res.ok) return await res.json()
  } catch (_) {}
  return { call_id: callId, status: 'unknown', items: [], next_after_id: afterId, stream_complete: false }
}

/**
 * Send hangup signal. Tries direct endpoint first, then batch cancel.
 */
export async function sendHangup(callId: string): Promise<void> {
  // Try direct hangup (available after backend redeploy)
  try {
    const res = await _authedFetch(`${API_BASE}/api/rasen/calls/${callId}/hangup`, { method: 'POST' })
    if (res.ok) return
  } catch (_) {}

  // Fallback: attempt batch cancel (unlikely to match but harmless)
  try {
    await _authedFetch(`${API_BASE}/api/rasen/batch-calls/${callId}/cancel`, { method: 'POST' })
  } catch (_) {}
}

/** @deprecated Use fetchCallById / fetchCallAnalysisFull / sendHangup instead */
export async function fetchCallRecording(callId: string): Promise<{ url: string; call_id: string }> {
  try {
    const res = await _authedFetch(`${API_BASE}/api/rasen/calls/${callId}/recording`)
    if (res.ok) return await res.json()
  } catch (_) {}
  return { url: '', call_id: callId }
}


