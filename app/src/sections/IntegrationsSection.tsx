import { useRef, useEffect, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const integrations = [
  { name: 'WhatsApp', icon: 'whatsapp.svg', abbr: 'WA' },
  { name: 'Twilio', icon: 'twilio.svg', abbr: 'TW' },
  { name: 'Google Calendar', icon: 'googlecalendar.svg', abbr: 'GC' },
  { name: 'Zapier', icon: 'zapier.svg', abbr: 'ZP' },
  { name: 'HubSpot', icon: 'hubspot.svg', abbr: 'HS' },
  { name: 'Salesforce', icon: 'salesforce.svg', abbr: 'SF' },
  { name: 'Airtable', icon: 'airtable.svg', abbr: 'AT' },
  { name: 'Calendly', icon: 'calendly.svg', abbr: 'CL' },
  { name: 'Notion', icon: 'notion.svg', abbr: 'NT' },
  { name: 'Slack', icon: 'slack.svg', abbr: 'SL' },
  { name: 'ActiveCampaign', icon: 'activecampaign.svg', abbr: 'AC' },
  { name: 'Make', icon: 'make.svg', abbr: 'MK' },
]

export default function IntegrationsSection() {
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
      id="integrations"
      className="section-padding"
      style={{ background: '#0F1929' }}
    >
      <div className="content-container">
        <div className={`mb-12 transition-all duration-600 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="eyebrow">INTEGRATIONS</div>
          <h2
            className="font-display font-bold leading-tight mb-4"
            style={{
              color: 'var(--text-primary)',
              fontSize: 'clamp(28px, 3.5vw, 38px)',
              letterSpacing: '-0.015em',
            }}
          >
            Connect your stack
          </h2>
          <p className="text-base max-w-[480px]" style={{ color: 'var(--text-secondary)' }}>
            Wakilz integrates with the tools you already use — no code required.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {integrations.map((int, i) => (
            <div
              key={int.name}
              className={`integration-card transition-all duration-500 ${
                inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
              }`}
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              <div className="flex flex-col items-center gap-2">
                <div
                  className="w-12 h-12 rounded-md flex items-center justify-center p-2.5 transition-colors duration-200 hover:bg-[var(--surface-light)]"
                  style={{ background: 'var(--surface-light)' }}
                >
                  <img
                    src={`${import.meta.env.BASE_URL}assets/icons/integrations/${int.icon}`}
                    alt={`${int.name} logo`}
                    className="w-7 h-7 object-contain filter brightness-110"
                    onError={(e) => {
                      // Fallback if image fails to load
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
                <span className="font-mono text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  {int.name}
                </span>
              </div>
            </div>
          ))}
        </div>

        <p className="text-center mt-8 font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
          And 20+ more integrations
        </p>
      </div>
    </section>
  )
}
