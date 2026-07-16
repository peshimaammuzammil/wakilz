import { useRef, useEffect, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import FluidDistortionField from '../effects/FluidDistortionField'

gsap.registerPlugin(ScrollTrigger)

interface ProductData {
  module: string
  title: string
  description: string
  visual: React.ReactNode
  bg: string
  colors: {
    color1: [number, number, number]
    color2: [number, number, number]
    color3: [number, number, number]
  }
  seed: number
  flipped: boolean
}

const products: ProductData[] = [
  {
    module: 'MODULE 01',
    title: 'Never let a raw lead go cold.',
    description: 'Wakilz acts as your tireless pre-sales team, answering every digital inquiry in under 2 seconds. We instantly filter out the junk so your closing team wakes up to qualified opportunities.',
    bg: '#0C1524',
    colors: { color1: [12, 21, 36], color2: [28, 44, 166], color3: [42, 63, 224] },
    seed: 42.7,
    flipped: false,
    visual: (
      <div className="font-mono text-xs space-y-3" style={{ color: 'var(--text-secondary)' }}>
        <p>
          <span style={{ color: 'var(--text-muted)' }}>Caller (Telugu):</span>{' '}
          &ldquo;3BHK Kokapet price?&rdquo;
        </p>
        <p>
          <span style={{ color: 'var(--accent)' }}>Wakilz:</span>{' '}
          &ldquo;Kokapet 3BHK starts at 1.2Cr. When can you visit?&rdquo;
        </p>
        <div className="pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
          <p style={{ color: 'var(--success-bright)', fontSize: '11px' }}>● Language detected: Telugu</p>
          <p style={{ color: 'var(--success-bright)', fontSize: '11px' }}>● Response time: 1.2s</p>
        </div>
      </div>
    ),
  },
  {
    module: 'MODULE 02',
    title: 'Qualify leads before your team dials.',
    description: 'Budget, timeline, inventory configuration — scored automatically based on your specific mandate. Your brokers only speak to high-intent buyers.',
    bg: '#0F1929',
    colors: { color1: [28, 44, 166], color2: [42, 63, 224], color3: [90, 108, 255] },
    seed: 137.3,
    flipped: true,
    visual: (
      <div className="space-y-3">
        {[
          { label: 'Budget', value: '1.1-1.3Cr', score: 95 },
          { label: 'Timeline', value: 'Visit this week', score: 90 },
          { label: 'Config', value: '3BHK', score: 100 },
        ].map((item) => (
          <div key={item.label} className="flex items-center justify-between gap-3">
            <div className="flex-1">
              <div className="flex justify-between mb-1">
                <span className="font-mono text-[11px]" style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                <span className="font-mono text-[11px]" style={{ color: 'var(--text-muted)' }}>{item.value}</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface-light)' }}>
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{ width: `${item.score}%`, background: 'var(--success)' }}
                />
              </div>
            </div>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="8" fill="rgba(31,122,77,0.2)" />
              <path d="M5 8L7 10L11 6" stroke="#4FBE87" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        ))}
        <div className="pt-3 border-t flex justify-between items-center" style={{ borderColor: 'var(--border)' }}>
          <span className="font-mono text-[11px]" style={{ color: 'var(--text-muted)' }}>Overall Score</span>
          <span className="font-display font-bold text-xl" style={{ color: 'var(--success-bright)' }}>92/100</span>
        </div>
      </div>
    ),
  },
  {
    module: 'MODULE 03',
    title: 'Book Site Visits (SVs) into your calendar.',
    description: 'Once qualified, Wakilz automatically checks availability and schedules the Site Visit directly into your sourcing managers\' or closing team\'s calendars. Confirms via WhatsApp.',
    bg: '#0C1524',
    colors: { color1: [12, 21, 36], color2: [31, 122, 77], color3: [79, 190, 135] },
    seed: 231.9,
    flipped: false,
    visual: (
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full" style={{ background: 'var(--success-bright)' }} />
          <span className="font-mono text-[11px]" style={{ color: 'var(--success-bright)' }}>Confirmed</span>
        </div>
        <p className="font-display font-semibold text-base mb-1" style={{ color: 'var(--text-primary)' }}>
          Saturday, 11:00 AM
        </p>
        <p className="font-mono text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
          Kokapet Site Visit
        </p>
        <div className="flex gap-2 flex-wrap">
          <span className="font-mono text-[10px] px-2 py-1 rounded-full" style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
            Calendar synced
          </span>
          <span className="font-mono text-[10px] px-2 py-1 rounded-full" style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
            WhatsApp sent
          </span>
        </div>
      </div>
    ),
  },
  {
    module: 'MODULE 04',
    title: "Post-Sales & Collections Automation.",
    description: 'The relationship doesn\'t end at booking. Automatically trigger payment reminders, document collection nudges, and possession updates via WhatsApp to keep cash flow moving.',
    bg: '#0F1929',
    colors: { color1: [28, 44, 166], color2: [42, 63, 224], color3: [90, 108, 255] },
    seed: 55.1,
    flipped: true,
    visual: (
      <div className="space-y-3">
        {[
          { day: 'Day 7', label: 'Payment reminder', status: 'Sent' },
          { day: 'Day 14', label: 'Document check', status: 'Pending' },
          { day: 'Day 30', label: 'Possession update', status: 'Scheduled' },
        ].map((item) => (
          <div key={item.day} className="flex items-center gap-3">
            <div
              className="w-16 text-right font-mono text-[11px] shrink-0"
              style={{ color: 'var(--text-muted)' }}
            >
              {item.day}
            </div>
            <div
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ background: item.status === 'Sent' ? 'var(--success-bright)' : 'var(--border)' }}
            />
            <div className="flex-1">
              <p className="font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>{item.label}</p>
            </div>
            <span
              className="font-mono text-[10px] px-2 py-0.5 rounded-full"
              style={{
                color: item.status === 'Sent' ? 'var(--success-bright)' : 'var(--text-muted)',
                border: `1px solid ${item.status === 'Sent' ? 'rgba(79,190,135,0.3)' : 'var(--border)'}`,
              }}
            >
              {item.status}
            </span>
          </div>
        ))}
      </div>
    ),
  },
  {
    module: 'MODULE 05',
    title: 'No enquiry goes cold.',
    description: 'Timed drip sequences over WhatsApp. Project broadcasts, referral requests, and re-engagement — all automated.',
    bg: '#0C1524',
    colors: { color1: [12, 21, 36], color2: [184, 121, 12], color3: [212, 160, 48] },
    seed: 314.2,
    flipped: false,
    visual: (
      <div className="font-mono text-xs space-y-2">
        <div className="flex gap-2">
          <span style={{ color: 'var(--text-muted)' }}>Day 1</span>
          <span style={{ color: 'var(--text-secondary)' }}>&ldquo;Thanks for your interest! Here are the project details.&rdquo;</span>
        </div>
        <div className="flex gap-2">
          <span style={{ color: 'var(--text-muted)' }}>Day 3</span>
          <span style={{ color: 'var(--text-secondary)' }}>&ldquo;Still considering? Here&apos;s what other buyers chose.&rdquo;</span>
        </div>
        <div className="flex gap-2">
          <span style={{ color: 'var(--text-muted)' }}>Day 7</span>
          <span style={{ color: 'var(--text-secondary)' }}>&ldquo;Limited units left. Book a visit this week?&rdquo;</span>
        </div>
        <div className="pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '11px' }}>● 3 messages sent · 2 read · 1 replied</p>
        </div>
      </div>
    ),
  },
  {
    module: 'MODULE 06',
    title: 'One dashboard for every conversation.',
    description: 'Calls, WhatsApp, web chat — unified in one inbox. Full transcripts, recordings, and team handoff.',
    bg: '#0F1929',
    colors: { color1: [28, 44, 166], color2: [42, 63, 224], color3: [90, 108, 255] },
    seed: 88.6,
    flipped: true,
    visual: (
      <div className="space-y-2">
        {[
          { name: 'Rajesh K.', type: 'Call', time: '2m ago', status: 'New' },
          { name: 'Priya M.', type: 'WhatsApp', time: '15m ago', status: 'Replied' },
          { name: 'Apex Properties', type: 'Web chat', time: '1h ago', status: 'Resolved' },
        ].map((conv) => (
          <div
            key={conv.name}
            className="flex items-center justify-between py-2 px-3 rounded"
            style={{ background: conv.status === 'New' ? 'rgba(42,63,224,0.08)' : 'transparent' }}
          >
            <div className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center font-mono text-[9px]"
                style={{ background: 'var(--surface-light)', color: 'var(--text-secondary)' }}
              >
                {conv.name.charAt(0)}
              </div>
              <div>
                <p className="font-mono text-[11px]" style={{ color: 'var(--text-primary)' }}>{conv.name}</p>
                <p className="font-mono text-[10px]" style={{ color: 'var(--text-muted)' }}>{conv.type}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-mono text-[10px]" style={{ color: 'var(--text-muted)' }}>{conv.time}</p>
              <span
                className="font-mono text-[9px] px-1.5 py-0.5 rounded-full"
                style={{
                  color: conv.status === 'New' ? 'var(--accent-glow)' : conv.status === 'Resolved' ? 'var(--success-bright)' : 'var(--text-muted)',
                  background: conv.status === 'New' ? 'rgba(42,63,224,0.15)' : 'transparent',
                }}
              >
                {conv.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    ),
  },
]

function ProductItem({ product, index }: { product: ProductData; index: number }) {
  const sectionRef = useRef<HTMLElement>(null)
  const textRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const trigger = ScrollTrigger.create({
      trigger: section,
      start: 'top 80%',
      onEnter: () => setInView(true),
    })

    return () => { trigger.kill() }
  }, [])

  useEffect(() => {
    if (!inView) return
    const tl = gsap.timeline()
    if (textRef.current) {
      tl.fromTo(textRef.current, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' })
    }
    if (cardRef.current) {
      tl.fromTo(cardRef.current, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, '-=0.45')
    }
    return () => { tl.kill() }
  }, [inView])

  const textContent = (
    <div ref={textRef} style={{ opacity: 0 }}>
      <div className="eyebrow">{product.module}</div>
      <h2
        className="font-display font-bold leading-tight mb-4"
        style={{
          color: 'var(--text-primary)',
          fontSize: 'clamp(28px, 3.5vw, 38px)',
          letterSpacing: '-0.015em',
        }}
      >
        {product.title}
      </h2>
      <p className="text-base leading-relaxed max-w-[520px]" style={{ color: 'var(--text-secondary)' }}>
        {product.description}
      </p>
    </div>
  )

  const visualContent = (
    <div ref={cardRef} className="product-card" style={{ opacity: 0 }}>
      {product.visual}
    </div>
  )

  return (
    <section
      ref={sectionRef}
      id="platform"
      className="section-padding relative overflow-hidden"
      style={{
        background: product.bg,
        marginTop: index === 0 ? undefined : undefined,
      }}
    >
      <FluidDistortionField
        colors={product.colors}
        seed={product.seed}
        intensity={0.6}
      />
      <div className="content-container relative" style={{ zIndex: 1 }}>
        <div
          className={`grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center ${
            product.flipped ? 'lg:[direction:rtl]' : ''
          }`}
        >
          <div className={product.flipped ? 'lg:[direction:ltr]' : ''}>
            {product.flipped ? visualContent : textContent}
          </div>
          <div className={product.flipped ? 'lg:[direction:ltr]' : ''}>
            {product.flipped ? textContent : visualContent}
          </div>
        </div>
      </div>
    </section>
  )
}

export default function ProductSections() {
  return (
    <>
      {products.map((product, i) => (
        <ProductItem key={product.module} product={product} index={i} />
      ))}
    </>
  )
}
