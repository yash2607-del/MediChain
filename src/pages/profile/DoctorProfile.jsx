import React, { useState } from 'react'
import ProfileLayout from '../../components/layouts/ProfileLayout.jsx'

export default function DoctorProfile() {
  const session = JSON.parse(localStorage.getItem('session')||'null')
  const user = session?.role === 'doctor' ? session.user : { role: 'doctor', name: 'Dr. Placeholder' }
  const [active, setActive] = useState('overview')

  const sidebar = [
    { key: 'overview', label: 'Overview' },
    { key: 'patients', label: 'My Patients' },
    { key: 'analytics', label: 'Analytics' },
    { key: 'settings', label: 'Settings' }
  ]

  return (
    <ProfileLayout title="Doctor Profile" user={user} sidebarItems={sidebar} activeKey={active} onChange={setActive}>
      {active === 'overview' && (
        <section className="profile-section">
          <h2>At a glance</h2>
          <div className="profile-grid">
            <div className="stat-card"><span className="label">Patients</span><span className="value">42</span></div>
            <div className="stat-card"><span className="label">Appointments Today</span><span className="value">8</span></div>
            <div className="stat-card"><span className="label">Prescriptions</span><span className="value">310</span></div>
            <div className="stat-card"><span className="label">Inquiries</span><span className="value">5</span></div>
          </div>
        </section>
      )}
      {active === 'patients' && (
        <section className="profile-section">
          <h2>My Patients</h2>
          <p>List placeholder – integrate patient list component later.</p>
        </section>
      )}
      {active === 'analytics' && (
        <section className="profile-section">
          <h2>Analytics</h2>
          <p>Charts / metrics placeholder.</p>
        </section>
      )}
      {active === 'settings' && (
        <section className="profile-section">
          <h2>Settings</h2>
          <p>Profile settings form placeholder.</p>
        </section>
      )}
    </ProfileLayout>
  )
}
