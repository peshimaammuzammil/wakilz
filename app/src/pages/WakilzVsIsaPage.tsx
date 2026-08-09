import { useEffect } from 'react'
import Navigation from '../components/Navigation'
import Footer from '../components/Footer'
import CTASection from '../sections/CTASection'
import { DollarSign, Clock, Zap, Check, X, ArrowRight, ShieldCheck } from 'lucide-react'

export default function WakilzVsIsaPage() {
  useEffect(() => {
    document.title = "Wakilz AI vs Human ISA — Real Estate Speed to Lead & Cost Comparison"
    window.scrollTo(0, 0)
  }, [])

  const scrollToSales = () => {
    const el = document.getElementById('contact-sales')
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div style={{ background: 'var(--deep-navy)', minHeight: '100vh', color: '#FFF' }}>
      <Navigation />

      <main className="pt-32 pb-10 px-6 max-w-6xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <span className="px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-4 inline-block">
            Comparison & ROI Guide
          </span>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 bg-gradient-to-r from-white via-slate-200 to-blue-300 bg-clip-text text-transparent">
            Wakilz AI vs Human ISA: Cost & Conversion Comparison
          </h1>
          <p className="text-lg md:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
            See how Wakilz AI Voice Agent compares to a human Inside Sales Agent (ISA). Cut lead response time to under 60 seconds and save over 80% on annual staffing costs.
          </p>
          <div className="mt-8 flex flex-wrap gap-4 justify-center">
            <button
              onClick={scrollToSales}
              className="px-8 py-4 rounded-xl font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-lg shadow-blue-600/30 flex items-center gap-2 cursor-pointer border-none"
            >
              Get Started with Wakilz <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="my-16 overflow-x-auto">
          <table className="w-full text-left border-collapse rounded-2xl overflow-hidden bg-slate-900/80 border border-slate-800">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60">
                <th className="p-5 font-semibold text-slate-300">Feature / Metric</th>
                <th className="p-5 font-semibold text-indigo-400 text-lg">Wakilz AI Voice Agent</th>
                <th className="p-5 font-semibold text-slate-400 text-lg">Traditional Human ISA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-sm">
              <tr>
                <td className="p-5 font-medium text-slate-200">Response Speed</td>
                <td className="p-5 font-bold text-emerald-400 flex items-center gap-2"><Zap className="w-4 h-4" /> Instant (Under 60 seconds)</td>
                <td className="p-5 text-slate-400">15 to 45 minutes average</td>
              </tr>
              <tr>
                <td className="p-5 font-medium text-slate-200">Availability</td>
                <td className="p-5 font-bold text-emerald-400">24/7/365 (Nights & Weekends)</td>
                <td className="p-5 text-slate-400">8 to 10 hours/day (Business Hours)</td>
              </tr>
              <tr>
                <td className="p-5 font-medium text-slate-200">Annual Cost</td>
                <td className="p-5 font-bold text-emerald-400">Fraction of software cost (~85% savings)</td>
                <td className="p-5 text-slate-400">$45,000 - $65,000 / year + commissions</td>
              </tr>
              <tr>
                <td className="p-5 font-medium text-slate-200">Multilingual Capability</td>
                <td className="p-5 font-bold text-emerald-400">English, Hindi & Telugu built-in</td>
                <td className="p-5 text-slate-400">Requires hiring multi-staff team</td>
              </tr>
              <tr>
                <td className="p-5 font-medium text-slate-200">CRM Auto-Sync</td>
                <td className="p-5 font-bold text-emerald-400">Instant transcript & audio log push</td>
                <td className="p-5 text-slate-400">Manual data entry needed</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Value Highlights */}
        <div className="grid md:grid-cols-3 gap-8 my-16">
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
            <Clock className="w-10 h-10 text-blue-400 mb-4" />
            <h2 className="text-xl font-bold mb-2">Zero Missed Leads</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Inbound calls after 6 PM are automatically qualified and booked without human delay.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
            <DollarSign className="w-10 h-10 text-emerald-400 mb-4" />
            <h2 className="text-xl font-bold mb-2">Maximum ROI</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Replace high overhead salary expenses while increasing lead-to-showing conversion rates.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
            <ShieldCheck className="w-10 h-10 text-purple-400 mb-4" />
            <h2 className="text-xl font-bold mb-2">Seamless Agent Handoff</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Once qualified, hot leads are immediately transferred to your top real estate agents.
            </p>
          </div>
        </div>
      </main>

      {/* Connect to Sales Team Section */}
      <CTASection />

      <Footer />
    </div>
  )
}
