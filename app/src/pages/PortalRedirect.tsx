import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '@/contexts/AuthContext'

/**
 * Portal redirect — after sign-in, sends users to the right dashboard
 * based on their Firestore role.
 */
export default function PortalRedirect() {
  const { profile, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (loading) return
    if (!profile) {
      navigate('/signin', { replace: true })
    } else if (profile.role === 'admin') {
      navigate('/admin', { replace: true })
    } else {
      navigate('/dashboard', { replace: true })
    }
  }, [profile, loading, navigate])

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--deep-navy)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
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
