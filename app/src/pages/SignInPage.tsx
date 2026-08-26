import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router'
import { useAuth } from '@/contexts/AuthContext'
import { Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react'

export default function SignInPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn, profile } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signIn(email, password)
      if (from) {
        navigate(from, { replace: true })
      } else if (email.toLowerCase().includes('admin')) {
        navigate('/admin-dashboard', { replace: true })
      } else {
        navigate('/dashboard', { replace: true })
      }
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code
      if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setError('Invalid email or password. Please try again.')
      } else if (code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please try again later.')
      } else {
        setError('Sign in failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--deep-navy)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: 'var(--font-body)',
    }}>
      {/* Background glow blobs */}
      <div style={{
        position: 'absolute', top: '-20%', left: '-10%',
        width: '600px', height: '600px',
        background: 'radial-gradient(circle, rgba(42,63,224,0.15) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-20%', right: '-10%',
        width: '500px', height: '500px',
        background: 'radial-gradient(circle, rgba(90,108,255,0.10) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none',
      }} />

      <div style={{
        width: '100%',
        maxWidth: '420px',
        position: 'relative',
        zIndex: 10,
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <a href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <img
              src="/assets/images/logo.png"
              alt="wakilz"
              style={{ height: '28px', width: 'auto', objectFit: 'contain' }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
            <span style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: '22px',
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
            }}>wakilz</span>
          </a>
          <p style={{
            color: 'var(--text-secondary)',
            fontSize: '14px',
            marginTop: '8px',
            fontFamily: 'var(--font-mono)',
          }}>Client Portal</p>
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(22, 32, 50, 0.80)',
          border: '1px solid var(--border-strong)',
          borderRadius: '20px',
          padding: '40px',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
        }}>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '24px',
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: '6px',
            letterSpacing: '-0.02em',
          }}>Sign in</h1>
          <p style={{
            color: 'var(--text-secondary)',
            fontSize: '14px',
            marginBottom: '32px',
          }}>Access your campaign dashboard</p>

          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: 'rgba(220, 53, 69, 0.12)',
              border: '1px solid rgba(220, 53, 69, 0.3)',
              borderRadius: '10px',
              padding: '12px 16px',
              marginBottom: '24px',
            }}>
              <AlertCircle size={16} color="#dc3545" style={{ flexShrink: 0 }} />
              <p style={{ color: '#ff6b7a', fontSize: '13px', margin: 0 }}>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Email */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 500,
                color: 'var(--text-secondary)',
                marginBottom: '8px',
                fontFamily: 'var(--font-mono)',
              }}>Email address</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com"
                style={{
                  width: '100%',
                  background: 'rgba(12, 21, 36, 0.6)',
                  border: '1px solid var(--border-strong)',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  fontFamily: 'var(--font-body)',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--accent-glow)'}
                onBlur={e => e.target.style.borderColor = 'var(--border-strong)'}
              />
            </div>

            {/* Password */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 500,
                color: 'var(--text-secondary)',
                marginBottom: '8px',
                fontFamily: 'var(--font-mono)',
              }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{
                    width: '100%',
                    background: 'rgba(12, 21, 36, 0.6)',
                    border: '1px solid var(--border-strong)',
                    borderRadius: '10px',
                    padding: '12px 48px 12px 16px',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    fontFamily: 'var(--font-body)',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    boxSizing: 'border-box',
                  }}
                  onFocus={e => e.target.style.borderColor = 'var(--accent-glow)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border-strong)'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: '14px', top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--text-muted)', padding: '4px',
                    display: 'flex', alignItems: 'center',
                  }}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              id="signin-submit"
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                background: loading
                  ? 'rgba(42,63,224,0.5)'
                  : 'linear-gradient(135deg, #2A3FE0 0%, #5A6CFF 100%)',
                border: 'none',
                borderRadius: '10px',
                padding: '13px',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 600,
                fontFamily: 'var(--font-mono)',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'opacity 0.2s, transform 0.15s',
                boxShadow: loading ? 'none' : '0 4px 24px rgba(42,63,224,0.35)',
                marginTop: '4px',
              }}
              onMouseEnter={e => { if (!loading) (e.target as HTMLButtonElement).style.opacity = '0.9' }}
              onMouseLeave={e => { (e.target as HTMLButtonElement).style.opacity = '1' }}
            >
              {loading ? (
                <>
                  <span className="btn-spinner" /> Signing in...
                </>
              ) : (
                <>
                  <LogIn size={16} /> Sign in
                </>
              )}
            </button>
          </form>
        </div>

        <p style={{
          textAlign: 'center',
          marginTop: '24px',
          fontSize: '13px',
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-mono)',
        }}>
          Don't have an account?{' '}
          <a href="mailto:hello@wakilz.com" style={{ color: 'var(--accent-glow)', textDecoration: 'none' }}>
            Contact Wakilz
          </a>
        </p>
      </div>

      <style>{`
        .spinner {
          width: 32px; height: 32px;
          border: 3px solid rgba(90,108,255,0.2);
          border-top-color: var(--accent-glow);
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          margin: 0 auto;
        }
        .btn-spinner {
          display: inline-block;
          width: 14px; height: 14px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder { color: var(--text-muted); }
      `}</style>
    </div>
  )
}
