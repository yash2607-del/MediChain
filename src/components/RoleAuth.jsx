import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useParams } from 'react-router-dom'
import TagsInput from './TagsInput.jsx'
import MapPicker from './MapPicker.jsx'

// Simple in-memory store fallback (could be replaced by API later)
const memoryDB = {
  doctor: [],
  patient: [],
  pharmacy: []
}

const ROLE_LABELS = {
  doctor: 'Doctor',
  patient: 'Patient',
  pharmacy: 'Pharmacy'
}

export default function RoleAuth() {
  const { role } = useParams()
  const validRole = ['doctor', 'patient', 'pharmacy'].includes(role) ? role : null
  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [message, setMessage] = useState('')

  // Shared login fields
  const [loginData, setLoginData] = useState({ email: '', password: '' })

  // Signup data per role
  const [patientData, setPatientData] = useState({
    email: '', password: '', phone: '', name: '', age: '', weight: '', height: '', conditions: [], sex: ''
  })
  const [doctorData, setDoctorData] = useState({
    name: '', regNumber: '', email: '', password: '', phone: '', education: '', specialties: [], experienceYears: '', location: null
  })
  const [pharmacyData, setPharmacyData] = useState({
    shopName: '', email: '', password: '', phone: '', location: null
  })

  if (!validRole) {
    return <div className="auth-page"><h2>Invalid role</h2><p>Unknown role: {role}</p></div>
  }

  const label = ROLE_LABELS[validRole]
  const navigate = useNavigate()
  const [animating, setAnimating] = useState(false)

  // Role information content for the left/right panel
  const roleInfo = useMemo(() => {
    switch (validRole) {
      case 'patient':
        return {
          title: 'Welcome, Patient',
          subtitle: 'Your health, your control',
          points: [
            'Access verified prescriptions securely',
            'Find medicines nearby on the map',
            'Get AI-assisted guidance to the right doctor'
          ]
        }
      case 'doctor':
        return {
          title: 'Welcome, Doctor',
          subtitle: 'Streamlined and secure care',
          points: [
            'Create tamper-proof prescriptions on-chain',
            'View patient history with confidence',
            'Build trust with verifiable records'
          ]
        }
      case 'pharmacy':
        return {
          title: 'Welcome, Pharmacy',
          subtitle: 'Reliable inventory and verification',
          points: [
            'Verify prescriptions via blockchain',
            'Manage real-time stock with ease',
            'Serve patients faster with confidence'
          ]
        }
      default:
        return { title: '', subtitle: '', points: [] }
    }
  }, [validRole])

  const handleLoginSubmit = (e) => {
    e.preventDefault()
    const users = memoryDB[validRole]
    const found = users.find(u => u.email === loginData.email && u.password === loginData.password)
    if (found) {
      setMessage(`Welcome back, ${found.name || found.shopName || 'user'}! (Pretend session started)`) 
    } else {
      setMessage('Invalid credentials or user not registered.')
    }
  }

  const saveUser = (data) => {
    memoryDB[validRole].push(data)
  }

  const handleSignupSubmit = (e) => {
    e.preventDefault()
    let data
    if (validRole === 'patient') data = patientData
    if (validRole === 'doctor') data = doctorData
    if (validRole === 'pharmacy') data = pharmacyData
    // Simple validation example
    if (!data.email || !data.password) {
      setMessage('Email & password are required.')
      return
    }
    saveUser(data)
    setMessage(`${label} registered successfully! You can now log in.`)
    setMode('login')
  }

  const renderSignup = () => {
    switch (validRole) {
      case 'patient':
        return (
          <form onSubmit={handleSignupSubmit} className="auth-form">
            <div className="two-col">
              <div className="form-field"><label>Name</label><input value={patientData.name} onChange={e=>setPatientData({...patientData,name:e.target.value})} /></div>
              <div className="form-field"><label>Email</label><input type="email" value={patientData.email} onChange={e=>setPatientData({...patientData,email:e.target.value})} required /></div>
              <div className="form-field"><label>Password</label><input type="password" value={patientData.password} onChange={e=>setPatientData({...patientData,password:e.target.value})} required /></div>
              <div className="form-field"><label>Phone</label><input value={patientData.phone} onChange={e=>setPatientData({...patientData,phone:e.target.value})} /></div>
              <div className="form-field"><label>Age</label><input type="number" value={patientData.age} onChange={e=>setPatientData({...patientData,age:e.target.value})} /></div>
              <div className="form-field"><label>Weight (kg)</label><input type="number" value={patientData.weight} onChange={e=>setPatientData({...patientData,weight:e.target.value})} /></div>
              <div className="form-field"><label>Height (cm)</label><input type="number" value={patientData.height} onChange={e=>setPatientData({...patientData,height:e.target.value})} /></div>
              <div className="form-field"><label>Sex</label>
                <select value={patientData.sex} onChange={e=>setPatientData({...patientData,sex:e.target.value})}>
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <TagsInput label="Pre-existing Conditions" value={patientData.conditions} onChange={(v)=>setPatientData({...patientData,conditions:v})} />
            <button className="btn primary" type="submit">Sign Up as Patient</button>
          </form>
        )
      case 'doctor':
        return (
          <form onSubmit={handleSignupSubmit} className="auth-form">
            <div className="two-col">
              <div className="form-field"><label>Name</label><input value={doctorData.name} onChange={e=>setDoctorData({...doctorData,name:e.target.value})} /></div>
              <div className="form-field"><label>Reg Number</label><input value={doctorData.regNumber} onChange={e=>setDoctorData({...doctorData,regNumber:e.target.value})} /></div>
              <div className="form-field"><label>Email</label><input type="email" value={doctorData.email} onChange={e=>setDoctorData({...doctorData,email:e.target.value})} required /></div>
              <div className="form-field"><label>Password</label><input type="password" value={doctorData.password} onChange={e=>setDoctorData({...doctorData,password:e.target.value})} required /></div>
              <div className="form-field"><label>Phone</label><input value={doctorData.phone} onChange={e=>setDoctorData({...doctorData,phone:e.target.value})} /></div>
              <div className="form-field"><label>Education</label><input value={doctorData.education} onChange={e=>setDoctorData({...doctorData,education:e.target.value})} /></div>
              <div className="form-field"><label>Years of Experience</label><input type="number" value={doctorData.experienceYears} onChange={e=>setDoctorData({...doctorData,experienceYears:e.target.value})} /></div>
            </div>
            <TagsInput label="Specialties" value={doctorData.specialties} onChange={(v)=>setDoctorData({...doctorData,specialties:v})} />
            <MapPicker label="Location" value={doctorData.location} onChange={(v)=>setDoctorData({...doctorData,location:v})} height={220} />
            <button className="btn primary" type="submit">Sign Up as Doctor</button>
          </form>
        )
      case 'pharmacy':
        return (
          <form onSubmit={handleSignupSubmit} className="auth-form">
            <div className="two-col">
              <div className="form-field"><label>Shop Name</label><input value={pharmacyData.shopName} onChange={e=>setPharmacyData({...pharmacyData,shopName:e.target.value})} /></div>
              <div className="form-field"><label>Email</label><input type="email" value={pharmacyData.email} onChange={e=>setPharmacyData({...pharmacyData,email:e.target.value})} required /></div>
              <div className="form-field"><label>Password</label><input type="password" value={pharmacyData.password} onChange={e=>setPharmacyData({...pharmacyData,password:e.target.value})} required /></div>
              <div className="form-field"><label>Phone</label><input value={pharmacyData.phone} onChange={e=>setPharmacyData({...pharmacyData,phone:e.target.value})} /></div>
            </div>
            <MapPicker label="Location" value={pharmacyData.location} onChange={(v)=>setPharmacyData({...pharmacyData,location:v})} height={220} />
            <button className="btn primary" type="submit">Sign Up as Pharmacy</button>
          </form>
        )
      default:
        return null
    }
  }

  return (
    
    <div className="auth-page">
      <div className="auth-role-switch">
        <button className={validRole==='doctor'?'active':''} onClick={()=>navigate('/auth/doctor')}>Doctor</button>
        <button className={validRole==='patient'?'active':''} onClick={()=>navigate('/auth/patient')}>Patient</button>
        <button className={validRole==='pharmacy'?'active':''} onClick={()=>navigate('/auth/pharmacy')}>Pharmacy</button>
      </div>
      <div className={`auth-card split ${mode === 'signup' ? 'signup-active' : ''}`}>
        {/* Info Panel */}
        <div className="panel info-panel">
          <div className={`info-inner ${animating ? 'anim' : ''}`}>
            <h3 className="info-title">{roleInfo.title}</h3>
            <p className="info-subtitle">{roleInfo.subtitle}</p>
            <ul className="info-points">
              {roleInfo.points.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
            <div className="info-cta">
              <span className="muted">Mode</span>
              <div className="mode-toggle">
                <button className={mode==='login'?'active':''} onClick={()=>{ if(mode!=='login'){ setAnimating(true); setTimeout(()=>{ setMode('login') }, 220); setTimeout(()=>setAnimating(false),520) } }}>Login</button>
                <button className={mode==='signup'?'active':''} onClick={()=>{ if(mode!=='signup'){ setAnimating(true); setTimeout(()=>{ setMode('signup') }, 220); setTimeout(()=>setAnimating(false),520) } }}>Signup</button>
              </div>
            </div>
          </div>
        </div>

        {/* Form Panel */}
        <div className="panel form-panel">
          <div className={`form-inner ${animating ? 'anim' : ''}`}>
            <h2>{label} {mode === 'login' ? 'Login' : 'Signup'}</h2>
            {message && <div className="auth-message">{message}</div>}
            {mode === 'login' ? (
              <form onSubmit={handleLoginSubmit} className="auth-form">
                <div className="form-field">
                  <label>Email</label>
                  <input type="email" value={loginData.email} onChange={e=>setLoginData({...loginData,email:e.target.value})} required />
                </div>
                <div className="form-field">
                  <label>Password</label>
                  <input type="password" value={loginData.password} onChange={e=>setLoginData({...loginData,password:e.target.value})} required />
                </div>
                <button className="btn primary" type="submit">Login</button>
              </form>
            ) : (
              renderSignup()
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
