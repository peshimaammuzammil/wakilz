import { useState } from 'react'
import { ArrowRight, PhoneOff } from 'lucide-react'
import type { VoiceState } from '../hooks/useVoiceAgent'

const languages = ['English', 'Telugu', 'Hindi'] as const

interface HeroSectionProps {
  voiceState: VoiceState
  onConnect: () => Promise<void>
  onDisconnect: () => void
}

export default function HeroSection({ voiceState, onConnect, onDisconnect }: HeroSectionProps) {
  const [activeLang, setActiveLang] = useState<'English' | 'Telugu' | 'Hindi'>('English')

  return (
    <section className="hero-section relative" style={{ zIndex: 2 }}>
      <div className="content-container relative" style={{ zIndex: 2 }}>
        <div className="grid grid-cols-1 lg:grid-cols-[55%_45%] gap-8 items-start">
          {/* Left content */}
          <div className="pt-[180px] pb-[140px] max-lg:pt-[140px] max-lg:pb-[80px] max-md:pb-[240px]">
            <div className="eyebrow">THE AI VOICE INFRASTRUCTURE FOR REAL ESTATE</div>
            <h1
              className="font-display font-bold leading-[1.08] tracking-tight mb-6"
              style={{
                color: 'var(--text-primary)',
                fontSize: 'clamp(36px, 5vw, 56px)',
                letterSpacing: '-0.02em',
              }}
            >
              Never Miss a Lead.{' '}
              Never Lose a{' '}
              <span
                style={{
                  color: 'var(--accent-glow)',
                  position: 'relative',
                  display: 'inline-block',
                }}
              >
                Site Visit.
                {/* Gradient underline accent */}
                <span
                  style={{
                    position: 'absolute',
                    bottom: -4,
                    left: 0,
                    right: 0,
                    height: 2,
                    borderRadius: 2,
                    background: 'linear-gradient(to right, #2A3FE0, #5A6CFF, transparent)',
                    opacity: 0.8,
                  }}
                />
              </span>
            </h1>
            <p
              className="text-base leading-relaxed max-w-[480px] mb-7"
              style={{ color: 'var(--text-secondary)', lineHeight: 1.75 }}
            >
              Wakilz is the AI voice & chat platform built for <strong style={{ color: 'var(--text-primary)' }}>Developers, Channel Partners</strong>, and Mandate Holders. Automate your entire pre-sales and post-sales workflows.{' '}
              <span style={{ color: 'var(--text-primary)' }}>We handle the setup, CRM integration, and maintenance.</span>
            </p>

            {/* Language chips */}
            <div className="flex items-center gap-2 mb-7 flex-wrap">
              <span className="font-mono text-[11px] mr-1" style={{ color: 'var(--text-muted)' }}>
                Speaks natively in
              </span>
              {languages.map((lang) => (
                <button
                  key={lang}
                  className={`lang-chip ${activeLang === lang ? 'active' : ''}`}
                  onClick={() => setActiveLang(lang)}
                >
                  {lang}
                </button>
              ))}
            </div>

            {/* CTA Row */}
            <div className="flex items-center gap-6 flex-wrap mb-8">
              <button
                onClick={() => {
                  const el = document.getElementById('contact-sales')
                  if (el) el.scrollIntoView({ behavior: 'smooth' })
                }}
                className="btn-primary"
              >
                Connect to Sales
                <ArrowRight size={16} />
              </button>

              {/* Voice demo button — state-driven */}
              {voiceState === 'idle' && (
                <button
                  className="btn-secondary font-mono text-sm"
                  onClick={onConnect}
                >
                  Watch it take a call
                </button>
              )}
              {voiceState === 'connecting' && (
                <button
                  className="btn-secondary font-mono text-sm"
                  disabled
                  style={{ opacity: 0.5, cursor: 'not-allowed' }}
                >
                  <span
                    style={{
                      display: 'inline-block',
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: 'var(--accent-glow)',
                      animation: 'pulse 1s ease-in-out infinite',
                      marginRight: 6,
                    }}
                  />
                  Connecting...
                </button>
              )}
              {voiceState === 'connected' && (
                <button
                  className="btn-secondary font-mono text-sm"
                  onClick={onDisconnect}
                  style={{
                    borderColor: '#e05252',
                    color: '#e05252',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      background: '#e05252',
                      display: 'inline-block',
                      animation: 'pulse 1.2s ease-in-out infinite',
                    }}
                  />
                  On Call
                  <PhoneOff size={13} style={{ marginLeft: 2 }} />
                  End Call
                </button>
              )}
              {voiceState === 'error' && (
                <button
                  className="btn-secondary font-mono text-sm"
                  onClick={onConnect}
                  style={{ borderColor: '#e05252', color: '#e05252' }}
                >
                  Failed. Try again
                </button>
              )}
            </div>

            {/* Trust badges */}
            <div
              className="flex items-center gap-3 mb-8"
              style={{ opacity: 0.9 }}
            >
              {/* Avatar stack */}
              <div className="flex" style={{ marginRight: 4 }}>
                {['#3B52F5', '#4FBE87', '#B8790C', '#5A6CFF'].map((color, i) => (
                  <div
                    key={i}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: `linear-gradient(135deg, ${color}cc, ${color}66)`,
                      border: '2px solid #0C1524',
                      marginLeft: i === 0 ? 0 : -8,
                      boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 10,
                      fontWeight: 700,
                      color: '#fff',
                    }}
                  >
                    {['D', 'C', 'M', '+'][i]}
                  </div>
                ))}
              </div>
              <div>
                <span
                  className="font-mono text-[11px]"
                  style={{ color: 'var(--text-muted)', display: 'block', lineHeight: 1.4 }}
                >
                  Trusted by <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Developers, CPs & Mandate Holders</span> across Hyderabad
                </span>
              </div>
            </div>

            {/* Stat strip */}
            <div className="stat-strip">
              <div>
                <div className="stat-label">Response</div>
                <div className="stat-value">&lt;2s</div>
              </div>
              <div>
                <div className="stat-label">Languages</div>
                <div className="stat-value">3</div>
              </div>
              <div>
                <div className="stat-label">Time to live</div>
                <div className="stat-value">&lt;1 day</div>
              </div>
            </div>
          </div>

          {/* Right - empty (sphere renders behind via fixed canvas) */}
          <div className="hidden lg:block" />
        </div>
      </div>
    </section>
  )
}
