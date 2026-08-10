import { useNavigate } from 'react-router'
import { useAuth } from '@/contexts/AuthContext'
import {
  LayoutDashboard, Users, Phone, Settings,
  LogOut, Bell, TrendingUp,
  Activity, Target, PhoneCall
} from 'lucide-react'

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Overview',   active: true  },
  { icon: Target,          label: 'Campaigns',  active: false },
  { icon: Users,           label: 'Clients',    active: false },
  { icon: Phone,           label: 'All Calls',  active: false },
  { icon: Activity,        label: 'Signals',    active: false },
  { icon: Settings,        label: 'Settings',   active: false },
]

const STATS = [
  { label: 'Total Campaigns', value: '—', icon: Target,     color: '#5A6CFF' },
  { label: 'Total Calls',     value: '—', icon: PhoneCall,  color: '#4FBE87' },
  { label: 'Active Clients',  value: '—', icon: Users,      color: '#F5A623' },
  { label: 'Visits Booked',   value: '—', icon: TrendingUp, color: '#E05AFF' },
]

export default function AdminDashboard() {
  const { profile, logOut } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logOut()
    navigate('/', { replace: true })
  }

  const initials = (profile?.displayName || profile?.email || 'A')[0].toUpperCase()

  return (
    <>
      <style>{`
        .dash-root { display: flex; min-height: 100vh; background: #0C1524; font-family: 'Inter', sans-serif; }

        /* ── Sidebar ── */
        .dash-sidebar {
          width: 256px; flex-shrink: 0;
          position: fixed; top: 0; left: 0; bottom: 0;
          background: #111d2e;
          border-right: 1px solid rgba(243,240,234,0.08);
          display: flex; flex-direction: column;
          z-index: 50;
        }

        .dash-brand {
          padding: 20px 20px 16px;
          border-bottom: 1px solid rgba(243,240,234,0.08);
        }
        .dash-brand-row {
          display: flex; align-items: center; gap: 8px;
          margin-bottom: 10px;
        }
        .dash-brand-logo { height: 20px; object-fit: contain; }
        .dash-brand-name {
          font-family: 'Space Grotesk', sans-serif;
          font-weight: 700; font-size: 17px;
          color: #F3F0EA; letter-spacing: -0.02em;
        }
        .dash-badge {
          display: inline-flex; align-items: center;
          padding: 3px 10px; border-radius: 5px;
          background: rgba(42,63,224,0.18);
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px; font-weight: 600;
          color: #5A6CFF; letter-spacing: 0.08em;
        }

        .dash-nav { flex: 1; padding: 12px 10px; display: flex; flex-direction: column; gap: 2px; }

        .dash-nav-btn {
          display: flex; align-items: center; gap: 10px;
          width: 100%; padding: 9px 12px; border-radius: 8px;
          border: none; background: transparent; cursor: pointer;
          font-family: 'Inter', sans-serif; font-size: 13.5px;
          color: #9BA3AF; text-align: left;
          transition: background 0.15s, color 0.15s;
          white-space: nowrap;
        }
        .dash-nav-btn.active {
          background: rgba(42,63,224,0.15);
          color: #5A6CFF; font-weight: 600;
        }
        .dash-nav-btn:not(.active):hover {
          background: rgba(255,255,255,0.04);
          color: #C9C4BE;
        }
        .dash-nav-icon { flex-shrink: 0; }

        .dash-user {
          padding: 14px 16px;
          border-top: 1px solid rgba(243,240,234,0.08);
        }
        .dash-user-row {
          display: flex; align-items: center; gap: 10px;
          margin-bottom: 10px;
          min-width: 0;
        }
        .dash-avatar {
          width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0;
          background: linear-gradient(135deg, #2A3FE0, #5A6CFF);
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; font-weight: 700; color: #fff;
        }
        .dash-user-info { min-width: 0; flex: 1; }
        .dash-user-name {
          font-size: 13px; font-weight: 600; color: #F3F0EA;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .dash-user-email {
          font-size: 11px; color: #5A6478; font-family: 'IBM Plex Mono', monospace;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .dash-signout-btn {
          display: flex; align-items: center; gap: 8px;
          width: 100%; padding: 8px 12px; border-radius: 7px;
          border: 1px solid rgba(243,240,234,0.10);
          background: transparent; color: #9BA3AF;
          font-size: 12.5px; cursor: pointer;
          transition: background 0.15s, color 0.15s;
          font-family: 'Inter', sans-serif;
        }
        .dash-signout-btn:hover { background: rgba(220,53,69,0.10); color: #ff6b7a; border-color: rgba(220,53,69,0.25); }

        /* ── Main ── */
        .dash-main { margin-left: 256px; flex: 1; padding: 32px 36px; }

        .dash-header {
          display: flex; align-items: flex-start; justify-content: space-between;
          margin-bottom: 28px;
        }
        .dash-title {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 24px; font-weight: 700; color: #F3F0EA;
          letter-spacing: -0.02em; margin: 0 0 4px;
        }
        .dash-subtitle { font-size: 13.5px; color: #9BA3AF; margin: 0; }

        .dash-notif-btn {
          display: flex; align-items: center; gap: 8px;
          padding: 9px 18px; border-radius: 9px;
          background: linear-gradient(135deg, #2A3FE0, #5A6CFF);
          border: none; color: #fff; font-size: 13px; font-weight: 600;
          cursor: pointer; font-family: 'IBM Plex Mono', monospace;
          box-shadow: 0 4px 16px rgba(42,63,224,0.3);
          white-space: nowrap;
        }

        .dash-stats { display: grid; grid-template-columns: repeat(4,1fr); gap: 14px; margin-bottom: 24px; }
        .dash-stat-card {
          background: #111d2e; border: 1px solid rgba(243,240,234,0.08);
          border-radius: 14px; padding: 22px 20px;
        }
        .dash-stat-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
        .dash-stat-label { font-size: 12px; color: #9BA3AF; font-family: 'IBM Plex Mono', monospace; }
        .dash-stat-icon {
          width: 34px; height: 34px; border-radius: 9px;
          display: flex; align-items: center; justify-content: center;
        }
        .dash-stat-value {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 26px; font-weight: 700; color: #F3F0EA;
        }

        .dash-coming-soon {
          background: rgba(42,63,224,0.06);
          border: 1px dashed rgba(90,108,255,0.25);
          border-radius: 16px; padding: 48px; text-align: center;
        }
        .dash-cs-icon {
          width: 52px; height: 52px; border-radius: 14px;
          background: rgba(42,63,224,0.14);
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 16px;
        }
        .dash-cs-title {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 18px; font-weight: 700; color: #F3F0EA; margin: 0 0 8px;
        }
        .dash-cs-text { color: #9BA3AF; font-size: 14px; max-width: 380px; margin: 0 auto; }
      `}</style>

      <div className="dash-root">
        {/* ── Sidebar ── */}
        <aside className="dash-sidebar">
          {/* Brand */}
          <div className="dash-brand">
            <div className="dash-brand-row">
              <img
                src="/assets/images/logo.png"
                alt="wakilz"
                className="dash-brand-logo"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
              <span className="dash-brand-name">wakilz</span>
            </div>
            <span className="dash-badge">ADMIN</span>
          </div>

          {/* Nav */}
          <nav className="dash-nav">
            {NAV_ITEMS.map(item => (
              <button key={item.label} className={`dash-nav-btn${item.active ? ' active' : ''}`}>
                <item.icon size={15} className="dash-nav-icon" />
                {item.label}
              </button>
            ))}
          </nav>

          {/* User */}
          <div className="dash-user">
            <div className="dash-user-row">
              <div className="dash-avatar">{initials}</div>
              <div className="dash-user-info">
                <div className="dash-user-name">{profile?.displayName || 'Admin'}</div>
                <div className="dash-user-email">{profile?.email}</div>
              </div>
            </div>
            <button className="dash-signout-btn" onClick={handleLogout}>
              <LogOut size={13} /> Sign out
            </button>
          </div>
        </aside>

        {/* ── Main ── */}
        <main className="dash-main">
          <div className="dash-header">
            <div>
              <h1 className="dash-title">Admin Overview</h1>
              <p className="dash-subtitle">All campaigns and clients across Wakilz</p>
            </div>
            <button className="dash-notif-btn">
              <Bell size={14} /> Notifications
            </button>
          </div>

          {/* Stats */}
          <div className="dash-stats">
            {STATS.map(s => (
              <div key={s.label} className="dash-stat-card">
                <div className="dash-stat-row">
                  <span className="dash-stat-label">{s.label}</span>
                  <div className="dash-stat-icon" style={{ background: `${s.color}1A` }}>
                    <s.icon size={15} color={s.color} />
                  </div>
                </div>
                <div className="dash-stat-value">{s.value}</div>
              </div>
            ))}
          </div>

          {/* Coming soon */}
          <div className="dash-coming-soon">
            <div className="dash-cs-icon">
              <LayoutDashboard size={22} color="#5A6CFF" />
            </div>
            <h2 className="dash-cs-title">Dashboard Coming Soon</h2>
            <p className="dash-cs-text">
              Campaign management, client controls, and full call analytics are being built.
              You're authenticated as Admin ✓
            </p>
          </div>
        </main>
      </div>
    </>
  )
}
