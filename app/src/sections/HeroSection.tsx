import { useState } from 'react'
import { ArrowRight } from 'lucide-react'

const languages = ['English', 'Telugu', 'Hindi'] as const

export default function HeroSection() {
  const [activeLang, setActiveLang] = useState<'English' | 'Telugu' | 'Hindi'>('English')

  return (
    <section className="hero-section relative" style={{ zIndex: 2 }}>
      <div className="hero-gradient-overlay" />
      <div className="content-container relative" style={{ zIndex: 2 }}>
        <div className="grid grid-cols-1 lg:grid-cols-[55%_45%] gap-8 items-start">
          {/* Left content */}
          <div className="pt-[180px] pb-[140px] max-lg:pt-[140px] max-lg:pb-[80px]">
            <div className="eyebrow">AI VOICE PLATFORM FOR REAL ESTATE</div>
            <h1
              className="font-display font-bold leading-[1.08] tracking-tight mb-5"
              style={{
                color: 'var(--text-primary)',
                fontSize: 'clamp(36px, 5vw, 52px)',
                letterSpacing: '-0.02em',
              }}
            >
              Every enquiry answered — in the caller's own language, in under{' '}
              <span style={{ color: 'var(--accent)' }}>2 seconds.</span>
            </h1>
            <p
              className="text-base leading-relaxed max-w-[480px] mb-6"
              style={{ color: 'var(--text-secondary)' }}
            >
              Wakilz is a self-serve AI voice and chat platform for real estate teams. Activate modules
              for capture, qualification, scheduling, and follow-up — live in minutes, no code.
            </p>

            {/* Language chips */}
            <div className="flex items-center gap-2 mb-6 flex-wrap">
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
              <button
                className="btn-secondary font-mono text-sm"
                onClick={() => {
                  const el = document.getElementById('console-demo')
                  if (el) el.scrollIntoView({ behavior: 'smooth' })
                }}
              >
                Watch it take a call
              </button>
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
