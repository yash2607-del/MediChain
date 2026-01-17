import React, { useState } from 'react'
import { NavLink, Link, useNavigate } from 'react-router-dom'
import logo from '../assets/medichain-logo.png'
import { FaUserMd, FaUser, FaClinicMedical } from 'react-icons/fa'

export default function NavBar() {
  const navigate = useNavigate()
  const [showAuthModal, setShowAuthModal] = useState(false)

  const openAuthModal = () => setShowAuthModal(true)
  const closeAuthModal = () => setShowAuthModal(false)
  const handleRoleSelect = (role) => {
    navigate(`/auth/${role}`)
    setShowAuthModal(false)
  }

  return (
    <nav className="nav">
      <div className="container nav-inner" style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <Link to="/" className="brand" style={{textDecoration:'none', color:'var(--color-text-dark)', fontWeight:700, display:'flex',alignItems:'center',gap:'0.5rem'}}>
          <img src={logo} alt="MediChain logo" style={{height:36,width:'auto'}} />
          <span>MediChain</span>
        </Link>
        <div className="nav-links" style={{display:'flex',alignItems:'center',gap:'1rem'}}>
          <NavLink to="/doctors" style={({isActive})=>({color:isActive? 'var(--color-3)': 'var(--color-text-dark)', textDecoration:'none', fontWeight:600})}>Doctors</NavLink>
          <NavLink to="/patients" style={({isActive})=>({color:isActive? 'var(--color-3)': 'var(--color-text-dark)', textDecoration:'none', fontWeight:600})}>Patients</NavLink>
          <NavLink to="/pharmacies" style={({isActive})=>({color:isActive? 'var(--color-3)': 'var(--color-text-dark)', textDecoration:'none', fontWeight:600})}>Pharmacies</NavLink>
          <button className="btn secondary" style={{marginLeft:'1.5rem'}} onClick={openAuthModal}>Login</button>
          <button className="btn primary" onClick={openAuthModal}>Sign Up</button>
        </div>
      </div>

      {showAuthModal && (
        <div className="modal-overlay" onClick={closeAuthModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Choose Your Role</h3>
              <button className="modal-close" onClick={closeAuthModal}>×</button>
            </div>
            <div className="modal-body">
              <p>Select how you'd like to log in:</p>
              <div className="role-options">
                <button
                  className="role-option"
                  onClick={() => handleRoleSelect('doctor')}
                >
                  <span className="role-emoji">
                    <FaUserMd size={24} color="#00A9FF" />
                  </span>
                  <span>Doctor</span>
                </button>
                <button
                  className="role-option"
                  onClick={() => handleRoleSelect('patient')}
                >
                  <span className="role-emoji">
                    <FaUser size={24} color="#00A9FF" />
                  </span>
                  <span>Patient</span>
                </button>
                <button
                  className="role-option"
                  onClick={() => handleRoleSelect('pharmacy')}
                >
                  <span className="role-emoji">
                    <FaClinicMedical size={24} color="#00A9FF" />
                  </span>
                  <span>Pharmacy</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
