import React, { useEffect, useState } from 'react'
import '../../styles/profile.scss'

export default function ProfileLayout({
  title = 'Profile',
  user,
  sidebarItems = [],
  activeKey,
  onChange,
  children
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  useEffect(() => {
    document.body.classList.add('dashboard-mode')
    return () => document.body.classList.remove('dashboard-mode')
  }, [])

  return (
    <div className="profile-layout">
      <header className="profile-topbar">
        <div className="brand">MedTrack</div>
        <div className="top-actions">
          <h1 className="page-title">{title}</h1>
          <div className="userbox" onClick={() => setMenuOpen(o=>!o)}>
            <div className="avatar" />
            <div className="meta">
              <div className="name">{user?.name || user?.shopName || 'User'}</div>
              <div className="role">{user?.role || '—'}</div>
            </div>
            {menuOpen && (
              <div className="dropdown" onClick={e=>e.stopPropagation()}>
                <button>Account</button>
                <button>Security</button>
                <button onClick={()=>{ localStorage.removeItem('session'); window.location.href='/' }}>Logout</button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="profile-body">
        <aside className="profile-sidebar">
          <ul>
            {sidebarItems.map(it => (
              <li key={it.key}>
                <button className={activeKey===it.key?'active':''} onClick={()=>onChange?.(it.key)}>
                  {it.icon && <span className="icon">{it.icon}</span>}
                  <span>{it.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </aside>
        <main className="profile-content">
          {children}
        </main>
      </div>
    </div>
  )
}
