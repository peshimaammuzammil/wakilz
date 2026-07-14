import { useRef, useEffect, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Zap, Globe, Radio } from 'lucide-react'

gsap.registerPlugin(ScrollTrigger)

const floatingPills = [
  { icon: Zap, text: '<2s response', color: 'var(--success-bright)', position: 'top-4 left-4' },
  { icon: Globe, text: '3 languages', color: 'var(--accent-glow)', position: 'top-4 right-4' },
  { icon: Radio, text: 'Live now', color: 'var(--success-bright)', position: 'bottom-4 left-4' },
]

export default function DashboardPreviewSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const imageRef = useRef<HTMLDivElement>(null)
  const pillsRef = useRef<HTMLDivElement[]>([])
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const trig = ScrollTrigger.create({
      trigger: section,
      start: 'top 70%',
      onEnter: () => {
        setInView(true)

        // Dashboard image entrance
        if (imageRef.current) {
          gsap.fromTo(imageRef.current,
            { opacity: 0, y: 40 },
            { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }
          )
        }

        // Floating pills stagger
        pillsRef.current.forEach((pill, i) => {
          if (!pill) return
          const directions = [
            { x: -20, y: 0 },
            { x: 20, y: 0 },
            { x: 0, y: 20 },
          ]
          gsap.fromTo(pill,
            { opacity: 0, x: directions[i].x, y: directions[i].y },
            { opacity: 1, x: 0, y: 0, duration: 0.5, ease: 'power3.out', delay: 0.3 + i * 0.15 }
          )
        })
      },
    })

    return () => { trig.kill() }
  }, [])

  return (
    <section
      ref={sectionRef}
      className="section-padding"
      style={{ background: 'var(--deep-navy)' }}
    >
      <div className="content-container">
        <div className={`mb-12 transition-all duration-600 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="eyebrow">DASHBOARD</div>
          <h2
            className="font-display font-bold leading-tight mb-4"
            style={{
              color: 'var(--text-primary)',
              fontSize: 'clamp(28px, 3.5vw, 38px)',
              letterSpacing: '-0.015em',
            }}
          >
            Your team&apos;s command center
          </h2>
          <p className="text-base max-w-[480px]" style={{ color: 'var(--text-secondary)' }}>
            Every lead, every call, every booking — in one view.
          </p>
        </div>

        {/* Dashboard card */}
        <div className="relative">
          <div
            ref={imageRef}
            className="rounded-lg overflow-hidden p-6"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              boxShadow: '0 24px 80px rgba(0,0,0,0.4)',
              opacity: 0,
            }}
          >
            <img
              src="/assets/dashboard-mockup.jpg"
              alt="Wakilz analytics dashboard showing leads, response times, and call volume"
              className="w-full rounded"
              style={{ display: 'block' }}
              loading="lazy"
            />
          </div>

          {/* Floating pills */}
          {floatingPills.map((pill, i) => (
            <div
              key={pill.text}
              ref={(el) => { if (el) pillsRef.current[i] = el }}
              className={`absolute ${pill.position} hidden lg:flex items-center gap-2 px-4 py-2 rounded-full`}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                opacity: 0,
                zIndex: 2,
              }}
            >
              <pill.icon size={14} style={{ color: pill.color }} />
              <span className="font-mono text-xs" style={{ color: pill.color }}>{pill.text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
