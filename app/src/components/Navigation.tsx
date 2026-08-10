import { useState, useEffect } from 'react'
import { Menu, X, LogIn } from 'lucide-react'
import { Link, useNavigate, useLocation } from 'react-router'
import { useAuth } from '@/contexts/AuthContext'

const navLinks = [
  { label: 'Platform', href: '#platform' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Integrations', href: '#integrations' },
]

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { user, profile } = useAuth()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollTo = (href: string) => {
    setMobileOpen(false)
    if (location.pathname === '/') {
      const el = document.querySelector(href)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' })
        return
      }
    }
    navigate(`/${href}`)
  }

  return (
    <nav className={scrolled ? 'scrolled' : ''}>
      <div className="max-w-[1160px] mx-auto px-6 h-full flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 no-underline">
          <img
            src={`${import.meta.env.BASE_URL}assets/images/logo.png?v=2`}
            alt="wakilz logo"
            className="h-6 w-auto object-contain"
          />
          <span
            className="font-display font-bold text-lg tracking-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            wakilz
          </span>
        </Link>

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
          <button
            onClick={() => scrollTo('#contact-sales')}
            className="btn-primary"
            style={{ fontSize: '13px', padding: '8px 18px', fontFamily: 'var(--font-mono)' }}
          >
            Connect to Sales
          </button>
          <button
            id="signin-nav-btn"
            onClick={() => navigate(user ? (profile?.role === 'admin' ? '/admin' : '/dashboard') : '/signin')}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              fontSize: '13px', padding: '8px 16px',
              fontFamily: 'var(--font-mono)', fontWeight: 500,
              background: 'rgba(90,108,255,0.12)',
              border: '1px solid rgba(90,108,255,0.3)',
              borderRadius: '8px',
              color: 'var(--accent-glow)',
              cursor: 'pointer',
              transition: 'background 0.2s, border-color 0.2s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(90,108,255,0.2)'
              ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(90,108,255,0.5)'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(90,108,255,0.12)'
              ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(90,108,255,0.3)'
            }}
          >
            <LogIn size={13} />
            {user ? 'Dashboard' : 'Sign In'}
          </button>
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
              <button
                onClick={() => scrollTo('#contact-sales')}
                className="btn-primary text-sm py-2.5 px-5 w-full justify-center"
              >
                Connect to Sales
              </button>
            </li>
            <li className="pt-1">
              <button
                onClick={() => { setMobileOpen(false); navigate(user ? (profile?.role === 'admin' ? '/admin' : '/dashboard') : '/signin') }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  width: '100%', padding: '10px 20px',
                  fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 500,
                  background: 'rgba(90,108,255,0.12)',
                  border: '1px solid rgba(90,108,255,0.3)',
                  borderRadius: '8px', color: 'var(--accent-glow)', cursor: 'pointer',
                }}
              >
                <LogIn size={13} />
                {user ? 'Dashboard' : 'Sign In'}
              </button>
            </li>
          </ul>
        </div>
      )}
    </nav>
  )
}
