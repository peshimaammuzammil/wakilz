import { Link, useNavigate, useLocation } from 'react-router'

export default function Footer() {
  const navigate = useNavigate()
  const location = useLocation()

  const navigateOrScroll = (href: string) => {
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
    <footer style={{ background: 'var(--deep-navy)', borderTop: '1px solid var(--border)' }}>
      <div className="max-w-[1160px] mx-auto px-6 pt-16 pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-2.5 no-underline mb-4">
              <img
                src={`${import.meta.env.BASE_URL}assets/images/logo.png?v=2`}
                alt="wakilz logo"
                className="h-6 w-auto object-contain"
              />
              <span className="font-display font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                wakilz
              </span>
            </Link>
            <p className="text-sm leading-relaxed max-w-[240px]" style={{ color: 'var(--text-muted)' }}>
              AI voice and chat platform for real estate teams.
            </p>
          </div>

          {/* Product & Solutions */}
          <div>
            <h4 className="font-mono text-[11px] tracking-wider uppercase mb-4" style={{ color: 'var(--text-muted)' }}>
              Product & Solutions
            </h4>
            <ul className="list-none p-0 space-y-2">
              <li>
                <Link to="/ai-isa-real-estate" className="text-sm text-slate-400 hover:text-white transition-colors">
                  AI ISA for Real Estate
                </Link>
              </li>
              <li>
                <Link to="/multilingual-voice-agent" className="text-sm text-slate-400 hover:text-white transition-colors">
                  Multilingual Voice AI
                </Link>
              </li>
              <li>
                <Link to="/wakilz-vs-human-isa" className="text-sm text-slate-400 hover:text-white transition-colors">
                  Wakilz vs Human ISA
                </Link>
              </li>
              <li>
                <Link to="/ai-voice-agent-luxury-real-estate" className="text-sm text-slate-400 hover:text-white transition-colors">
                  Luxury Real Estate AI
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-mono text-[11px] tracking-wider uppercase mb-4" style={{ color: 'var(--text-muted)' }}>
              Company
            </h4>
            <ul className="list-none p-0 space-y-2">
              {[
                { label: 'Features', href: '#platform' },
                { label: 'Pricing', href: '#pricing' },
                { label: 'Integrations', href: '#integrations' },
                { label: 'Contact', href: '#contact-sales' },
              ].map((link) => (
                <li key={link.label}>
                  <button
                    onClick={() => navigateOrScroll(link.href)}
                    className="text-sm transition-colors duration-200 hover:text-[var(--text-primary)] bg-transparent border-none cursor-pointer p-0 text-left"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-mono text-[11px] tracking-wider uppercase mb-4" style={{ color: 'var(--text-muted)' }}>
              Legal
            </h4>
            <ul className="list-none p-0 space-y-2">
              {['Privacy', 'Terms', 'Security'].map((label) => (
                <li key={label}>
                  <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-2"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <p className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
            &copy; 2026 Wakilz. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
