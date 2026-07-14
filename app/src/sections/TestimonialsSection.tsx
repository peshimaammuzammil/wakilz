import { useRef, useEffect, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const testimonials = [
  {
    quote: "Wakilz handles 80% of our initial enquiries. Our agents only talk to qualified buyers now.",
    name: 'Rahul Verma',
    role: 'Sales Head, Apex Properties',
    avatar: '/assets/testimonial-1.jpg',
    metric: '+40% qualified leads',
  },
  {
    quote: "The Telugu language support is a game-changer. Our buyers feel heard from the first call.",
    name: 'Priya Naidu',
    role: 'Director, Naidu Realty',
    avatar: '/assets/testimonial-2.jpg',
    metric: '+60% visit bookings',
  },
]

export default function TestimonialsSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const cardsRef = useRef<HTMLDivElement[]>([])
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const trig = ScrollTrigger.create({
      trigger: section,
      start: 'top 75%',
      onEnter: () => {
        setInView(true)
        cardsRef.current.forEach((card, i) => {
          if (!card) return
          const xDir = i === 0 ? -30 : 30
          gsap.fromTo(card,
            { opacity: 0, x: xDir },
            { opacity: 1, x: 0, duration: 0.6, ease: 'power3.out', delay: i * 0.2 }
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
        <div className={`mb-12 text-center transition-all duration-600 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="eyebrow justify-center">TESTIMONIALS</div>
          <h2
            className="font-display font-bold leading-tight"
            style={{
              color: 'var(--text-primary)',
              fontSize: 'clamp(28px, 3.5vw, 38px)',
              letterSpacing: '-0.015em',
            }}
          >
            Trusted by Hyderabad&apos;s fastest-growing real estate teams
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {testimonials.map((t, i) => (
            <div
              key={t.name}
              ref={(el) => { if (el) cardsRef.current[i] = el }}
              className="testimonial-card"
              style={{ opacity: 0 }}
            >
              <p
                className="text-lg leading-relaxed italic mb-6"
                style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-body)' }}
              >
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={t.avatar}
                    alt={t.name}
                    className="w-10 h-10 rounded-full object-cover"
                    loading="lazy"
                  />
                  <div>
                    <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                      {t.name}
                    </p>
                    <p className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
                      {t.role}
                    </p>
                  </div>
                </div>
                <span
                  className="font-mono text-[11px] px-3 py-1 rounded-full shrink-0"
                  style={{
                    color: 'var(--success-bright)',
                    border: '1px solid rgba(31,122,77,0.3)',
                  }}
                >
                  {t.metric}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
