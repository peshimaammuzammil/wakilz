import { useNavigate } from 'react-router'
import { useAuth } from '@/contexts/AuthContext'
import {
  LayoutDashboard, Phone, LogOut,
  TrendingUp, ChevronRight, PhoneCall, Target, Calendar
} from 'lucide-react'

export default function ClientDashboard() {
  const { profile, logOut } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logOut()
    navigate('/', { replace: true })
  }

  const stats = [
    { label: 'Calls Made', value: '—', icon: PhoneCall, color: '#5A6CFF' },
    { label: 'Calls Connected', value: '—', icon: Phone, color: '#4FBE87' },
    { label: 'Visits Booked', value: '—', icon: Calendar, color: '#F5A623' },
    { label: 'Visit Rate', value: '—', icon: TrendingUp, color: '#E05AFF' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--deep-navy)', fontFamily: 'var(--font-body)' }}>

      {/* Sidebar */}
      <aside style={{
        position: 'fixed', top: 0, left: 0, bottom: 0, width: '240px',
        background: 'rgba(22, 32, 50, 0.95)',
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        zIndex: 100, backdropFilter: 'blur(20px)',
      }}>
        <div style={{ padding: '24px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src="/assets/images/logo.png" alt="wakilz" style={{ height: '22px', objectFit: 'contain' }}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '18px', color: 'var(--text-primary)' }}>
              wakilz
            </span>
          </div>
          <div style={{
            marginTop: '8px', padding: '4px 10px',
            background: 'rgba(79,190,135,0.12)', borderRadius: '6px',
            display: 'inline-block',
          }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#4FBE87', fontWeight: 600 }}>
              CLIENT PORTAL
            </span>
          </div>
        </div>

        <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {[
            { icon: LayoutDashboard, label: 'Overview', active: true },
            { icon: Target, label: 'Campaigns', active: false },
            { icon: Phone, label: 'Calls', active: false },
            { icon: Calendar, label: 'Site Visits', active: false },
            { icon: TrendingUp, label: 'ROI', active: false },
          ].map(item => (
            <button key={item.label} style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '10px 12px', borderRadius: '8px', border: 'none',
              background: item.active ? 'rgba(79,190,135,0.10)' : 'transparent',
              color: item.active ? '#4FBE87' : 'var(--text-secondary)',
              fontSize: '14px', fontWeight: item.active ? 600 : 400,
              cursor: 'pointer', width: '100%', textAlign: 'left',
              transition: 'background 0.15s, color 0.15s',
              fontFamily: 'var(--font-body)',
            }}
              onMouseEnter={e => { if (!item.active) (e.currentTarget).style.background = 'rgba(255,255,255,0.04)' }}
              onMouseLeave={e => { if (!item.active) (e.currentTarget).style.background = 'transparent' }}
            >
              <item.icon size={16} />
              {item.label}
              {item.active && <ChevronRight size={14} style={{ marginLeft: 'auto' }} />}
            </button>
          ))}
        </nav>

        <div style={{ padding: '16px', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{
              width: '34px', height: '34px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #1F7A4D, #4FBE87)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '13px', fontWeight: 700, color: '#fff', flexShrink: 0,
            }}>
              {profile?.email?.[0]?.toUpperCase() || 'C'}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {profile?.displayName || 'Client'}
              </p>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'var(--font-mono)' }}>
                {profile?.email}
              </p>
            </div>
          </div>
          <button onClick={handleLogout} style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            width: '100%', padding: '8px 12px', borderRadius: '8px',
            border: '1px solid var(--border)', background: 'transparent',
            color: 'var(--text-secondary)', fontSize: '13px', cursor: 'pointer',
            transition: 'background 0.15s, color 0.15s', fontFamily: 'var(--font-body)',
          }}
            onMouseEnter={e => { (e.currentTarget).style.background = 'rgba(220,53,69,0.1)'; (e.currentTarget).style.color = '#ff6b7a' }}
            onMouseLeave={e => { (e.currentTarget).style.background = 'transparent'; (e.currentTarget).style.color = 'var(--text-secondary)' }}
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ marginLeft: '240px', padding: '32px', minHeight: '100vh' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 700, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
              Campaign Overview
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
              Your AI calling campaigns at a glance
            </p>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
          {stats.map(stat => (
            <div key={stat.label} style={{
              background: 'rgba(22, 32, 50, 0.8)',
              border: '1px solid var(--border)',
              borderRadius: '16px', padding: '24px',
              backdropFilter: 'blur(10px)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                  {stat.label}
                </span>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '10px',
                  background: `${stat.color}18`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <stat.icon size={16} color={stat.color} />
                </div>
              </div>
              <p style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', margin: 0, fontFamily: 'var(--font-display)' }}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Coming soon */}
        <div style={{
          background: 'rgba(79,190,135,0.05)',
          border: '1px dashed rgba(79,190,135,0.25)',
          borderRadius: '16px', padding: '48px', textAlign: 'center',
        }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '16px',
            background: 'rgba(79,190,135,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <TrendingUp size={24} color="#4FBE87" />
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px' }}>
            Your Dashboard is Being Set Up
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '400px', margin: '0 auto' }}>
            Call funnel, visit board, ROI calculator and sentiment timeline are coming soon. You're successfully authenticated ✓
          </p>
        </div>
      </main>
    </div>
  )
}
