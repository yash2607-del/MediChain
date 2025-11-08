import React, { useState } from 'react'
import ProfileLayout from '../../components/layouts/ProfileLayout.jsx'

export default function PharmacyProfile() {
  const session = JSON.parse(localStorage.getItem('session')||'null')
  const user = session?.role === 'pharmacy' ? session.user : { role: 'pharmacy', shopName: 'Pharmacy Placeholder' }
  const [active, setActive] = useState('overview')

  const sidebar = [
    { key: 'overview', label: 'Overview' },
    { key: 'inventory', label: 'Inventory' },
    { key: 'orders', label: 'Orders' },
    { key: 'settings', label: 'Settings' }
  ]

  return (
    <ProfileLayout title="Pharmacy Profile" user={user} sidebarItems={sidebar} activeKey={active} onChange={setActive}>
      {active === 'overview' && (
        <section className="profile-section">
          <h2>Store Summary</h2>
          <div className="profile-grid">
            <div className="stat-card"><span className="label">Stock Items</span><span className="value">860</span></div>
            <div className="stat-card"><span className="label">Pending Orders</span><span className="value">6</span></div>
            <div className="stat-card"><span className="label">Fulfilled</span><span className="value">124</span></div>
            <div className="stat-card"><span className="label">Alerts</span><span className="value">2</span></div>
          </div>
        </section>
      )}
      {active === 'inventory' && (
        <section className="profile-section">
          <h2>Inventory</h2>
          <p>Inventory table placeholder.</p>
        </section>
      )}
      {active === 'orders' && (
        <section className="profile-section">
          <h2>Orders</h2>
          <p>Orders list placeholder.</p>
        </section>
      )}
      {active === 'settings' && (
        <section className="profile-section">
          <h2>Settings</h2>
          <p>Store settings form placeholder.</p>
        </section>
      )}
    </ProfileLayout>
  )
}
