import { useState, useRef, useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Check } from 'lucide-react'

gsap.registerPlugin(ScrollTrigger)

type Billing = 'monthly' | 'annual'

const plans = [
  {
    name: 'Starter',
    badge: null as string | null,
    desc: 'For small teams',
    monthlyPrice: 99,
    features: [
      '1 phone number',
      'Enquiry capture',
      'Buyer qualification',
      '500 conversations/mo',
      'Email support',
    ],
    cta: 'Start free trial',
    ctaStyle: 'secondary' as const,
  },
  {
    name: 'Growth',
    badge: 'MOST POPULAR',
    desc: 'For growing teams',
    monthlyPrice: 299,
    features: [
      'Everything in Starter',
      'Site visit scheduling',
      'Post-sale assistant',
      'WhatsApp follow-ups',
      '5 team members',
      'Priority support',
    ],
    cta: 'Start free trial',
    ctaStyle: 'primary' as const,
  },
  {
    name: 'Enterprise',
    badge: null,
    desc: 'For large teams',
    monthlyPrice: null,
    features: [
      'Unlimited everything',
      'Custom integrations',
      'Dedicated support',
      'SLA guarantee',
      'Onboarding',
    ],
    cta: 'Contact sales',
    ctaStyle: 'secondary' as const,
  },
]

export default function PricingSection() {
  const [billing, setBilling] = useState<Billing>('monthly')
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

  const getPrice = (monthly: number | null) => {
    if (monthly === null) return 'Custom'
    if (billing === 'annual') {
      return `$${Math.round(monthly * 0.8)}`
    }
    return `$${monthly}`
  }

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
            Simple pricing, no surprises
          </h2>
          <p className="text-base max-w-[480px] mb-8" style={{ color: 'var(--text-secondary)' }}>
            Start free. Upgrade when you&apos;re ready.
          </p>

          {/* Toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setBilling('monthly')}
              className="font-mono text-xs px-4 py-2 rounded-full transition-all duration-200"
              style={{
                background: billing === 'monthly' ? 'var(--accent)' : 'transparent',
                color: billing === 'monthly' ? 'var(--text-primary)' : 'var(--text-muted)',
                border: billing === 'monthly' ? '1px solid var(--accent)' : '1px solid var(--border)',
              }}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling('annual')}
              className="font-mono text-xs px-4 py-2 rounded-full transition-all duration-200 flex items-center gap-2"
              style={{
                background: billing === 'annual' ? 'var(--accent)' : 'transparent',
                color: billing === 'annual' ? 'var(--text-primary)' : 'var(--text-muted)',
                border: billing === 'annual' ? '1px solid var(--accent)' : '1px solid var(--border)',
              }}
            >
              Annual
              {billing === 'annual' && (
                <span style={{ color: 'var(--success-bright)' }}>Save 20%</span>
              )}
            </button>
          </div>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {plans.map((plan, i) => (
            <div
              key={plan.name}
              className={`price-card transition-all duration-600 ${
                inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              } ${plan.badge ? 'popular' : ''}`}
              style={{
                transitionDelay: `${i * 100}ms`,
                borderColor: plan.badge ? 'var(--accent)' : undefined,
                boxShadow: plan.badge ? '0 0 40px rgba(42, 63, 224, 0.15)' : undefined,
              }}
            >
              {plan.badge && (
                <span
                  className="font-mono text-[10px] tracking-wider uppercase px-2.5 py-1 rounded-full self-start mb-3"
                  style={{ background: 'var(--accent)', color: 'var(--text-primary)' }}
                >
                  {plan.badge}
                </span>
              )}
              <h3
                className="font-display font-bold text-xl mb-1"
                style={{ color: 'var(--text-primary)' }}
              >
                {plan.name}
              </h3>
              <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>
                {plan.desc}
              </p>
              <div className="font-display font-bold text-[34px] mb-6" style={{ color: 'var(--text-primary)' }}>
                {getPrice(plan.monthlyPrice)}
                {plan.monthlyPrice && (
                  <span className="font-mono text-sm font-normal ml-1" style={{ color: 'var(--text-muted)' }}>
                    /mo
                  </span>
                )}
              </div>
              <ul className="list-none space-y-3 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    <Check size={16} className="shrink-0 mt-0.5" style={{ color: 'var(--success-bright)' }} />
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href="https://calendar.app.google/t6bp5VNVe3BRzBcv7"
                target="_blank"
                rel="noopener noreferrer"
                className={`block text-center font-semibold text-sm py-3 rounded transition-all duration-200 ${
                  plan.ctaStyle === 'primary'
                    ? 'hover:opacity-90'
                    : 'hover:bg-[var(--surface-light)]'
                }`}
                style={{
                  background: plan.ctaStyle === 'primary' ? 'var(--accent)' : 'transparent',
                  color: 'var(--text-primary)',
                  border: plan.ctaStyle === 'primary' ? 'none' : '1px solid var(--border)',
                }}
              >
                {plan.cta}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
