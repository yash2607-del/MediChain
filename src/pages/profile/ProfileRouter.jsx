import React from 'react'
import { Navigate } from 'react-router-dom'

export default function ProfileRouter() {
  const sessionRaw = localStorage.getItem('session')
  if (!sessionRaw) return <Navigate to="/auth/patient" replace />
  try {
    const session = JSON.parse(sessionRaw)
    if (session?.role === 'doctor') return <Navigate to="/profile/doctor" replace />
    if (session?.role === 'pharmacy') return <Navigate to="/profile/pharmacy" replace />
    if (session?.role === 'patient') return <Navigate to="/profile/patient" replace />
    return <Navigate to="/auth/patient" replace />
  } catch {
    return <Navigate to="/auth/patient" replace />
  }
}
