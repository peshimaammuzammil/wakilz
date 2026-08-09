import { useEffect } from 'react'
import Navigation from '../components/Navigation'
import Footer from '../components/Footer'
import CTASection from '../sections/CTASection'
import { Globe, Languages, Sparkles, Phone, ArrowRight } from 'lucide-react'

export default function MultilingualVoicePage() {
  useEffect(() => {
    document.title = "Multilingual AI Voice Agent for Real Estate — English, Hindi & Telugu | Wakilz"
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
          <span className="px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-4 inline-block">
            Multilingual Voice AI
          </span>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 bg-gradient-to-r from-white via-slate-200 to-emerald-300 bg-clip-text text-transparent">
            Multilingual AI Voice Agent in English, Hindi & Telugu
          </h1>
          <p className="text-lg md:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Speak to buyers in their native language. Wakilz provides natural, ultra-low-latency real estate phone conversations tailored for global markets (US, UAE, UK) and Indian hubs (Telangana, AP, Maharashtra, NCR).
          </p>
          <div className="mt-8 flex flex-wrap gap-4 justify-center">
            <button
              onClick={scrollToSales}
              className="px-8 py-4 rounded-xl font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-lg shadow-emerald-600/30 flex items-center gap-2 cursor-pointer border-none"
            >
              Deploy Multilingual Agent <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Language Grid */}
        <div className="grid md:grid-cols-3 gap-8 my-16">
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
            <Globe className="w-10 h-10 text-indigo-400 mb-4" />
            <h2 className="text-xl font-bold mb-2">English (Global & US)</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Professional, clear, accent-adaptive voice responses for US, UK, UAE, and international property buyers.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
            <Languages className="w-10 h-10 text-amber-400 mb-4" />
            <h2 className="text-xl font-bold mb-2">Hindi (National India)</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Fluent, natural conversational Hindi for pan-India real estate buyers across NCR, Mumbai, Pune, and tier-1 cities.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
            <Sparkles className="w-10 h-10 text-emerald-400 mb-4" />
            <h2 className="text-xl font-bold mb-2">Telugu (South India)</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Native Telugu AI voice agent customized for Hyderabad, Visakhapatnam, Vijayawada, and regional NRI investors.
            </p>
          </div>
        </div>

        {/* Real Estate Markets Served */}
        <div className="p-8 rounded-3xl bg-slate-900/90 border border-slate-800 text-center my-16">
          <Phone className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-4">Targeted Real Estate Markets</h2>
          <p className="text-slate-300 max-w-2xl mx-auto mb-6 text-sm">
            Whether handling domestic buyers in Hyderabad, Bangalore, or Mumbai, or international investors from Dubai and the US, Wakilz delivers instant localized responses.
          </p>
        </div>
      </main>

      {/* Connect to Sales Team Section */}
      <CTASection />

      <Footer />
    </div>
  )
}
