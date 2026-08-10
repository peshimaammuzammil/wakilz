import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '@/contexts/AuthContext'

export default function PortalRedirect() {
  const { user, profile, loading } = useAuth()
  const navigate = useNavigate()
  const [noProfile, setNoProfile] = useState(false)

  useEffect(() => {
    if (loading) return
    if (!user) {
      navigate('/signin', { replace: true })
      return
    }
    if (!profile) {
      // Authenticated but no Firestore doc — admin hasn't set up this account yet
      setNoProfile(true)
      return
    }
    if (profile.role === 'admin') {
      navigate('/admin', { replace: true })
    } else {
      navigate('/dashboard', { replace: true })
    }
  }, [user, profile, loading, navigate])

  if (noProfile) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'var(--deep-navy)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-body)',
        padding: '24px',
      }}>
        <div style={{
          maxWidth: '420px',
          background: 'rgba(22,32,50,0.85)',
          border: '1px solid var(--border-strong)',
          borderRadius: '20px',
          padding: '40px',
          textAlign: 'center',
          backdropFilter: 'blur(20px)',
        }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '16px',
            background: 'rgba(245,166,35,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px', fontSize: '24px',
          }}>⚠️</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 10px' }}>
            Account Not Configured
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: '0 0 8px' }}>
            You're signed in as <strong style={{ color: 'var(--text-primary)' }}>{user?.email}</strong>
          </p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: '0 0 28px' }}>
            Your account exists but doesn't have a profile yet. The admin needs to add your user record in Firestore.
          </p>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)', background: 'rgba(0,0,0,0.2)', padding: '10px 14px', borderRadius: '8px', margin: '0 0 24px', wordBreak: 'break-all' }}>
            UID: {user?.uid}
          </p>
          <button
            onClick={() => { import('@/lib/firebase').then(({ auth }) => auth.signOut()); navigate('/signin') }}
            style={{
              background: 'none', border: '1px solid var(--border-strong)',
              color: 'var(--text-secondary)', borderRadius: '8px',
              padding: '10px 20px', cursor: 'pointer', fontSize: '13px',
              fontFamily: 'var(--font-mono)',
            }}
          >
            Sign out
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--deep-navy)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: '32px', height: '32px',
          border: '3px solid rgba(90,108,255,0.2)',
          borderTopColor: 'var(--accent-glow)',
          borderRadius: '50%',
          animation: 'spin 0.7s linear infinite',
          margin: '0 auto',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '13px', marginTop: '16px' }}>
          Loading your dashboard...
        </p>
      </div>
    </div>
  )
}

