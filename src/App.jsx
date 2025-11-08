import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Doctors from './pages/Doctors.jsx'
import Patients from './pages/Patients.jsx'
import Pharmacies from './pages/Pharmacies.jsx'
import NotFound from './pages/NotFound.jsx'
import Landing from './components/Landing.jsx'
import DoctorDashboard from './components/DoctorDashboard.jsx'
import RoleAuth from './components/RoleAuth.jsx'
<<<<<<< HEAD
import ProfileRouter from './pages/profile/ProfileRouter.jsx'
import DoctorProfile from './pages/profile/DoctorProfile.jsx'
import PatientProfile from './pages/profile/PatientProfile.jsx'
import PharmacyProfile from './pages/profile/PharmacyProfile.jsx'
=======
import FindADoctor from './pages/Patient/FindADoxtor.jsx'
>>>>>>> a7d63f0a728824a06162e321c8e29e732e3f9221

export default function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <main>
          <Routes>
            {/* Home and public pages */}
            <Route path="/" element={<Landing />} />
            <Route path="/doctor" element={<DoctorDashboard />} />
            <Route path="/doctors" element={<Doctors />} />
            <Route path="/patients" element={<Patients />} />
            <Route path="/pharmacies" element={<Pharmacies />} />
            <Route path="/auth/:role" element={<RoleAuth />} />
            {/* Profile routing */}
            <Route path="/profile" element={<ProfileRouter />} />
            <Route path="/profile/doctor" element={<DoctorProfile />} />
            <Route path="/profile/patient" element={<PatientProfile />} />
            <Route path="/profile/pharmacy" element={<PharmacyProfile />} />
            <Route path="/appointment" element={<FindADoctor />} />

            {/* Legacy or shorthand route: redirect to /doctors */}
            <Route path="/doctor" element={<Navigate to="/doctors" replace />} />

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
