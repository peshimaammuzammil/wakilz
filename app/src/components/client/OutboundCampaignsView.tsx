/**
 * OutboundCampaignsView.tsx
 *
 * Complete Outbound Batch Voice Calling suite for Wakilz Client Portal:
 * 1. Campaigns List View (all outbound batches, status, progress, duration, search)
 * 2. Create Batch Call View (dual-pane, CSV/XLS drag-drop, E.164 validation,
 *    variable substitution preview, template download, timing, single test call)
 * 3. Campaign Details & Recipient Diagnostics (live progress, recipient table, CSV download)
 */

import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  PhoneCall, Plus, Search, Upload, Download, Calendar, Clock,
  CheckCircle2, AlertCircle, Play, Pause, RefreshCw, ChevronLeft,
  Phone, Users, Shield, ArrowRight, X, ExternalLink, Zap,
  Sliders, FileText, Check, AlertTriangle, Globe
} from 'lucide-react'
import {
  fetchAgents, fetchPhoneNumbers, fetchBatchCalls, createBatchCall,
  fetchBatchDetails, fetchBatchRecipients, cancelBatchCall, triggerTestCall,
  type RasenAgent, type RasenPhoneNumber, type BatchCall, type BatchRecipient,
  type CreateBatchPayload
} from '@/lib/clientApi'

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

interface ParsedRecipient {
  phone_number: string
  isValid: boolean
  error?: string
  variables: Record<string, string>
}

