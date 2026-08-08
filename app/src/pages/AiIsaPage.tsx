import { useEffect } from 'react'
import Navigation from '../components/Navigation'
import Footer from '../components/Footer'
import { PhoneCall, Zap, CheckCircle2, Calendar, ShieldCheck, ArrowRight } from 'lucide-react'

export default function AiIsaPage() {
  useEffect(() => {
    document.title = "AI ISA for Real Estate — 24/7 Automated Inside Sales Agent | Wakilz"
    window.scrollTo(0, 0)
  }, [])

  return (
    <div style={{ background: 'var(--deep-navy)', minHeight: '100vh', color: '#FFF' }}>
      <Navigation />

      <main className="pt-32 pb-20 px-6 max-w-6xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <span className="px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-4 inline-block">
            AI Inside Sales Agent (ISA)
          </span>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
            Automated AI ISA for Real Estate Brokers & Agents
          </h1>
          <p className="text-lg md:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Never miss a real estate lead again. Wakilz AI ISA responds to inbound calls within 60 seconds, qualifies buyers and sellers, and books appointments directly into your calendar 24/7.
          </p>
          <div className="mt-8 flex flex-wrap gap-4 justify-center">
            <a
              href="/#contact-sales"
              className="px-8 py-4 rounded-xl font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2"
            >
              Get Started with AI ISA <ArrowRight className="w-5 h-5" />
            </a>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid md:grid-cols-3 gap-8 my-16">
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
            <Zap className="w-10 h-10 text-indigo-400 mb-4" />
            <h2 className="text-xl font-bold mb-2">Speed-to-Lead Under 60s</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Leads called within 5 minutes are 21x more likely to convert. Wakilz answers inbound calls instantly day or night.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mb-4" />
            <h2 className="text-xl font-bold mb-2">Deep Lead Qualification</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Automatically captures budget, location preferences, financing status, and buying timeline before handing off to human agents.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
            <Calendar className="w-10 h-10 text-purple-400 mb-4" />
            <h2 className="text-xl font-bold mb-2">Automated Site Visit Booking</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Syncs with Google Calendar, Outlook, and CRM schedules to confirm property viewing slots on the spot.
            </p>
          </div>
        </div>

        {/* Real Estate CRM Integrations Section */}
        <div className="p-8 rounded-3xl bg-gradient-to-b from-indigo-950/40 to-slate-900 border border-indigo-500/20 text-center my-16">
          <ShieldCheck className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-4">Integrates with Your Real Estate CRM</h2>
          <p className="text-slate-300 max-w-2xl mx-auto mb-6 text-sm">
            Seamlessly pushes call recordings, qualified lead transcripts, and lead scores directly into Follow Up Boss, Salesforce, HubSpot, Google Sheets, and custom WhatsApp workflows.
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-slate-400 text-sm font-semibold">
            <span>✓ Follow Up Boss</span>
            <span>✓ Salesforce</span>
            <span>✓ HubSpot</span>
            <span>✓ Google Sheets</span>
            <span>✓ WhatsApp Business</span>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
