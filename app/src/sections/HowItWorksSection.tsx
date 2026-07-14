import { useRef, useEffect, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Plug, ToggleRight, Phone, TrendingUp } from 'lucide-react'

gsap.registerPlugin(ScrollTrigger)

const steps = [
  { num: '01', title: 'Connect', desc: 'Link your phone number or WhatsApp Business account.', Icon: Plug },
  { num: '02', title: 'Activate', desc: 'Turn on the modules you need — one toggle at a time.', Icon: ToggleRight },
  { num: '03', title: 'Answer', desc: 'Wakilz starts handling calls and messages immediately.', Icon: Phone },
  { num: '04', title: 'Convert', desc: 'Review qualified leads and booked visits in your dashboard.', Icon: TrendingUp },
]

export default function HowItWorksSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const lineRef = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const section = sectionRef.current
    if (!section || !lineRef.current) return

    const trig = ScrollTrigger.create({
      trigger: section,
      start: 'top 80%',
      onEnter: () => setInView(true),
    })

    const lineTl = gsap.fromTo(
      lineRef.current,
      { scaleX: 0 },
      {
        scaleX: 1,
        duration: 1.2,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: section,
          start: 'top 60%',
          end: 'bottom 60%',
          scrub: 1,
        },
      }
    )

    return () => {
      trig.kill()
      if (lineTl.scrollTrigger) lineTl.scrollTrigger.kill()
    }
  }, [])

  return (
    <section
      ref={sectionRef}
      id="how-it-works"
      className="section-padding"
      style={{ background: 'var(--deep-navy)' }}
    >
      <div className="content-container">
        <div className={`mb-16 transition-all duration-600 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="eyebrow">HOW IT WORKS</div>
          <h2
            className="font-display font-bold leading-tight"
            style={{
              color: 'var(--text-primary)',
              fontSize: 'clamp(28px, 3.5vw, 38px)',
              letterSpacing: '-0.015em',
            }}
          >
            From signup to live calls, same afternoon.
          </h2>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connecting line */}
          <div
            ref={lineRef}
            className="hidden lg:block absolute top-[28px] left-0 right-0 h-[1px] origin-left"
            style={{ background: 'var(--border)' }}
          >
            <div
              className="absolute inset-0 origin-left"
              style={{ background: 'linear-gradient(to right, var(--accent), var(--accent-glow))' }}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
            {steps.map((step, i) => (
              <div
                key={step.num}
                className={`relative transition-all duration-600 ${
                  inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
                style={{ transitionDelay: `${i * 150}ms` }}
              >
                {/* Dot */}
                <div
                  className="hidden lg:flex w-4 h-4 rounded-full items-center justify-center mb-6"
                  style={{ background: 'var(--accent)', border: '3px solid var(--deep-navy)' }}
                />
                <div
                  className="font-display font-bold text-[28px] mb-2"
                  style={{ color: 'var(--accent)' }}
                >
                  {step.num}
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <step.Icon size={18} style={{ color: 'var(--accent-glow)' }} />
                  <h3
                    className="font-display font-semibold text-lg"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {step.title}
                  </h3>
                </div>
                <p className="text-sm leading-relaxed max-w-[240px]" style={{ color: 'var(--text-secondary)' }}>
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
