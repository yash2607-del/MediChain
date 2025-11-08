import React from 'react'
import '../styles/landing.scss'

export default function Landing() {
  return (
    <div className="landing">
      <header className="hero">
        <div className="hero-inner">
          <h1>Connected Care — doctors, patients, pharmacies</h1>
          <p className="tag">Prescriptions sent directly. Inventory-managed pharmacies. Faster fulfilment, better outcomes.</p>
          <div className="cta-row">
            <button className="btn primary">Get Started</button>
            <button className="btn outline">Learn More</button>
          </div>
        </div>
      </header>

      <section className="features">
        <div className="container">
          <h2>How it helps</h2>
          <div className="grid">
            <div className="feature">
              <h3>For Doctors</h3>
              <p>Send prescriptions electronically to patients' chosen pharmacies and track fulfilment status.</p>
            </div>

            <div className="feature">
              <h3>For Patients</h3>
              <p>Receive prescriptions directly, locate nearest stores with availability, and choose delivery or pickup.</p>
            </div>

            <div className="feature">
              <h3>For Pharmacies</h3>
              <p>Manage inventory, accept e-prescriptions, and sync stock across stores to reduce shortages.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="how">
        <div className="container">
          <h2>How it works</h2>
          <ol>
            <li>Doctor creates e-prescription and chooses patient’s preferred pharmacy.</li>
            <li>Pharmacy receives the order and confirms availability.</li>
            <li>Patient receives confirmation and picks up or gets delivery.</li>
          </ol>
        </div>
      </section>

      <footer className="footer">
        <div className="container">
          <p>© {new Date().getFullYear()} Connected Care — Built for clinicians, patients, and pharmacies.</p>
        </div>
      </footer>
    </div>
  )
}
