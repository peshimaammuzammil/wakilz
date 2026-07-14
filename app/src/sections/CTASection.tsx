import { useRef, useEffect, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ArrowRight, CheckCircle2, Loader2, AlertCircle } from 'lucide-react'
import FluidDistortionField from '../effects/FluidDistortionField'

gsap.registerPlugin(ScrollTrigger)

const SHEETS_API_URL = 'https://script.google.com/macros/s/AKfycbwwTTKU9HVyLOagFb6hj1YzR9YZiUA1kqkf5tmNucWsqZlWwvfTa-JFCMkkK0tH-sY4qw/exec'

export default function CTASection() {
  const sectionRef = useRef<HTMLElement>(null)
  const [inView, setInView] = useState(false)

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    location: '',
    problem: '',
  })
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('submitting')
    setErrorMessage('')

    try {
      // Send as URLSearchParams - this is a "simple" CORS request that
      // Google Apps Script handles natively without needing CORS preflight.
      // Use e.parameter.fieldName in your Apps Script to read the values.
      const params = new URLSearchParams()
      params.append('name', formData.name)
      params.append('email', formData.email)
      params.append('phone', formData.phone)
      params.append('company', formData.company)
      params.append('location', formData.location)
      params.append('problem', formData.problem)

      await fetch(SHEETS_API_URL, {
        method: 'POST',
        mode: 'no-cors', // Crucial: Google Apps Script redirects require this
        body: params,
      })

      // With no-cors, the response is opaque and we can't read res.ok or res.status.
      // If the fetch doesn't throw a network error, we assume the request went through.
      setStatus('success')
      setFormData({
        name: '',
        email: '',
        phone: '',
        company: '',
        location: '',
        problem: '',
      })
    } catch (err: any) {
      console.error('Error submitting form:', err)
      setStatus('error')
      setErrorMessage(err.message || 'Something went wrong. Please check your network and try again.')
    }
  }

  return (
    <section
      ref={sectionRef}
      id="contact-sales"
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
      <div className="content-container relative" style={{ zIndex: 1 }}>
        <div className={`max-w-[700px] mx-auto transition-all duration-600 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="eyebrow justify-center">GET IN TOUCH</div>
          
          <h2
            className="font-display font-bold leading-tight mb-4 text-center"
            style={{
              color: 'var(--text-primary)',
              fontSize: 'clamp(32px, 4vw, 42px)',
              letterSpacing: '-0.015em',
            }}
          >
            Connect with our Sales Team
          </h2>
          <p className="text-base mb-8 text-center" style={{ color: 'var(--text-secondary)' }}>
            Fill in your details below and our team will get back to you shortly to set up your AI voice agents.
          </p>

          {status === 'success' ? (
            <div
              className="p-8 rounded-lg text-center"
              style={{
                background: 'rgba(22, 32, 50, 0.7)',
                backdropFilter: 'blur(16px)',
                border: '1px solid var(--success-bright)',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)',
              }}
            >
              <div className="flex justify-center mb-4">
                <CheckCircle2 size={48} style={{ color: 'var(--success-bright)' }} />
              </div>
              <h3 className="font-display font-bold text-xl mb-2" style={{ color: 'var(--text-primary)' }}>
                Thank you!
              </h3>
              <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--text-secondary)' }}>
                Your details have been successfully recorded. Our sales team is reviewing your inquiry and will connect with you soon.
              </p>
              <button
                onClick={() => setStatus('idle')}
                className="btn-secondary font-mono text-sm"
              >
                Submit another inquiry
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="space-y-5 p-8 rounded-lg"
              style={{
                background: 'rgba(22, 32, 50, 0.7)',
                backdropFilter: 'blur(16px)',
                border: '1px solid var(--border)',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)',
              }}
            >
              {status === 'error' && (
                <div
                  className="p-4 rounded flex items-start gap-3 text-sm"
                  style={{
                    background: 'rgba(220, 38, 38, 0.1)',
                    border: '1px solid rgba(220, 38, 38, 0.3)',
                    color: '#ef4444',
                  }}
                >
                  <AlertCircle className="shrink-0 mt-0.5" size={16} />
                  <div>{errorMessage}</div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Name */}
                <div className="space-y-1.5">
                  <label htmlFor="name" className="font-mono text-xs text-[var(--text-secondary)] block">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Your Name"
                    className="w-full px-4 py-3 rounded text-sm bg-[var(--surface-light)] border transition-colors duration-200 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                    style={{ borderColor: 'var(--border)' }}
                  />
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label htmlFor="email" className="font-mono text-xs text-[var(--text-secondary)] block">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@company.com"
                    className="w-full px-4 py-3 rounded text-sm bg-[var(--surface-light)] border transition-colors duration-200 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                    style={{ borderColor: 'var(--border)' }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Phone */}
                <div className="space-y-1.5">
                  <label htmlFor="phone" className="font-mono text-xs text-[var(--text-secondary)] block">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-4 py-3 rounded text-sm bg-[var(--surface-light)] border transition-colors duration-200 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                    style={{ borderColor: 'var(--border)' }}
                  />
                </div>

                {/* Company Details */}
                <div className="space-y-1.5">
                  <label htmlFor="company" className="font-mono text-xs text-[var(--text-secondary)] block">
                    Company Details
                  </label>
                  <input
                    type="text"
                    id="company"
                    name="company"
                    required
                    value={formData.company}
                    onChange={handleChange}
                    placeholder="Real Estate Agency / Team Name"
                    className="w-full px-4 py-3 rounded text-sm bg-[var(--surface-light)] border transition-colors duration-200 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                    style={{ borderColor: 'var(--border)' }}
                  />
                </div>
              </div>

              {/* Location */}
              <div className="space-y-1.5">
                <label htmlFor="location" className="font-mono text-xs text-[var(--text-secondary)] block">
                  Location
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  required
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="City, Country"
                  className="w-full px-4 py-3 rounded text-sm bg-[var(--surface-light)] border transition-colors duration-200 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                  style={{ borderColor: 'var(--border)' }}
                />
              </div>

              {/* Current Problem Faced */}
              <div className="space-y-1.5">
                <label htmlFor="problem" className="font-mono text-xs text-[var(--text-secondary)] block">
                  Current Problem Faced
                </label>
                <textarea
                  id="problem"
                  name="problem"
                  required
                  rows={4}
                  value={formData.problem}
                  onChange={handleChange}
                  placeholder="Describe your current bottleneck (e.g. missing buyer leads after hours, manual WhatsApp follow-ups, language barriers, etc.)"
                  className="w-full px-4 py-3 rounded text-sm bg-[var(--surface-light)] border transition-colors duration-200 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] resize-none"
                  style={{ borderColor: 'var(--border)' }}
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={status === 'submitting'}
                className="btn-primary w-full py-4 text-sm font-semibold justify-center flex items-center gap-2 rounded transition-all duration-200"
                style={{
                  background: 'var(--accent)',
                  color: 'var(--text-primary)',
                  border: 'none',
                  cursor: status === 'submitting' ? 'not-allowed' : 'pointer',
                  opacity: status === 'submitting' ? 0.8 : 1,
                }}
              >
                {status === 'submitting' ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Recording Details...
                  </>
                ) : (
                  <>
                    Connect to Sales
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}