export default function OutboundCampaignsView() {
  // Navigation mode: 'list' | 'create' | 'details'
  const [viewMode, setViewMode] = useState<'list' | 'create' | 'details'>('list')
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null)

  // Remote data
  const [campaigns, setCampaigns] = useState<BatchCall[]>([])
  const [agents, setAgents] = useState<RasenAgent[]>([])
  const [phoneNumbers, setPhoneNumbers] = useState<RasenPhoneNumber[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>('')

  // Create Batch State
  const [batchName, setBatchName] = useState<string>('Untitled Batch')
  const [selectedAgentId, setSelectedAgentId] = useState<string>('')
  const [selectedPhoneId, setSelectedPhoneId] = useState<string>('')
  const [ringingTimeout, setRingingTimeout] = useState<number>(60)
  const [concurrencyLimit, setConcurrencyLimit] = useState<string>('Auto')
  const [timing, setTiming] = useState<'immediate' | 'scheduled'>('immediate')
  const [scheduledAt, setScheduledAt] = useState<string>('')
  const [recipients, setRecipients] = useState<ParsedRecipient[]>([])
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  // Single Test Call Modal State
  const [showTestModal, setShowTestModal] = useState<boolean>(false)
  const [testPhoneNumber, setTestPhoneNumber] = useState<string>('')
  const [testVariables, setTestVariables] = useState<string>('{"name": "Test Lead", "city": "Hyderabad"}')
  const [testCallStatus, setTestCallStatus] = useState<string | null>(null)
  const [isTesting, setIsTesting] = useState<boolean>(false)

  // Batch Details State
  const [activeBatch, setActiveBatch] = useState<BatchCall | null>(null)
  const [batchRecipients, setBatchRecipients] = useState<BatchRecipient[]>([])
  const [loadingDetails, setLoadingDetails] = useState<boolean>(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── 1. Initial Load ────────────────────────────────────────────────────────
  const loadInitialData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [batchesRes, agentsRes, pnsRes] = await Promise.all([
        fetchBatchCalls(50, 0),
        fetchAgents(),
        fetchPhoneNumbers(),
      ])
      setCampaigns(batchesRes.items || [])
      setAgents(agentsRes || [])
      setPhoneNumbers(pnsRes || [])

      if (agentsRes.length > 0 && !selectedAgentId) {
        setSelectedAgentId(agentsRes[0].id)
      }
      if (pnsRes.length > 0 && !selectedPhoneId) {
        setSelectedPhoneId(pnsRes[0].id)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }, [selectedAgentId, selectedPhoneId])

  useEffect(() => {
    loadInitialData()
  }, [loadInitialData])

  // ── 2. Poll running campaigns ──────────────────────────────────────────────
  useEffect(() => {
    const hasRunning = campaigns.some(c => c.status === 'running' || c.status === 'scheduled')
    if (!hasRunning) return

    const interval = setInterval(async () => {
      try {
        const res = await fetchBatchCalls(50, 0)
        setCampaigns(res.items || [])
      } catch (err) {
        console.error('Failed to poll campaigns:', err)
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [campaigns])

  // ── 3. Load Campaign Details ───────────────────────────────────────────────
  const openBatchDetails = async (batchId: string) => {
    setSelectedBatchId(batchId)
    setViewMode('details')
    setLoadingDetails(true)
    try {
      const [details, recips] = await Promise.all([
        fetchBatchDetails(batchId),
        fetchBatchRecipients(batchId),
      ])
      setActiveBatch(details)
      setBatchRecipients(recips.items || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoadingDetails(false)
    }
  }

  // ── 4. CSV / XLS Parser & Validator ────────────────────────────────────────
  const parseCSVText = (text: string) => {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
    if (lines.length < 2) {
      alert('CSV must contain a header row and at least 1 recipient row.')
      return
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, '').toLowerCase())
    const phoneIdx = headers.findIndex(h => h === 'phone_number' || h === 'phone' || h === 'mobile' || h === 'number')

    if (phoneIdx === -1) {
      alert('CSV format error: A "phone_number" column is required in E.164 format (e.g. +919876543210).')
      return
    }

    const parsed: ParsedRecipient[] = []

    for (let i = 1; i < lines.length; i++) {
      const rawCols = lines[i].split(',').map(c => c.trim().replace(/^["']|["']$/g, ''))
      if (rawCols.length === 0 || (rawCols.length === 1 && !rawCols[0])) continue

      let rawPhone = rawCols[phoneIdx] || ''
      rawPhone = rawPhone.replace(/[\s\-()]/g, '')
      if (!rawPhone.startsWith('+')) {
        if (rawPhone.length === 10) rawPhone = `+91${rawPhone}`
        else rawPhone = `+${rawPhone}`
      }

      // E.164 validation regex: ^\+[1-9]\d{7,14}$
      const isValid = /^\+[1-9]\d{7,14}$/.test(rawPhone)

      const vars: Record<string, string> = {}
      headers.forEach((h, colIdx) => {
        if (colIdx !== phoneIdx && rawCols[colIdx]) {
          vars[h] = rawCols[colIdx]
        }
      })

      parsed.push({
        phone_number: rawPhone,
        isValid,
        error: isValid ? undefined : 'Invalid E.164 format (e.g. +919876543210)',
        variables: vars,
      })
    }

    setRecipients(parsed)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      if (text) parseCSVText(text)
    }
    reader.readAsText(file)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      if (text) parseCSVText(text)
    }
    reader.readAsText(file)
  }

  // ── 5. Download Sample Template ─────────────────────────────────────────────
  const downloadTemplate = () => {
    const templateContent =
      `phone_number,name,city,budget,project,timeline\n` +
      `+919876543210,Rahul Sharma,Hyderabad,1.5 Cr,Skyline Meridian,Immediate\n` +
      `+919812345678,Priya Patel,Bangalore,2.2 Cr,Greenwood Enclave,3-6 Months\n` +
      `+919988776655,Amit Verma,Gurgaon,95 Lakhs,Emerald Heights,Exploring\n`

    const blob = new Blob([templateContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'wakilz_outbound_recipients_template.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // ── 6. Submit Batch Campaign ────────────────────────────────────────────────
  const handleSubmitBatch = async () => {
    if (!batchName.trim()) {
      alert('Please enter a campaign name.')
      return
    }
    if (recipients.length === 0) {
      alert('Please upload recipients before launching.')
      return
    }
    const validRecipients = recipients.filter(r => r.isValid)
    if (validRecipients.length === 0) {
      alert('No valid recipients with E.164 phone numbers found. Please fix the phone numbers.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    const payload: CreateBatchPayload = {
      name: batchName,
      agent_id: selectedAgentId || undefined,
      phone_number_id: selectedPhoneId || undefined,
      ringing_timeout: ringingTimeout,
      concurrency_limit: concurrencyLimit === 'Auto' ? undefined : parseInt(concurrencyLimit, 10),
      scheduled_at: timing === 'scheduled' && scheduledAt ? new Date(scheduledAt).toISOString() : null,
      recipients: validRecipients.map(r => ({
        phone_number: r.phone_number,
        variables: r.variables,
      })),
    }

    try {
      const created = await createBatchCall(payload)
      alert(`Batch campaign "${created.name}" created successfully!`)
      setViewMode('list')
      loadInitialData()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── 7. Single Test Call ─────────────────────────────────────────────────────
  const handleTriggerTestCall = async () => {
    if (!testPhoneNumber.trim()) {
      alert('Please enter a phone number to test.')
      return
    }

    let parsedVars = {}
    try {
      parsedVars = JSON.parse(testVariables)
    } catch {
      alert('Custom variables must be a valid JSON object.')
      return
    }

    setIsTesting(true)
    setTestCallStatus('Dialing test number via Wakilz Voice Agent...')

    try {
      await triggerTestCall({
        phone_number: testPhoneNumber.trim(),
        agent_id: selectedAgentId || undefined,
        phone_number_id: selectedPhoneId || undefined,
        variables: parsedVars,
      })
      setTestCallStatus('✅ Call initiated! Your phone should ring shortly.')
      setTimeout(() => {
        setIsTesting(false)
      }, 3000)
    } catch (err) {
      setTestCallStatus(`❌ Test call failed: ${err instanceof Error ? err.message : String(err)}`)
      setIsTesting(false)
    }
  }

  // Filtered campaigns for list view
  const filteredCampaigns = campaigns.filter(c => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return c.name.toLowerCase().includes(q) || c.status.toLowerCase().includes(q)
  })

  // All custom variable keys in uploaded CSV
  const customVarKeys = Array.from(
    new Set(recipients.flatMap(r => Object.keys(r.variables)))
  )

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ color: T.textPrimary, fontFamily: 'var(--font-body)' }}>

      {/* ── Error Banner ── */}
      {error && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '14px 18px',
            background: T.redSoft,
            border: `1px solid rgba(248,113,113,0.3)`,
            borderRadius: 14,
            marginBottom: 24,
          }}
        >
          <AlertCircle size={18} color={T.red} style={{ flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: T.red }}>Action Error</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: T.textSecondary, marginTop: 2 }}>{error}</div>
          </div>
          <button
            onClick={() => setError(null)}
            style={{ background: 'none', border: 'none', color: T.textMuted, cursor: 'pointer' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* ── VIEW 1: CAMPAIGNS LIST ────────────────────────────────────────────── */}
      {viewMode === 'list' && (
        <div>
          {/* Header Row */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 24,
              flexWrap: 'wrap',
              gap: 16,
            }}
          >
            <div>
              <h1
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(22px, 2.2vw, 28px)',
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                  margin: 0,
                }}
              >
                Outbound Campaigns
              </h1>
              <p style={{ color: T.textSecondary, fontSize: 13.5, margin: '4px 0 0' }}>
                Run high-concurrency AI voice outreach batches with real-time analytics and lead qualification.
              </p>
            </div>

            <button
              id="create-new-campaign-btn"
              onClick={() => {
                setBatchName(`Campaign - ${new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}`)
                setRecipients([])
                setViewMode('create')
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'linear-gradient(135deg, #2A3FE0, #5A6CFF)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 12,
                padding: '10px 20px',
                fontSize: 13.5,
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(42, 63, 224, 0.4)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-1px)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              <Plus size={16} /> New Campaign
            </button>
          </div>

          {/* Search & Filter Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
              marginBottom: 20,
              background: T.surface,
              padding: '12px 18px',
              borderRadius: 14,
              border: `1px solid ${T.border}`,
              flexWrap: 'wrap',
            }}
          >
            <div style={{ position: 'relative', flex: '1 1 260px' }}>
              <Search
                size={16}
                color={T.textMuted}
                style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type="text"
                placeholder="Search outbound campaigns..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  background: T.deepNavy,
                  border: `1px solid ${T.borderStrong}`,
                  borderRadius: 10,
                  padding: '8px 12px 8px 36px',
                  fontSize: 13,
                  color: T.textPrimary,
                  fontFamily: 'var(--font-body)',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: T.textMuted }}>
                {campaigns.length} campaigns total
              </span>
              <button
                onClick={loadInitialData}
                style={{
                  background: T.surfaceLight,
                  border: `1px solid ${T.border}`,
                  borderRadius: 8,
                  padding: '7px 12px',
                  color: T.textSecondary,
                  fontSize: 12,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
                Refresh
              </button>
            </div>
          </div>

          {/* Campaigns Table */}
          <div
            style={{
              background: T.surface,
              borderRadius: 20,
              border: `1px solid ${T.border}`,
              overflow: 'hidden',
              boxShadow: '0 12px 32px rgba(0,0,0,0.25)',
            }}
          >
            {loading ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: T.textMuted }}>
                <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
                <div>Loading outbound campaigns...</div>
              </div>
            ) : filteredCampaigns.length === 0 ? (
              <div style={{ padding: '60px 20px', textAlign: 'center', color: T.textMuted }}>
                <PhoneCall size={36} color={T.slate} style={{ margin: '0 auto 14px' }} />
                <div style={{ fontSize: 16, fontWeight: 600, color: T.textPrimary }}>No outbound campaigns found</div>
                <p style={{ fontSize: 13, color: T.textSecondary, maxWidth: 420, margin: '6px auto 18px' }}>
                  Upload a lead list CSV and launch your first AI voice outreach campaign in seconds.
                </p>
                <button
                  onClick={() => setViewMode('create')}
                  style={{
                    background: T.accent,
                    color: '#FFF',
                    border: 'none',
                    borderRadius: 10,
                    padding: '8px 18px',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Create Your First Campaign
                </button>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 700 }}>
                  <thead>
                    <tr style={{ background: T.surfaceLight, borderBottom: `1px solid ${T.borderStrong}` }}>
                      <th style={{ padding: '14px 18px', fontFamily: 'var(--font-mono)', fontSize: 11, color: T.textSecondary, textTransform: 'uppercase' }}>Campaign Name</th>
                      <th style={{ padding: '14px 18px', fontFamily: 'var(--font-mono)', fontSize: 11, color: T.textSecondary, textTransform: 'uppercase' }}>Agent</th>
                      <th style={{ padding: '14px 18px', fontFamily: 'var(--font-mono)', fontSize: 11, color: T.textSecondary, textTransform: 'uppercase' }}>Status</th>
                      <th style={{ padding: '14px 18px', fontFamily: 'var(--font-mono)', fontSize: 11, color: T.textSecondary, textTransform: 'uppercase' }}>Progress</th>
                      <th style={{ padding: '14px 18px', fontFamily: 'var(--font-mono)', fontSize: 11, color: T.textSecondary, textTransform: 'uppercase' }}>Duration</th>
                      <th style={{ padding: '14px 18px', fontFamily: 'var(--font-mono)', fontSize: 11, color: T.textSecondary, textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCampaigns.map(c => {
                      const completedPct = c.total > 0 ? Math.round(((c.completed + c.failed) / c.total) * 100) : 0
                      const isRunning = c.status === 'running'
                      const isCompleted = c.status === 'completed'
                      const isScheduled = c.status === 'scheduled'

                      return (
                        <tr
                          key={c.id}
                          onClick={() => openBatchDetails(c.id)}
                          style={{
                            borderBottom: `1px solid ${T.border}`,
                            cursor: 'pointer',
                            transition: 'background 0.15s',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = T.surfaceLight)}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          <td style={{ padding: '16px 18px' }}>
                            <div style={{ fontWeight: 600, fontSize: 14, color: T.textPrimary }}>{c.name}</div>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, color: T.textMuted, marginTop: 2 }}>
                              {c.total} recipient{c.total === 1 ? '' : 's'} · {new Date(c.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </td>

                          <td style={{ padding: '16px 18px', fontSize: 13, color: T.textSecondary }}>
                            {c.agent_name || 'Real estate agent'}
                          </td>

                          <td style={{ padding: '16px 18px' }}>
                            <span
                              style={{
                                fontFamily: 'var(--font-mono)',
                                fontSize: 11,
                                fontWeight: 600,
                                padding: '4px 10px',
                                borderRadius: 14,
                                background: isCompleted ? T.greenSoft : isRunning ? 'rgba(90,108,255,0.15)' : isScheduled ? T.brassSoft : T.redSoft,
                                color: isCompleted ? T.green : isRunning ? T.accentGlow : isScheduled ? T.brass : T.red,
                                border: `1px solid ${isCompleted ? 'rgba(79,190,135,0.3)' : isRunning ? 'rgba(90,108,255,0.3)' : isScheduled ? 'rgba(229,192,123,0.3)' : 'rgba(248,113,113,0.3)'}`,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 5,
                              }}
                            >
                              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
                              {c.status.toUpperCase()}
                            </span>
                          </td>

                          <td style={{ padding: '16px 18px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{ width: 100, height: 6, background: T.deepNavy, borderRadius: 3, overflow: 'hidden' }}>
                                <div style={{ width: `${completedPct}%`, height: '100%', background: isCompleted ? T.green : T.accentGlow, borderRadius: 3 }} />
                              </div>
                              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, color: T.textSecondary }}>
                                {completedPct}%
                              </span>
                            </div>
                          </td>

                          <td style={{ padding: '16px 18px', fontFamily: 'var(--font-mono)', fontSize: 12, color: T.textMuted }}>
                            {c.duration_secs ? `${Math.floor(c.duration_secs / 60)}:${String(c.duration_secs % 60).padStart(2, '0')}` : '0:01'}
                          </td>

                          <td style={{ padding: '16px 18px', textAlign: 'right' }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                openBatchDetails(c.id)
                              }}
                              style={{
                                background: T.surfaceLight,
                                border: `1px solid ${T.border}`,
                                color: T.textSecondary,
                                padding: '6px 12px',
                                borderRadius: 8,
                                fontSize: 12,
                                cursor: 'pointer',
                              }}
                            >
                              View Details →
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── VIEW 2: CREATE BATCH CALL ─────────────────────────────────────────── */}
      {viewMode === 'create' && (
        <div>
          {/* Top Bar with Back Button */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <button
              onClick={() => setViewMode('list')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: T.surface,
                border: `1px solid ${T.border}`,
                borderRadius: 10,
                padding: '8px 14px',
                color: T.textSecondary,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              <ChevronLeft size={16} /> Back to Campaigns
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                onClick={() => setShowTestModal(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  background: T.surface,
                  border: `1px solid ${T.brass}`,
                  color: T.brass,
                  borderRadius: 10,
                  padding: '8px 16px',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <Zap size={14} /> Test Call (Single Number)
              </button>

              <button
                id="submit-batch-btn"
                onClick={handleSubmitBatch}
                disabled={isSubmitting || recipients.length === 0}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: recipients.length > 0 ? 'linear-gradient(135deg, #2A3FE0, #5A6CFF)' : T.surfaceLight,
                  color: recipients.length > 0 ? '#FFFFFF' : T.textMuted,
                  border: 'none',
                  borderRadius: 10,
                  padding: '8px 20px',
                  fontSize: 13.5,
                  fontWeight: 600,
                  cursor: recipients.length > 0 ? 'pointer' : 'not-allowed',
                }}
              >
                {isSubmitting ? 'Launching...' : 'Submit a Batch Call'}
              </button>
            </div>
          </div>

          {/* Dual-Pane Layout */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 24 }}>

            {/* Left Pane: Configuration & File Upload */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Batch Name */}
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: '20px' }}>
                <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 11, color: T.brass, textTransform: 'uppercase', marginBottom: 6, fontWeight: 600 }}>
                  Batch Name
                </label>
                <input
                  type="text"
                  value={batchName}
                  onChange={e => setBatchName(e.target.value)}
                  placeholder="e.g. Kokapet High-Intent Buyer Re-engagement"
                  style={{
                    width: '100%',
                    background: T.deepNavy,
                    border: `1px solid ${T.borderStrong}`,
                    borderRadius: 10,
                    padding: '10px 14px',
                    fontSize: 13.5,
                    color: T.textPrimary,
                    outline: 'none',
                  }}
                />
              </div>

              {/* Agent & Phone Number Selectors */}
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 11, color: T.brass, textTransform: 'uppercase', marginBottom: 6, fontWeight: 600 }}>
                    Select Voice Agent
                  </label>
                  <select
                    value={selectedAgentId}
                    onChange={e => setSelectedAgentId(e.target.value)}
                    style={{
                      width: '100%',
                      background: T.deepNavy,
                      border: `1px solid ${T.borderStrong}`,
                      borderRadius: 10,
                      padding: '10px 14px',
                      fontSize: 13,
                      color: T.textPrimary,
                      outline: 'none',
                    }}
                  >
                    {agents.map(a => (
                      <option key={a.id} value={a.id}>{a.name} ({a.direction || 'outbound'})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 11, color: T.brass, textTransform: 'uppercase', marginBottom: 6, fontWeight: 600 }}>
                    Outbound Caller ID Number
                  </label>
                  <select
                    value={selectedPhoneId}
                    onChange={e => setSelectedPhoneId(e.target.value)}
                    style={{
                      width: '100%',
                      background: T.deepNavy,
                      border: `1px solid ${T.borderStrong}`,
                      borderRadius: 10,
                      padding: '10px 14px',
                      fontSize: 13,
                      color: T.textPrimary,
                      outline: 'none',
                    }}
                  >
                    {phoneNumbers.map(p => (
                      <option key={p.id} value={p.id}>{p.phone} ({p.label || p.provider || 'Active'})</option>
                    ))}
                  </select>
                </div>

                {/* Ringing Timeout & Concurrency */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 11, color: T.textSecondary, marginBottom: 4 }}>
                      Ringing Timeout (sec)
                    </label>
                    <input
                      type="number"
                      value={ringingTimeout}
                      onChange={e => setRingingTimeout(parseInt(e.target.value, 10) || 60)}
                      min={10}
                      max={120}
                      style={{
                        width: '100%',
                        background: T.deepNavy,
                        border: `1px solid ${T.borderStrong}`,
                        borderRadius: 10,
                        padding: '8px 12px',
                        fontSize: 12.5,
                        color: T.textPrimary,
                        outline: 'none',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 11, color: T.textSecondary, marginBottom: 4 }}>
                      Concurrency Limit
                    </label>
                    <input
                      type="text"
                      value={concurrencyLimit}
                      onChange={e => setConcurrencyLimit(e.target.value)}
                      placeholder="Auto"
                      style={{
                        width: '100%',
                        background: T.deepNavy,
                        border: `1px solid ${T.borderStrong}`,
                        borderRadius: 10,
                        padding: '8px 12px',
                        fontSize: 12.5,
                        color: T.textPrimary,
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Recipients File Upload */}
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <label style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: T.brass, textTransform: 'uppercase', fontWeight: 600 }}>
                    Recipients CSV / Excel
                  </label>
                  <button
                    onClick={downloadTemplate}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: T.accentGlow,
                      fontSize: 11.5,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <Download size={12} /> Download Template
                  </button>
                </div>

                <div
                  onDragOver={e => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: `2px dashed ${T.borderStrong}`,
                    borderRadius: 12,
                    padding: '28px 20px',
                    textAlign: 'center',
                    background: T.deepNavy,
                    cursor: 'pointer',
                    transition: 'border-color 0.2s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = T.brass)}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = T.borderStrong)}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv, .xlsx, .xls"
                    style={{ display: 'none' }}
                    onChange={handleFileUpload}
                  />
                  <Upload size={28} color={T.brass} style={{ margin: '0 auto 10px' }} />
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: T.textPrimary }}>
                    Click or Drag & Drop Lead CSV Here
                  </div>
                  <div style={{ fontSize: 11.5, color: T.textMuted, marginTop: 4 }}>
                    Supports CSV, XLS (Max 25 MB)
                  </div>
                </div>

                {/* Variable Info Box */}
                <div style={{ marginTop: 14, background: T.surfaceLight, borderRadius: 10, padding: '12px 14px', border: `1px solid ${T.border}` }}>
                  <div style={{ fontSize: 11.5, fontWeight: 600, color: T.textPrimary, marginBottom: 4 }}>
                    Formatting Guide:
                  </div>
                  <div style={{ fontSize: 11, color: T.textSecondary, lineHeight: 1.5 }}>
                    • <code style={{ color: T.brass }}>phone_number</code> column is required (E.164 format, e.g. <span style={{ color: T.green }}>+919876543210</span>)<br />
                    • Any other column will automatically substitute <code style={{ color: T.accentGlow }}>&#123;&#123;column_name&#125;&#125;</code> in the prompt.
                  </div>
                </div>
              </div>

              {/* Timing */}
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: '20px' }}>
                <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 11, color: T.brass, textTransform: 'uppercase', marginBottom: 10, fontWeight: 600 }}>
                  Campaign Timing
                </label>
                <div style={{ display: 'flex', gap: 10, marginBottom: timing === 'scheduled' ? 12 : 0 }}>
                  <button
                    onClick={() => setTiming('immediate')}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: 10,
                      border: `1px solid ${timing === 'immediate' ? T.brass : T.border}`,
                      background: timing === 'immediate' ? T.brassSoft : T.deepNavy,
                      color: timing === 'immediate' ? T.brass : T.textSecondary,
                      fontWeight: 600,
                      fontSize: 12.5,
                      cursor: 'pointer',
                    }}
                  >
                    Send Immediately
                  </button>
                  <button
                    onClick={() => setTiming('scheduled')}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: 10,
                      border: `1px solid ${timing === 'scheduled' ? T.brass : T.border}`,
                      background: timing === 'scheduled' ? T.brassSoft : T.deepNavy,
                      color: timing === 'scheduled' ? T.brass : T.textSecondary,
                      fontWeight: 600,
                      fontSize: 12.5,
                      cursor: 'pointer',
                    }}
                  >
                    Schedule for Later
                  </button>
                </div>

                {timing === 'scheduled' && (
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={e => setScheduledAt(e.target.value)}
                    style={{
                      width: '100%',
                      background: T.deepNavy,
                      border: `1px solid ${T.borderStrong}`,
                      borderRadius: 10,
                      padding: '10px 14px',
                      fontSize: 12.5,
                      color: T.textPrimary,
                      fontFamily: 'var(--font-mono)',
                    }}
                  />
                )}
              </div>
            </div>

            {/* Right Pane: Recipients Data Grid Preview */}
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 20, padding: '24px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: T.textPrimary, margin: 0 }}>
                    Recipients Preview
                  </h3>
                  <div style={{ fontSize: 12, color: T.textSecondary, marginTop: 2 }}>
                    {recipients.length === 0
                      ? 'No recipients uploaded yet'
                      : `${recipients.filter(r => r.isValid).length} valid phone numbers · ${recipients.filter(r => !r.isValid).length} invalid`}
                  </div>
                </div>

                {recipients.length > 0 && (
                  <button
                    onClick={() => setRecipients([])}
                    style={{ background: T.surfaceLight, border: `1px solid ${T.border}`, color: T.red, padding: '4px 10px', borderRadius: 8, fontSize: 11, cursor: 'pointer' }}
                  >
                    Clear All
                  </button>
                )}
              </div>

              {recipients.length === 0 ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', textAlign: 'center', color: T.textMuted }}>
                  <Users size={36} color={T.slate} style={{ marginBottom: 12 }} />
                  <div style={{ fontSize: 15, fontWeight: 600, color: T.textSecondary }}>No recipients yet</div>
                  <p style={{ fontSize: 12.5, maxWidth: 320, margin: '4px auto 16px' }}>
                    Upload a CSV on the left to preview numbers, validated E.164 formats, and dynamic prompt variables.
                  </p>
                  <button
                    onClick={downloadTemplate}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      background: T.surfaceLight,
                      border: `1px solid ${T.borderStrong}`,
                      color: T.textPrimary,
                      padding: '8px 14px',
                      borderRadius: 10,
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                  >
                    <Download size={13} /> Download Sample CSV
                  </button>
                </div>
              ) : (
                <div style={{ flex: 1, overflowX: 'auto', maxHeight: '520px', border: `1px solid ${T.border}`, borderRadius: 12 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 400 }}>
                    <thead>
                      <tr style={{ background: T.deepNavy, borderBottom: `1px solid ${T.borderStrong}`, position: 'sticky', top: 0 }}>
                        <th style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)', fontSize: 11, color: T.textSecondary }}>STATUS</th>
                        <th style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)', fontSize: 11, color: T.textSecondary }}>PHONE NUMBER</th>
                        {customVarKeys.map(k => (
                          <th key={k} style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)', fontSize: 11, color: T.brass, textTransform: 'uppercase' }}>
                            {`{{${k}}}`}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {recipients.map((r, i) => (
                        <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: r.isValid ? 'transparent' : T.redSoft }}>
                          <td style={{ padding: '10px 14px' }}>
                            {r.isValid ? (
                              <CheckCircle2 size={15} color={T.green} />
                            ) : (
                              <span title={r.error} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: T.red, fontSize: 11 }}>
                                <AlertTriangle size={14} /> Invalid
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)', fontSize: 12, color: r.isValid ? T.textPrimary : T.red, fontWeight: 600 }}>
                            {r.phone_number}
                          </td>
                          {customVarKeys.map(k => (
                            <td key={k} style={{ padding: '10px 14px', fontSize: 12, color: T.textSecondary }}>
                              {r.variables[k] || '—'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── VIEW 3: CAMPAIGN DETAILS & RECIPIENT LOGS ─────────────────────────── */}
      {viewMode === 'details' && (
        <div>
          {/* Header Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
            <button
              onClick={() => setViewMode('list')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: T.surface,
                border: `1px solid ${T.border}`,
                borderRadius: 10,
                padding: '8px 14px',
                color: T.textSecondary,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              <ChevronLeft size={16} /> Back to Campaigns
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                onClick={() => selectedBatchId && openBatchDetails(selectedBatchId)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  background: T.surface,
                  border: `1px solid ${T.border}`,
                  borderRadius: 10,
                  padding: '8px 14px',
                  color: T.textSecondary,
                  fontSize: 12.5,
                  cursor: 'pointer',
                }}
              >
                <RefreshCw size={13} style={{ animation: loadingDetails ? 'spin 1s linear infinite' : 'none' }} />
                Refresh Status
              </button>
            </div>
          </div>

          {loadingDetails || !activeBatch ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: T.textMuted }}>
              <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
              <div>Loading campaign intelligence...</div>
            </div>
          ) : (
            <div>
              {/* Campaign Title & Metadata */}
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 20, padding: '24px', marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14 }}>
                  <div>
                    <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, margin: 0, color: T.textPrimary }}>
                      {activeBatch.name}
                    </h1>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, color: T.textMuted, marginTop: 4 }}>
                      Batch ID: {activeBatch.id} · Created {new Date(activeBatch.created_at).toLocaleString('en-IN')}
                    </div>
                  </div>

                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 12,
                      fontWeight: 700,
                      padding: '5px 14px',
                      borderRadius: 14,
                      background: activeBatch.status === 'completed' ? T.greenSoft : activeBatch.status === 'running' ? 'rgba(90,108,255,0.15)' : T.brassSoft,
                      color: activeBatch.status === 'completed' ? T.green : activeBatch.status === 'running' ? T.accentGlow : T.brass,
                      border: `1px solid ${activeBatch.status === 'completed' ? 'rgba(79,190,135,0.3)' : 'rgba(90,108,255,0.3)'}`,
                      textTransform: 'uppercase',
                    }}
                  >
                    {activeBatch.status}
                  </span>
                </div>

                {/* 3 Metric Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginTop: 24 }}>
                  <div style={{ background: T.deepNavy, borderRadius: 14, padding: '16px', border: `1px solid ${T.border}` }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: T.textMuted, textTransform: 'uppercase' }}>Total Recipients</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: T.textPrimary, marginTop: 4 }}>
                      {activeBatch.total}
                    </div>
                  </div>

                  <div style={{ background: T.deepNavy, borderRadius: 14, padding: '16px', border: `1px solid ${T.border}` }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: T.textMuted, textTransform: 'uppercase' }}>Connected Calls</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: T.green, marginTop: 4 }}>
                      {activeBatch.completed}
                    </div>
                  </div>

                  <div style={{ background: T.deepNavy, borderRadius: 14, padding: '16px', border: `1px solid ${T.border}` }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: T.textMuted, textTransform: 'uppercase' }}>Pickup Rate</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: T.brass, marginTop: 4 }}>
                      {activeBatch.total > 0 ? Math.round((activeBatch.completed / activeBatch.total) * 100) : 0}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Recipient Logs Table */}
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 20, padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: T.textPrimary, margin: 0 }}>
                    Recipient Logs ({batchRecipients.length})
                  </h3>
                </div>

                <div style={{ overflowX: 'auto', border: `1px solid ${T.border}`, borderRadius: 12 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 500 }}>
                    <thead>
                      <tr style={{ background: T.surfaceLight, borderBottom: `1px solid ${T.borderStrong}` }}>
                        <th style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: 11, color: T.textSecondary }}>PHONE NUMBER</th>
                        <th style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: 11, color: T.textSecondary }}>CUSTOM VARIABLES</th>
                        <th style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: 11, color: T.textSecondary }}>DURATION</th>
                        <th style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: 11, color: T.textSecondary, textAlign: 'right' }}>STATUS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {batchRecipients.length === 0 ? (
                        <tr>
                          <td colSpan={4} style={{ padding: '30px', textAlign: 'center', color: T.textMuted }}>
                            No individual recipient logs recorded yet.
                          </td>
                        </tr>
                      ) : (
                        batchRecipients.map((r, idx) => (
                          <tr key={r.id || idx} style={{ borderBottom: `1px solid ${T.border}` }}>
                            <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: 12.5, fontWeight: 600, color: T.textPrimary }}>
                              {r.phone_number}
                            </td>
                            <td style={{ padding: '12px 16px', fontSize: 12, color: T.textSecondary }}>
                              {r.variables && Object.keys(r.variables).length > 0 ? (
                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                  {Object.entries(r.variables).map(([k, v]) => (
                                    <span key={k} style={{ background: T.deepNavy, padding: '2px 8px', borderRadius: 6, fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                                      <span style={{ color: T.brass }}>{k}:</span> {String(v)}
                                    </span>
                                  ))}
                                </div>
                              ) : '—'}
                            </td>
                            <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: 12, color: T.textMuted }}>
                              {r.duration_ms ? `${Math.round(r.duration_ms / 1000)}s` : '—'}
                            </td>
                            <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                              <span
                                style={{
                                  fontFamily: 'var(--font-mono)',
                                  fontSize: 10.5,
                                  fontWeight: 600,
                                  padding: '3px 9px',
                                  borderRadius: 12,
                                  background: r.status === 'completed' ? T.greenSoft : r.status === 'failed' ? T.redSoft : 'rgba(90,108,255,0.12)',
                                  color: r.status === 'completed' ? T.green : r.status === 'failed' ? T.red : T.accentGlow,
                                  textTransform: 'capitalize',
                                }}
                              >
                                {r.status || 'Pending'}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TEST CALL MODAL ───────────────────────────────────────────────────── */}
      {showTestModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 110,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(5, 10, 20, 0.75)',
            backdropFilter: 'blur(8px)',
            padding: 20,
          }}
        >
          <div
            style={{
              background: T.surface,
              border: `1px solid ${T.borderStrong}`,
              borderRadius: 20,
              padding: '28px',
              maxWidth: 480,
              width: '100%',
              boxShadow: '0 20px 48px rgba(0,0,0,0.5)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Zap size={18} color={T.brass} />
                <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: T.textPrimary }}>
                  Single Test Call
                </h3>
              </div>
              <button
                onClick={() => setShowTestModal(false)}
                style={{ background: 'none', border: 'none', color: T.textMuted, cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: 12.5, color: T.textSecondary, margin: '0 0 18px' }}>
              Test the AI voice conversation live on your phone before broadcasting to the full batch.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontFamily: 'var(--font-mono)', color: T.brass, textTransform: 'uppercase', marginBottom: 4, fontWeight: 600 }}>
                  Test Phone Number (E.164)
                </label>
                <input
                  type="text"
                  placeholder="+919876543210"
                  value={testPhoneNumber}
                  onChange={e => setTestPhoneNumber(e.target.value)}
                  style={{
                    width: '100%',
                    background: T.deepNavy,
                    border: `1px solid ${T.borderStrong}`,
                    borderRadius: 10,
                    padding: '10px 14px',
                    fontSize: 13,
                    color: T.textPrimary,
                    fontFamily: 'var(--font-mono)',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontFamily: 'var(--font-mono)', color: T.textSecondary, marginBottom: 4 }}>
                  Mock Variables (JSON)
                </label>
                <textarea
                  rows={3}
                  value={testVariables}
                  onChange={e => setTestVariables(e.target.value)}
                  style={{
                    width: '100%',
                    background: T.deepNavy,
                    border: `1px solid ${T.borderStrong}`,
                    borderRadius: 10,
                    padding: '8px 12px',
                    fontSize: 12,
                    color: T.textPrimary,
                    fontFamily: 'var(--font-mono)',
                    outline: 'none',
                  }}
                />
              </div>

              {testCallStatus && (
                <div style={{ padding: '10px 12px', background: T.deepNavy, borderRadius: 8, fontSize: 12, color: T.textSecondary, fontFamily: 'var(--font-mono)' }}>
                  {testCallStatus}
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                <button
                  onClick={() => setShowTestModal(false)}
                  style={{
                    flex: 1,
                    background: T.surfaceLight,
                    border: `1px solid ${T.border}`,
                    color: T.textSecondary,
                    borderRadius: 10,
                    padding: '10px',
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleTriggerTestCall}
                  disabled={isTesting}
                  style={{
                    flex: 1,
                    background: 'linear-gradient(135deg, #2A3FE0, #5A6CFF)',
                    color: '#FFF',
                    border: 'none',
                    borderRadius: 10,
                    padding: '10px',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {isTesting ? 'Dialing...' : 'Dial Now 📞'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
