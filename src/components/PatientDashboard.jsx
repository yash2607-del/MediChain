import React, { useState } from 'react'
import DashboardLayout from './DashboardLayout.jsx'
import '../styles/patient-dashboard.scss'
import FindADoctor from '../pages/Patient/FindADoctor.jsx'
import AppointmentForm from '../pages/Patient/Appointment-form.jsx'
import PrescriptionTable from '../pages/Patient/Prescription-table.jsx'
import PatientAppointments from '../pages/Patient/PatientAppointments.jsx'

export default function PatientDashboard() {
  const [active, setActive] = useState('find-doctor')

  const menuItems = [
    { key: 'find-doctor', label: 'Find Doctor' },
    { key: 'book', label: 'Book Appointment' },
    { key: 'appointments', label: 'My Appointments' },
    { key: 'prescriptions', label: 'My Prescriptions' }
  ]

  return (
    <div className="patient-dashboard">
      <DashboardLayout
        brand="MedTrack"
        menuItems={menuItems}
        active={active}
        setActive={setActive}
      >
        {active === 'find-doctor' && <FindADoctor />}
        {active === 'book' && <AppointmentForm />}
        {active === 'appointments' && <PatientAppointments />}
        {active === 'prescriptions' && <PrescriptionTable />}
      </DashboardLayout>
    </div>
  )
}
