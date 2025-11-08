import React, { useState } from 'react'
import ProfileLayout from '../../components/layouts/ProfileLayout.jsx'

export default function PatientProfile() {
  const session = JSON.parse(localStorage.getItem('session')||'null')
  const user = session?.role === 'patient' ? session.user : { role: 'patient', name: 'Patient Placeholder' }
  const [active, setActive] = useState('overview')

  const sidebar = [
    { key: 'overview', label: 'Overview' },
    { key: 'history', label: 'Medical History' },
    { key: 'prescriptions', label: 'Prescriptions' },
    { key: 'settings', label: 'Settings' }
  ]

  return (
    <ProfileLayout title="Patient Profile" user={user} sidebarItems={sidebar} activeKey={active} onChange={setActive}>
      {active === 'overview' && (
        <section className="profile-section">
          <h2>Health Summary</h2>
          <div className="profile-grid">
            <div className="stat-card"><span className="label">Upcoming Appts</span><span className="value">3</span></div>
            <div className="stat-card"><span className="label">Prescriptions</span><span className="value">12</span></div>
            <div className="stat-card"><span className="label">Conditions</span><span className="value">2</span></div>
            <div className="stat-card"><span className="label">Doctors</span><span className="value">4</span></div>
          </div>
        </section>
      )}
      {active === 'history' && (
        <section className="profile-section">
          <h2>Medical History</h2>
          <p>Timeline placeholder – integrate records component later.</p>
        </section>
      )}
      {active === 'prescriptions' && (
        <section className="profile-section">
          <h2>Prescriptions</h2>
          <p>List and verification UI placeholder.</p>
        </section>
      )}
      {active === 'settings' && (
        <section className="profile-section">
          <h2>Settings</h2>
          <p>Account preferences form placeholder.</p>
        </section>
      )}
    </ProfileLayout>
  )
}
