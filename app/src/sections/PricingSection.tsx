import { useRef, useEffect, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Check } from 'lucide-react'

gsap.registerPlugin(ScrollTrigger)

const plan = {
  name: 'Enterprise',
  badge: 'Tailored Solution',
  desc: 'For small to large teams',
  features: [
    'Unlimited conversations & phone numbers',
    'Self-learning AI voice agent configured for your listings',
    'Instant response in English, Telugu, and Hindi',
    'Custom integrations with your CRM (Salesforce, HubSpot, Sheets, etc.)',
    'Dedicated support engineer & SLA guarantee',
    '1-on-1 team onboarding & custom configuration',
  ],
  cta: 'Connect to Sales',
}

export default function PricingSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const trig = ScrollTrigger.create({
      trigger: section,
      start: 'top 80%',
      onEnter: () => setInView(true),
    })

    return () => { trig.kill() }
  }, [])

  return (
    <section
      ref={sectionRef}
      id="pricing"
      className="section-padding"
      style={{ background: '#0F1929' }}
    >
      <div className="content-container">
        <div className={`mb-12 transition-all duration-600 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="eyebrow">PRICING</div>
          <h2
            className="font-display font-bold leading-tight mb-4"
            style={{
              color: 'var(--text-primary)',
              fontSize: 'clamp(28px, 3.5vw, 38px)',
              letterSpacing: '-0.015em',
            }}
          >
            Enterprise Voice Automation
          </h2>
          <p className="text-base max-w-[480px] mb-8" style={{ color: 'var(--text-secondary)' }}>
            One platform, unlimited potential. Tailored specifically to your real estate business.
          </p>
        </div>

        {/* Centered Single Card */}
        <div className="flex justify-center">
          <div
            className={`price-card max-w-[640px] w-full transition-all duration-600 ${
              inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            } popular`}
            style={{
              borderColor: 'var(--accent)',
              boxShadow: '0 0 40px rgba(42, 63, 224, 0.15)',
            }}
          >
            <span
              className="font-mono text-[10px] tracking-wider uppercase px-2.5 py-1 rounded-full self-start mb-3"
              style={{ background: 'var(--accent)', color: 'var(--text-primary)' }}
            >
              {plan.badge}
            </span>
            <h3
              className="font-display font-bold text-2xl mb-1"
              style={{ color: 'var(--text-primary)' }}
            >
              {plan.name}
            </h3>
            <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>
              {plan.desc}
            </p>
            <div className="font-display font-bold text-[34px] mb-6" style={{ color: 'var(--text-primary)' }}>
              Custom Pricing
            </div>
            <ul className="list-none space-y-3 mb-8 flex-1">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  <Check size={16} className="shrink-0 mt-0.5" style={{ color: 'var(--success-bright)' }} />
                  {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => {
                const el = document.getElementById('contact-sales')
                if (el) el.scrollIntoView({ behavior: 'smooth' })
              }}
              className="block w-full text-center font-semibold text-sm py-3 rounded transition-all duration-200 hover:opacity-90"
              style={{
                background: 'var(--accent)',
                color: 'var(--text-primary)',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {plan.cta}
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
