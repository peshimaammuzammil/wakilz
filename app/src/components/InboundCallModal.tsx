import { useState, useEffect } from 'react'
import { Phone, Copy, Check, X, Shield, Sparkles, MessageSquare } from 'lucide-react'

interface InboundCallModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function InboundCallModal({
  isOpen,
  onClose,
}: InboundCallModalProps) {
  const [copied, setCopied] = useState(false)
  const phoneNumber = '+919492060792'
  const displayPhone = '+91 94920 60792'

  // Trigger backend tracking when modal opens
  useEffect(() => {
    if (!isOpen) return

    // Trigger backend event (graceful fallback if endpoint is pending backend deployment)
    fetch('/api/inbound/click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source: 'watch_it_take_a_call_button',
        inboundNumber: phoneNumber,
        timestamp: new Date().toISOString(),
        referrer: document.referrer || window.location.href,
        userAgent: navigator.userAgent,
      }),
    }).catch(() => {
      // Backend trigger logged or pending deployment
    })

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(phoneNumber)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch (_) {
      // Fallback
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background: 'rgba(5, 8, 16, 0.75)',
        backdropFilter: 'blur(12px)',
      }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl overflow-hidden border"
        style={{
          background: 'linear-gradient(180deg, rgba(16, 24, 44, 0.96) 0%, rgba(10, 15, 29, 0.98) 100%)',
          borderColor: 'rgba(66, 99, 235, 0.35)',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 30px rgba(42, 63, 224, 0.25)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top ambient glow */}
        <div
          className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-36 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(66, 99, 235, 0.35) 0%, transparent 70%)',
            filter: 'blur(30px)',
          }}
        />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white transition-colors hover:bg-white/5"
          aria-label="Close dialog"
        >
          <X size={20} />
        </button>

        <div className="p-7 sm:p-8">
          {/* Status badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-medium mb-4"
               style={{
                 background: 'rgba(16, 185, 129, 0.12)',
                 border: '1px solid rgba(16, 185, 129, 0.3)',
                 color: '#34d399',
               }}>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Live Inbound Bot Online · Sub-second Latency
          </div>

          <h3 className="font-display font-bold text-2xl text-white mb-2 tracking-tight">
            Call Wakilz Inbound AI Agent
          </h3>
          <p className="text-sm leading-relaxed text-slate-300 mb-6">
            Dial our official live demo line from your mobile phone. Experience how Wakilz qualifies real estate buyers in real-time.
          </p>

          {/* Primary phone card */}
          <div
            className="p-5 rounded-xl border mb-6 text-center relative overflow-hidden"
            style={{
              background: 'rgba(26, 38, 68, 0.5)',
              borderColor: 'rgba(66, 99, 235, 0.3)',
            }}
          >
            <div className="text-xs uppercase tracking-wider font-mono text-indigo-300 mb-2 font-medium">
              Official Inbound Demonstration Line
            </div>

            <div className="font-mono font-bold text-2xl sm:text-3xl text-white tracking-wider my-2">
              {displayPhone}
            </div>

            <div className="flex items-center justify-center gap-3 mt-4 flex-wrap">
              <a
                href={`tel:${phoneNumber}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-all transform active:scale-95"
                style={{
                  background: 'linear-gradient(135deg, #2A3FE0 0%, #4f46e5 100%)',
                  boxShadow: '0 4px 15px rgba(42, 63, 224, 0.4)',
                }}
              >
                <Phone size={16} />
                Call Directly Now
              </a>

              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors border"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderColor: 'rgba(255, 255, 255, 0.15)',
                  color: copied ? '#34d399' : '#e2e8f0',
                }}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'Copied to Clipboard!' : 'Copy Number'}
              </button>
            </div>
          </div>

          {/* Feature Highlights */}
          <div className="space-y-3 mb-6 text-xs text-slate-300">
            <div className="flex items-start gap-2.5">
              <MessageSquare size={16} className="text-indigo-400 shrink-0 mt-0.5" />
              <span>
                <strong className="text-white">Multilingual Fluency:</strong> Speak naturally in{' '}
                <span className="text-indigo-300">English</span>, <span className="text-indigo-300">Hindi</span>, or{' '}
                <span className="text-indigo-300">Telugu</span>.
              </span>
            </div>

            <div className="flex items-start gap-2.5">
              <Sparkles size={16} className="text-indigo-400 shrink-0 mt-0.5" />
              <span>
                <strong className="text-white">Sample Scenarios:</strong> Ask about 2/3 BHK pricing in Kokapet, ask about possession dates, or ask to book a site visit.
              </span>
            </div>

            <div className="flex items-start gap-2.5">
              <Shield size={16} className="text-indigo-400 shrink-0 mt-0.5" />
              <span>
                <strong className="text-white">Enterprise Privacy:</strong> Test call data is secured. No spam, callbacks, or third-party marketing.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

