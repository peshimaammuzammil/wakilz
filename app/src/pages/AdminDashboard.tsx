import { useNavigate } from 'react-router'
import { useAuth } from '@/contexts/AuthContext'
import {
  LayoutDashboard, Users, Phone, Settings,
  LogOut, Bell, TrendingUp, Activity, Target, PhoneCall
} from 'lucide-react'

const NAV = [
  { icon: LayoutDashboard, label: 'Overview',  active: true  },
  { icon: Target,          label: 'Campaigns', active: false },
  { icon: Users,           label: 'Clients',   active: false },
  { icon: Phone,           label: 'All Calls', active: false },
  { icon: Activity,        label: 'Signals',   active: false },
  { icon: Settings,        label: 'Settings',  active: false },
]

const STATS = [
  { label: 'Total Campaigns', value: '—', Icon: Target,     color: '#5A6CFF' },
  { label: 'Total Calls',     value: '—', Icon: PhoneCall,  color: '#4FBE87' },
  { label: 'Active Clients',  value: '—', Icon: Users,      color: '#F5A623' },
  { label: 'Visits Booked',   value: '—', Icon: TrendingUp, color: '#E05AFF' },
]

export default function AdminDashboard() {
  const { profile, logOut } = useAuth()
  const navigate = useNavigate()

  const initials = (profile?.displayName || profile?.email || 'A')[0].toUpperCase()

  const handleLogout = async () => {
    await logOut()
    navigate('/', { replace: true })
  }

  return (
    /* Outer shell: full viewport, no scroll */
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#0C1524', fontFamily: "'Inter', sans-serif" }}>

      {/* ─── SIDEBAR (CSS Grid: header | nav | footer) ─── */}
      <aside style={{
        width: '260px',
        height: '100vh',
        flexShrink: 0,
        background: '#0f1b2d',
        borderRight: '1px solid rgba(255,255,255,0.07)',
        display: 'grid',
        gridTemplateRows: 'auto 1fr auto',
      }}>

        {/* Row 1 – Brand */}
        <div style={{ padding: '22px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <img
              src="/assets/images/logo.png" alt="wakilz"
              style={{ height: '22px', objectFit: 'contain', flexShrink: 0 }}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '18px', color: '#F3F0EA', letterSpacing: '-0.02em' }}>
              wakilz
            </span>
          </div>
          <span style={{
            display: 'inline-flex', alignItems: 'center',
            padding: '3px 10px', borderRadius: '5px',
            background: 'rgba(90,108,255,0.15)',
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '10px', fontWeight: 600, color: '#5A6CFF', letterSpacing: '0.1em',
          }}>
            ADMIN
          </span>
        </div>

        {/* Row 2 – Nav (scrollable) */}
        <nav style={{ padding: '12px 10px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {NAV.map(({ icon: Icon, label, active }) => (
            <button
              key={label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: 'none',
                background: active ? 'rgba(90,108,255,0.15)' : 'transparent',
                color: active ? '#7C8FFF' : '#9BA3AF',
                fontSize: '14px',
                fontWeight: active ? 600 : 400,
                cursor: 'pointer',
                textAlign: 'left',
                fontFamily: "'Inter', sans-serif",
                boxSizing: 'border-box',
              }}
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)' }}
              onMouseLeave={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
            >
              <Icon size={15} style={{ flexShrink: 0 }} />
              {label}
            </button>
          ))}
        </nav>

        {/* Row 3 – User */}
        <div style={{ padding: '14px 16px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', overflow: 'hidden' }}>
            <div style={{
              width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, #2A3FE0, #7C8FFF)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '14px', fontWeight: 700, color: '#fff',
            }}>
              {initials}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#F3F0EA', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {profile?.displayName || 'Admin'}
              </div>
              <div style={{ fontSize: '11px', color: '#4E6080', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {profile?.email}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              width: '100%', padding: '8px 12px', borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.10)',
              background: 'transparent', color: '#9BA3AF',
              fontSize: '13px', cursor: 'pointer',
              fontFamily: "'Inter', sans-serif",
              boxSizing: 'border-box',
            }}
          >
            <LogOut size={13} />
            Sign out
          </button>
        </div>
      </aside>

      {/* ─── MAIN (scrollable) ─── */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '36px 40px', boxSizing: 'border-box' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '26px', fontWeight: 700, color: '#F3F0EA', letterSpacing: '-0.02em', margin: '0 0 6px' }}>
              Admin Overview
            </h1>
            <p style={{ fontSize: '13.5px', color: '#9BA3AF', margin: 0 }}>
              All campaigns and clients across Wakilz
            </p>
          </div>
          <button style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '10px 20px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #2A3FE0, #5A6CFF)',
            border: 'none', color: '#fff', fontSize: '13px', fontWeight: 600,
            cursor: 'pointer', fontFamily: "'IBM Plex Mono', monospace",
            boxShadow: '0 4px 20px rgba(42,63,224,0.35)', whiteSpace: 'nowrap',
          }}>
            <Bell size={14} /> Notifications
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
          {STATS.map(({ label, value, Icon, color }) => (
            <div key={label} style={{
              background: '#0f1b2d',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '16px', padding: '22px 20px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <span style={{ fontSize: '12px', color: '#9BA3AF', fontFamily: "'IBM Plex Mono', monospace" }}>{label}</span>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${color}22` }}>
                  <Icon size={15} color={color} />
                </div>
              </div>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '28px', fontWeight: 700, color: '#F3F0EA' }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Coming soon */}
        <div style={{ background: 'rgba(90,108,255,0.05)', border: '1px dashed rgba(90,108,255,0.22)', borderRadius: '18px', padding: '56px', textAlign: 'center' }}>
          <div style={{ width: '54px', height: '54px', borderRadius: '16px', background: 'rgba(90,108,255,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
            <LayoutDashboard size={22} color="#5A6CFF" />
          </div>
          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '20px', fontWeight: 700, color: '#F3F0EA', margin: '0 0 10px' }}>
            Dashboard Coming Soon
          </h2>
          <p style={{ color: '#9BA3AF', fontSize: '14px', maxWidth: '380px', margin: '0 auto', lineHeight: 1.6 }}>
            Campaign management, client controls, and full call analytics are being built. You're authenticated as Admin ✓
          </p>
        </div>
      </main>
    </div>
  )
}
