import { useRef, useEffect, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ArrowRight } from 'lucide-react'
import FluidDistortionField from '../effects/FluidDistortionField'

gsap.registerPlugin(ScrollTrigger)

export default function CTASection() {
  const sectionRef = useRef<HTMLElement>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const trig = ScrollTrigger.create({
      trigger: section,
      start: 'top 70%',
      onEnter: () => setInView(true),
    })

    return () => { trig.kill() }
  }, [])

  return (
    <section
      ref={sectionRef}
      className="section-padding relative overflow-hidden"
      style={{ background: 'var(--deep-navy)' }}
    >
      <FluidDistortionField
        colors={{
          color1: [28, 44, 166],
          color2: [42, 63, 224],
          color3: [90, 108, 255],
        }}
        seed={999.9}
        intensity={0.7}
      />
      <div className="content-container relative text-center" style={{ zIndex: 1 }}>
        <div className={`max-w-[640px] mx-auto transition-all duration-600 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="eyebrow justify-center">NEXT STEP</div>
          <h2
            className="font-display font-bold leading-tight mb-4"
            style={{
              color: 'var(--text-primary)',
              fontSize: 'clamp(32px, 4vw, 42px)',
              letterSpacing: '-0.015em',
            }}
          >
            Ready to stop missing calls?
          </h2>
          <p className="text-base mb-8" style={{ color: 'var(--text-secondary)' }}>
            Set up Wakilz in under an hour. Your first AI-powered call today.
          </p>
          <a
            href="https://calendar.app.google/t6bp5VNVe3BRzBcv7"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary text-base px-8 py-4 inline-flex"
          >
            Start free trial
            <ArrowRight size={18} />
          </a>
          <p className="font-mono text-xs mt-4" style={{ color: 'var(--text-muted)' }}>
            No credit card required
          </p>
        </div>
      </div>
    </section>
  )
}
