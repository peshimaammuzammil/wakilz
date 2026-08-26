import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '@/contexts/AuthContext'

export default function PortalRedirect() {
  const { user, profile, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (loading) return
    if (!user) {
      navigate('/signin', { replace: true })
      return
    }
    const role = profile?.role || (user.email?.toLowerCase().includes('admin') ? 'admin' : 'client')
    if (role === 'admin') {
      navigate('/admin-dashboard', { replace: true })
    } else {
      navigate('/dashboard', { replace: true })
    }
  }, [user, profile, loading, navigate])

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--deep-navy)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div className="spinner" />
    </div>
  )
}
