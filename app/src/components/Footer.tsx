export default function Footer() {
  const scrollTo = (href: string) => {
    const el = document.querySelector(href)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <footer style={{ background: 'var(--deep-navy)', borderTop: '1px solid var(--border)' }}>
      <div className="max-w-[1160px] mx-auto px-6 pt-16 pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="lg:col-span-1">
            <a href="#" className="flex items-center gap-2.5 no-underline mb-4">
              <div
                className="w-6 h-6 rounded-[4px]"
                style={{ background: 'linear-gradient(135deg, #2A3FE0, #5A6CFF)' }}
              />
              <span className="font-display font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                wakilz
              </span>
            </a>
            <p className="text-sm leading-relaxed max-w-[240px]" style={{ color: 'var(--text-muted)' }}>
              AI voice and chat platform for real estate teams.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-mono text-[11px] tracking-wider uppercase mb-4" style={{ color: 'var(--text-muted)' }}>
              Product
            </h4>
            <ul className="list-none p-0 space-y-2">
              {[
                { label: 'Features', href: '#platform' },
                { label: 'Pricing', href: '#pricing' },
                { label: 'Integrations', href: '#integrations' },
              ].map((link) => (
                <li key={link.label}>
                  <button
                    onClick={() => scrollTo(link.href)}
                    className="text-sm transition-colors duration-200 hover:text-[var(--text-primary)] bg-transparent border-none cursor-pointer p-0"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-mono text-[11px] tracking-wider uppercase mb-4" style={{ color: 'var(--text-muted)' }}>
              Company
            </h4>
            <ul className="list-none p-0 space-y-2">
              {['About', 'Blog', 'Careers', 'Contact'].map((label) => (
                <li key={label}>
                  <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{label}</span>
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
