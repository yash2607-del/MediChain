import React from 'react'
import { NavLink, Link } from 'react-router-dom'

export default function NavBar() {
  return (
    <nav className="nav">
      <div className="container nav-inner" style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <Link to="/" className="brand" style={{textDecoration:'none', color:'var(--color-text-dark)', fontWeight:700}}>Connected Care</Link>
        <div className="nav-links" style={{display:'flex',gap:'1rem'}}>
          <NavLink to="/doctors" style={({isActive})=>({color:isActive? 'var(--color-3)': 'var(--color-text-dark)', textDecoration:'none', fontWeight:600})}>Doctors</NavLink>
          <NavLink to="/patients" style={({isActive})=>({color:isActive? 'var(--color-3)': 'var(--color-text-dark)', textDecoration:'none', fontWeight:600})}>Patients</NavLink>
          <NavLink to="/pharmacies" style={({isActive})=>({color:isActive? 'var(--color-3)': 'var(--color-text-dark)', textDecoration:'none', fontWeight:600})}>Pharmacies</NavLink>
        </div>
      </div>
    </nav>
  )
}
