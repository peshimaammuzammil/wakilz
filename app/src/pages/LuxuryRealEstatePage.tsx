import { useEffect } from 'react'
import Navigation from '../components/Navigation'
import Footer from '../components/Footer'
import CTASection from '../sections/CTASection'
import { Gem, ShieldCheck, Globe2, Building2, ArrowRight } from 'lucide-react'

export default function LuxuryRealEstatePage() {
  useEffect(() => {
    document.title = "AI Voice Agent for Luxury Real Estate — Premium Broker & Developer Automation | Wakilz"
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
          <span className="px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-4 inline-block">
            Luxury Real Estate Solution
          </span>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 bg-gradient-to-r from-white via-amber-100 to-amber-300 bg-clip-text text-transparent">
            AI Voice Agent for Luxury Real Estate & High-Net-Worth Buyers
          </h1>
          <p className="text-lg md:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Deliver an white-glove, instant phone experience for luxury homebuyers, commercial investors, and NRI property seekers across global hubs (Dubai, USA, London, India).
          </p>
          <div className="mt-8 flex flex-wrap gap-4 justify-center">
            <button
              onClick={scrollToSales}
              className="px-8 py-4 rounded-xl font-semibold bg-amber-600 hover:bg-amber-500 text-white transition-all shadow-lg shadow-amber-600/30 flex items-center gap-2 cursor-pointer border-none"
            >
              Deploy Luxury AI Voice Agent <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid md:grid-cols-3 gap-8 my-16">
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
            <Gem className="w-10 h-10 text-amber-400 mb-4" />
            <h2 className="text-xl font-bold mb-2">White-Glove Conversational AI</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Polished, professional voice tone designed to handle high-ticket luxury listings and HNW buyer inquiries.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
            <Globe2 className="w-10 h-10 text-emerald-400 mb-4" />
            <h2 className="text-xl font-bold mb-2">NRI & Global Investor Calling</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Automates international time-zone calling for luxury developments in Dubai, London, Hyderabad, and Mumbai.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
            <Building2 className="w-10 h-10 text-indigo-400 mb-4" />
            <h2 className="text-xl font-bold mb-2">Private Showing Scheduling</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Qualifies financial capability and books VIP private property viewings directly with luxury listing agents.
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
