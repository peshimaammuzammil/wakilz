import { Navigate, useLocation } from 'react-router'
import { useAuth } from '@/contexts/AuthContext'
import type { UserRole } from '@/contexts/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: UserRole
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'var(--deep-navy)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" />
          <p style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '13px', marginTop: '16px' }}>
            Authenticating...
          </p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/signin" state={{ from: location }} replace />
  }

  // If user is authenticated, determine effective role (defaults to 'client' if profile doc isn't created yet)
  const userRole = profile?.role || 'client'

  if (requiredRole && userRole !== requiredRole && userRole !== 'admin') {
    // Redirect to appropriate dashboard based on role (admins can view all)
    return <Navigate to={userRole === 'admin' ? '/admin-dashboard' : '/dashboard'} replace />
  }

  return <>{children}</>
}
