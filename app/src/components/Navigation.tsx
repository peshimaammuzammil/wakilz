import { useState, useEffect } from 'react'
import { Menu, X } from 'lucide-react'

const navLinks = [
  { label: 'Platform', href: '#platform' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Integrations', href: '#integrations' },
]

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollTo = (href: string) => {
    setMobileOpen(false)
    const el = document.querySelector(href)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <nav className={scrolled ? 'scrolled' : ''}>
      <div className="max-w-[1160px] mx-auto px-6 h-full flex items-center justify-between">
        {/* Logo */}
        <a href="#" className="flex items-center gap-2.5 no-underline">
          <div
            className="w-6 h-6 rounded-[4px]"
            style={{ background: 'linear-gradient(135deg, #2A3FE0, #5A6CFF)' }}
          />
          <span
            className="font-display font-bold text-lg tracking-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            wakilz
          </span>
        </a>

        {/* Desktop Nav Links */}
        <ul className="hidden md:flex items-center gap-8 list-none">
          {navLinks.map((link) => (
            <li key={link.href}>
              <button
                onClick={() => scrollTo(link.href)}
                className="font-mono font-medium text-[13px] transition-colors duration-200 hover:text-[var(--text-primary)]"
                style={{ color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                {link.label}
              </button>
            </li>
          ))}
        </ul>

        {/* Right */}
        <div className="hidden md:flex items-center gap-5">
          <span
            className="font-mono text-[13px] cursor-pointer transition-colors duration-200 hover:text-[var(--text-primary)]"
            style={{ color: 'var(--text-secondary)' }}
          >
            Log in
          </span>
          <a
            href="https://calendar.app.google/t6bp5VNVe3BRzBcv7"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary text-sm py-2.5 px-5"
          >
            Start free trial
          </a>
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden bg-transparent border-none cursor-pointer"
          style={{ color: 'var(--text-primary)' }}
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Menu"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          className="md:hidden absolute top-[68px] left-0 right-0 p-6"
          style={{ background: 'rgba(12, 21, 36, 0.95)', backdropFilter: 'blur(12px)' }}
        >
          <ul className="flex flex-col gap-4 list-none p-0">
            {navLinks.map((link) => (
              <li key={link.href}>
                <button
                  onClick={() => scrollTo(link.href)}
                  className="font-mono font-medium text-[13px] w-full text-left"
                  style={{ color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  {link.label}
                </button>
              </li>
            ))}
            <li className="pt-2">
              <a
                href="https://calendar.app.google/t6bp5VNVe3BRzBcv7"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary text-sm py-2.5 px-5 w-full justify-center"
              >
                Start free trial
              </a>
            </li>
          </ul>
        </div>
      )}
    </nav>
  )
}
