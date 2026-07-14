import { useRef, useEffect, useState, useCallback } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import ChaoticWaveform from '../effects/ChaoticWaveform'

gsap.registerPlugin(ScrollTrigger)

const stages = [
  { title: 'Enquiry captured', sub: '3BHK, Kokapet · budget \u20b91.1\u20131.3Cr' },
  { title: 'Buyer qualified', sub: 'Ready to visit this week' },
  { title: 'Site visit booked', sub: 'Saturday, 11:00 AM' },
  { title: 'WhatsApp confirmation sent', sub: 'Synced to CRM' },
]

export default function LiveConsoleSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const consoleRef = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  const [visibleStages, setVisibleStages] = useState<boolean[]>([false, false, false, false])
  const [playing, setPlaying] = useState(false)
  const tlRef = useRef<gsap.core.Timeline | null>(null)

  const playStages = useCallback(() => {
    if (playing) return
    setPlaying(true)
    setVisibleStages([false, false, false, false])

    const tl = gsap.timeline({
      onComplete: () => setPlaying(false),
    })

    stages.forEach((_, i) => {
      tl.call(() => {
        setVisibleStages((prev) => {
          const next = [...prev]
          next[i] = true
          return next
        })
      }, [], i * 0.65 + 0.2)
    })

    tlRef.current = tl
  }, [playing])

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const trig = ScrollTrigger.create({
      trigger: section,
      start: 'top 60%',
      onEnter: () => {
        setInView(true)
        if (consoleRef.current) {
          gsap.fromTo(consoleRef.current,
            { opacity: 0, scale: 0.95 },
            { opacity: 1, scale: 1, duration: 0.5, ease: 'power3.out', onComplete: playStages }
          )
        }
      },
    })

    return () => { trig.kill() }
  }, [playStages])

  const handleReplay = () => {
    if (tlRef.current) tlRef.current.kill()
    playStages()
  }

  return (
    <section
      ref={sectionRef}
      id="console-demo"
      className="section-padding"
      style={{ background: '#0F1929' }}
    >
      <div className="content-container">
        <div className="max-w-[720px] mx-auto">
          <div className="console-panel" ref={consoleRef} style={{ opacity: 0 }}>
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-mono text-[11px] tracking-wider uppercase" style={{ color: 'var(--text-muted)' }}>
                LIVE CALL — WAKILZ CONSOLE
              </h4>
              <div className="flex items-center gap-2">
                <span
                  className="w-1.5 h-1.5 rounded-full animate-pulse"
                  style={{ background: 'var(--success-bright)' }}
                />
                <span className="font-mono text-[11px]" style={{ color: 'var(--success-bright)' }}>
                  On call
                </span>
              </div>
            </div>

            {/* Waveform */}
            {inView && <ChaoticWaveform active={true} />}

            {/* Caller info */}
            <div
              className="flex justify-between items-center py-3 mb-3 border-b"
              style={{ borderColor: 'var(--border)' }}
            >
              <span className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
                Inbound +91 90XXX XXXXX
              </span>
              <span className="font-mono text-xs" style={{ color: 'var(--accent-glow)' }}>
                Telugu
              </span>
            </div>

            {/* Stage list */}
            <div className="flex flex-col gap-2 min-h-[180px]">
              {stages.map((stage, i) => (
                <div
                  key={stage.title}
                  className={`stage-card ${visibleStages[i] ? 'visible' : ''}`}
                >
                  <div
                    className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: 'rgba(31,122,77,0.15)', border: '1px solid var(--success-bright)' }}
                  >
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" strokeWidth="3">
                      <path
                        d="M20 6L9 17l-5-5"
                        stroke="var(--success-bright)"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={visibleStages[i] ? 'checkmark-circle drawn' : 'checkmark-circle'}
                      />
                    </svg>
                  </div>
                  <div>
                    <div className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {stage.title}
                    </div>
                    <div className="font-mono text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {stage.sub}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div
              className="flex justify-between items-center mt-4 pt-3 border-t"
              style={{ borderColor: 'var(--border)' }}
            >
              <div className="font-mono text-[11px]" style={{ color: 'var(--text-muted)' }}>
                Response time <b style={{ color: 'var(--success-bright)' }}>1.4s</b> avg
              </div>
              <button
                onClick={handleReplay}
                className="font-mono text-[11px] bg-transparent border-none cursor-pointer underline"
                style={{ color: 'var(--accent-glow)' }}
              >
                Replay &#x21bb;
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
