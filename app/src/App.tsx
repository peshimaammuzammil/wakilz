import { useEffect, useState, useRef } from 'react'
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import './App.css'

import Navigation from './components/Navigation'
import Footer from './components/Footer'
import HeroSphere from './effects/HeroSphere'
import HeroSection from './sections/HeroSection'
import ProductSections from './sections/ProductSection'
import HowItWorksSection from './sections/HowItWorksSection'
import LiveConsoleSection from './sections/LiveConsoleSection'
import IntegrationsSection from './sections/IntegrationsSection'
import PricingSection from './sections/PricingSection'
import CTASection from './sections/CTASection'

gsap.registerPlugin(ScrollTrigger)

function App() {
  const [heroVisible, setHeroVisible] = useState(true)
  const lenisRef = useRef<Lenis | null>(null)

  // Initialize Lenis smooth scroll
  useEffect(() => {
    const lenis = new Lenis({
      lerp: 0.08,
      wheelMultiplier: 1.4,
    })
    lenisRef.current = lenis

    // Connect Lenis to GSAP ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update)

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000)
    })
    gsap.ticker.lagSmoothing(0)

    return () => {
      lenis.destroy()
      gsap.ticker.remove(lenis.raf as any)
    }
  }, [])

  // Track hero visibility for sphere
  useEffect(() => {
    const onScroll = () => {
      setHeroVisible(window.scrollY < window.innerHeight * 1.2)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div style={{ background: 'var(--deep-navy)', minHeight: '100vh' }}>
      {/* Fixed hero sphere canvas */}
      <HeroSphere visible={heroVisible} />

      {/* Gradient overlay for text legibility - only visible during hero */}
      <div
        className="hero-gradient-overlay"
        style={{
          opacity: heroVisible ? 1 : 0,
          transition: 'opacity 0.5s ease',
          pointerEvents: 'none',
        }}
      />

      {/* Navigation */}
      <Navigation />

      {/* Main content */}
      <main className="relative" style={{ zIndex: 2 }}>
        <HeroSection />
        <ProductSections />
        <HowItWorksSection />
        <LiveConsoleSection />
        <IntegrationsSection />
        <PricingSection />
        <CTASection />
      </main>

      <Footer />
    </div>
  )
}

export default App
