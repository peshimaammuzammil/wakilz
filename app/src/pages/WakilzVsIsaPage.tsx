import { useState, useEffect } from 'react'
import Navigation from '../components/Navigation'
import Footer from '../components/Footer'
import CTASection from '../sections/CTASection'
import InboundCallModal from '../components/InboundCallModal'
import { DollarSign, Clock, Zap, Check, X, ArrowRight, ShieldCheck, PhoneCall, HelpCircle, TrendingUp, Users } from 'lucide-react'

export default function WakilzVsIsaPage() {
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    document.title = "Wakilz AI vs Human ISA — Real Estate Speed to Lead & Cost Comparison (2026)"
    window.scrollTo(0, 0)

    // Add JSON-LD FAQ and Article Schema
    const schemaScript = document.createElement('script')
    schemaScript.type = 'application/ld+json'
    schemaScript.id = 'wakilz-vs-isa-schema'
    schemaScript.innerHTML = JSON.stringify({
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Article",
          "headline": "Wakilz AI Voice Agent vs Human ISA: Cost & Conversion Comparison",
          "description": "Comprehensive speed-to-lead and cost breakdown comparing AI voice agents with traditional human Inside Sales Agents (ISAs) for real estate brokerages.",
          "author": {
            "@type": "Organization",
            "name": "Wakilz",
            "url": "https://wakilz.com"
          },
          "publisher": {
            "@type": "Organization",
            "name": "Wakilz",
            "url": "https://wakilz.com"
          },
          "datePublished": "2026-01-15",
          "dateModified": "2026-10-30"
        },
        {
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "How much does a human ISA cost compared to Wakilz AI?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "A full-time human Inside Sales Agent (ISA) costs between $45,000 and $65,000 per year in base salary plus performance bonuses, benefits, and software seats. Wakilz AI operates on a fractional software subscription, reducing annual lead qualification costs by over 85%."
              }
            },
            {
              "@type": "Question",
              "name": "What is the speed-to-lead difference between Wakilz AI and a human ISA?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Human ISAs have an average response time of 15 to 45 minutes, with zero response during nights and weekends. Wakilz AI answers inbound calls in under 60 seconds 24/7/365, capitalizing on the 5-minute window where lead conversion is 21x higher."
              }
            },
            {
              "@type": "Question",
              "name": "Can Wakilz AI speak multiple languages?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Yes. Wakilz natively understands and converses in English, Hindi, and Telugu with local dialect recognition and natural intonation, eliminating the need to hire multilingual human sales agents."
              }
            }
          ]
        }
      ]
    })
    document.head.appendChild(schemaScript)

    return () => {
      const existing = document.getElementById('wakilz-vs-isa-schema')
      if (existing) existing.remove()
    }
  }, [])

  const scrollToSales = () => {
    const el = document.getElementById('contact-sales')
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div style={{ background: 'var(--deep-navy)', minHeight: '100vh', color: '#FFF' }}>
      <Navigation />

      <main className="pt-32 pb-16 px-6 max-w-6xl mx-auto">
        {/* Breadcrumb / Tag */}
        <div className="text-center mb-6">
          <span className="px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20 inline-block">
            Comparison & ROI Guide · 2026 Update
          </span>
        </div>

        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 bg-gradient-to-r from-white via-slate-200 to-blue-300 bg-clip-text text-transparent">
            Wakilz AI vs Human ISA: Cost & Conversion Comparison
          </h1>
          <p className="text-lg md:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Comparing speed-to-lead, operational costs, and conversion efficiency between Wakilz AI Voice Agent and traditional human Inside Sales Agents (ISAs).
          </p>

          <div className="mt-8 flex flex-wrap gap-4 justify-center items-center">
            <button
              onClick={() => setModalOpen(true)}
              className="px-7 py-3.5 rounded-xl font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-lg shadow-emerald-600/30 flex items-center gap-2 cursor-pointer border-none text-base"
            >
              <PhoneCall className="w-5 h-5" /> Test Live Bot (+91 94920 60792)
            </button>
            <button
              onClick={scrollToSales}
              className="px-7 py-3.5 rounded-xl font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-lg shadow-blue-600/30 flex items-center gap-2 cursor-pointer border-none text-base"
            >
              Connect to Sales <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Direct GEO Answer Block */}
        <div className="p-6 md:p-8 rounded-2xl bg-slate-900/90 border border-blue-500/30 my-10 shadow-xl">
          <div className="flex items-center gap-2 text-blue-400 font-mono text-xs uppercase tracking-wider mb-3">
            <Zap className="w-4 h-4" /> Quick Summary / Key Takeaway
          </div>
          <p className="text-slate-200 text-base md:text-lg leading-relaxed font-sans">
            <strong>Wakilz AI vs Human ISA Verdict:</strong> A traditional human Inside Sales Agent (ISA) costs <strong>$45,000 to $65,000 annually</strong> in salary plus commissions, operates 40–50 hours per week, and averages a <strong>15 to 45-minute response delay</strong>. In contrast, <strong>Wakilz AI Voice Agent</strong> answers inbound calls in <strong>under 60 seconds 24/7/365</strong>, increases lead qualification rates by <strong>391%</strong> (Velocify benchmark), fluently speaks <strong>English, Hindi, and Telugu</strong>, and cuts staffing overhead by over <strong>85%</strong>.
          </p>
        </div>

        {/* Comparison Table */}
        <div className="my-16 overflow-x-auto">
          <table className="w-full text-left border-collapse rounded-2xl overflow-hidden bg-slate-900/80 border border-slate-800">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/80">
                <th className="p-5 font-semibold text-slate-300">Feature / Metric</th>
                <th className="p-5 font-semibold text-emerald-400 text-lg bg-emerald-950/20">Wakilz AI Voice Agent</th>
                <th className="p-5 font-semibold text-slate-400 text-lg">Traditional Human ISA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-sm">
              <tr>
                <td className="p-5 font-medium text-slate-200">Response Speed (Speed to Lead)</td>
                <td className="p-5 font-bold text-emerald-400 bg-emerald-950/10 flex items-center gap-2">
                  <Zap className="w-4 h-4" /> Instant (&lt; 60 seconds)
                </td>
                <td className="p-5 text-slate-400">15 to 45 minutes average</td>
              </tr>
              <tr>
                <td className="p-5 font-medium text-slate-200">Availability</td>
                <td className="p-5 font-bold text-emerald-400 bg-emerald-950/10">24/7/365 (Nights, Weekends & Holidays)</td>
                <td className="p-5 text-slate-400">8 to 10 hours/day (Business Hours only)</td>
              </tr>
              <tr>
                <td className="p-5 font-medium text-slate-200">Annual Cost</td>
                <td className="p-5 font-bold text-emerald-400 bg-emerald-950/10">Fractional software pricing (~85% savings)</td>
                <td className="p-5 text-slate-400">$45,000 - $65,000/yr salary + benefits & bonus</td>
              </tr>
              <tr>
                <td className="p-5 font-medium text-slate-200">Concurrent Call Handling</td>
                <td className="p-5 font-bold text-emerald-400 bg-emerald-950/10">Unlimited simultaneous inbound callers</td>
                <td className="p-5 text-slate-400">1 call at a time (overflow goes to voicemail)</td>
              </tr>
              <tr>
                <td className="p-5 font-medium text-slate-200">Multilingual Capability</td>
                <td className="p-5 font-bold text-emerald-400 bg-emerald-950/10">English, Hindi & Telugu native fluency</td>
                <td className="p-5 text-slate-400">Requires hiring multi-lingual agents ($$$)</td>
              </tr>
              <tr>
                <td className="p-5 font-medium text-slate-200">CRM Auto-Sync & Logging</td>
                <td className="p-5 font-bold text-emerald-400 bg-emerald-950/10">Instant transcript, audio & score push</td>
                <td className="p-5 text-slate-400">Manual data entry, prone to missed notes</td>
              </tr>
              <tr>
                <td className="p-5 font-medium text-slate-200">Ramping & Training Time</td>
                <td className="p-5 font-bold text-emerald-400 bg-emerald-950/10">Instant (upload property inventory & FAQs)</td>
                <td className="p-5 text-slate-400">4 to 8 weeks onboarding & coaching</td>
              </tr>
              <tr>
                <td className="p-5 font-medium text-slate-200">Turnover & Churn Risk</td>
                <td className="p-5 font-bold text-emerald-400 bg-emerald-950/10">0% turnover rate</td>
                <td className="p-5 text-slate-400">High (average ISA tenure is 9–14 months)</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 3 Core Value Pillars */}
        <div className="grid md:grid-cols-3 gap-8 my-16">
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
            <Clock className="w-10 h-10 text-blue-400 mb-4" />
            <h2 className="text-xl font-bold mb-2">Zero Missed Opportunities</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              60% of real estate inquiries occur outside normal business hours. Wakilz answers instantly at 9:00 PM on Sunday with the same consistency as Monday morning.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
            <DollarSign className="w-10 h-10 text-emerald-400 mb-4" />
            <h2 className="text-xl font-bold mb-2">85%+ Operating Cost Reduction</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Eliminate heavy fixed salaries, health insurance, recruitment fees, and desk costs while scaling inbound call capacity without hiring headcount.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
            <ShieldCheck className="w-10 h-10 text-purple-400 mb-4" />
            <h2 className="text-xl font-bold mb-2">Live Agent Warm Handoff</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Wakilz doesn't replace closing agents—it protects their time. Unqualified tire-kickers are filtered out, while hot buyers are transferred live with CRM context.
            </p>
          </div>
        </div>

        {/* Live Inbound Banner */}
        <div className="p-8 rounded-3xl bg-gradient-to-r from-blue-900/30 via-slate-900 to-indigo-950/40 border border-blue-500/20 text-center my-16">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Experience the Speed Advantage Live</h2>
          <p className="text-slate-300 max-w-2xl mx-auto mb-6 text-sm">
            Call our live real estate AI assistant right now from your mobile phone. Experience sub-second latency and intelligent objection handling firsthand.
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="px-8 py-3.5 rounded-xl font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-lg shadow-emerald-600/30 inline-flex items-center gap-2 cursor-pointer border-none text-base"
          >
            <PhoneCall className="w-5 h-5" /> Call +91 94920 60792 Live
          </button>
        </div>

        {/* FAQ Section */}
        <div className="my-16 max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-3">Frequently Asked Questions</h2>
            <p className="text-slate-400 text-sm">Everything you need to know about replacing or augmenting human ISAs with Wakilz.</p>
          </div>

          <div className="space-y-4">
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
              <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-blue-400" />
                Will prospective buyers realize they are speaking to an AI?
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                Wakilz uses natural, human-like voice synthesis with sub-750ms response latency, breathing pauses, and contextual acknowledgment. Callers receive an immediate, professional, and helpful response without robotic pauses.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
              <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-emerald-400" />
                How does Wakilz sync with our existing real estate CRM?
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                Immediately after each call terminates, the full audio recording, verbatim transcript, lead score, and extracted buyer preferences (budget, location, property type) are pushed directly into Follow Up Boss, Salesforce, HubSpot, or Google Sheets via native webhooks.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
              <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-purple-400" />
                Can human agents take over if a high-intent caller asks complex questions?
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                Yes. Wakilz features automated call forwarding and warm transfer. When a prospect meets your qualification threshold or requests an immediate human agent, the call is instantly routed to your team's mobile phones.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Connect to Sales Team Section */}
      <CTASection />

      <Footer />

      {/* Live Phone Modal */}
      <InboundCallModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  )
}
