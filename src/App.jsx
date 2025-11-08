import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import NavBar from './components/NavBar.jsx'
import Landing from './components/Landing.jsx'
import Doctors from './pages/Doctors.jsx'
import Patients from './pages/Patients.jsx'
import Pharmacies from './pages/Pharmacies.jsx'
import NotFound from './pages/NotFound.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <header className="app-header">
          <h1 style={{display:'none'}}>HackCbs Project — React + SCSS skeleton</h1>
        </header>

        <NavBar />

        <main>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/doctors" element={<Doctors />} />
            <Route path="/patients" element={<Patients />} />
            <Route path="/pharmacies" element={<Pharmacies />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
