import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
// Use local UI primitives (adjust path if different)
import { Card, CardContent } from '../../components/ui/Card.jsx'
import { Button } from '../../components/ui/button.jsx'
import '../../styles/find-doctor.scss'

// Helper: Haversine distance in km between two coords
function haversineKm([lat1, lon1], [lat2, lon2]) {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// A small deterministic scatter around a city center so each doctor has coords for demo
const CITY_CENTER = { lat: 19.076, lon: 72.8777 }; // Mumbai as example
function coordsForId(id) {
  // spread within ~0.3 degrees (~33km)
  const angle = (id * 67) % 360;
  const r = ((id % 7) + 1) * 0.02; // up to ~0.14 deg
  const rad = (angle * Math.PI) / 180;
  return [CITY_CENTER.lat + Math.cos(rad) * r, CITY_CENTER.lon + Math.sin(rad) * r];
}

export default function FindADoctor() {
  const navigate = useNavigate();
  const [speciality, setSpeciality] = useState('')
  const [nameSearch, setNameSearch] = useState('')
  const [maxDistanceKm, setMaxDistanceKm] = useState(25)
  const [userCoords, setUserCoords] = useState(null)
  const [locError, setLocError] = useState('')

  // Removed per-doctor photos; we now show a single generic silhouette icon for all cards.

  const doctorsData = useMemo(() => {
    const base = [
      ['Dr. Aakarsh Mahajan','Associate Consultant','Orthopaedics, Joint Replacement & Arthroscopy Surgeon','Orthopaedics and Joint Replacement'],
      ['Dr. Aashish Chaudhry','Director & Head','Orthopaedics & Joint Replacement','Orthopaedics and Joint Replacement'],
      ['Dr. Abhishek Kumar Sambharia','Consultant','Orthopaedics','Orthopaedics and Joint Replacement'],
      ['Dr. Bharat Bahre','Senior Consultant & Associate Director','Orthopaedics & Joint Replacement','Orthopaedics and Joint Replacement'],
      ['Dr. Vikram Singh','Consultant','Orthopaedics, Joint Replacement & Sports Medicine','Orthopaedics and Joint Replacement'],
      ['Dr. Priya Verma','Director & Head','Cardiology & Interventional Cardiology','Cardiology'],
      ['Dr. Sanjay Mehta','Senior Consultant','Cardiology & Cardiac Electrophysiology','Cardiology'],
      ['Dr. Neha Gupta','Consultant','Cardiology & Preventive Cardiology','Cardiology'],
      ['Dr. Rohit Agarwal','Associate Consultant','Cardiology & Heart Failure Management','Cardiology'],
      ['Dr. Kavita Reddy','Senior Consultant','Cardiology & Cardiac Imaging','Cardiology'],
      ['Dr. Amit Srivastava','Director','Neurosurgery & Neuro-oncology','Neurology & Neurosurgery'],
      ['Dr. Madhukar Bhardwaj','Director & HOD','Neurology & Stroke Medicine','Neurology & Neurosurgery'],
      ['Dr. Sunita Nair','Senior Consultant','Neurology & Epilepsy','Neurology & Neurosurgery'],
      ['Dr. Karan Malhotra','Consultant','Neurosurgery & Spine Surgery','Neurology & Neurosurgery'],
      ['Dr. Meera Joshi','Associate Consultant','Neurology & Movement Disorders','Neurology & Neurosurgery'],
      ['Dr. Arun Kumar Giri','Director','Surgical Oncology & Gastrointestinal Surgery','Surgical Oncology'],
      ['Dr. Shalini Kapoor','Senior Consultant','Surgical Oncology & Breast Surgery','Surgical Oncology'],
      ['Dr. Deepak Chawla','Consultant','Surgical Oncology & Head & Neck Surgery','Surgical Oncology'],
      ['Dr. Ritu Desai','Associate Consultant','Surgical Oncology & Gynecological Oncology','Surgical Oncology'],
      ['Dr. Nitin Shah','Senior Consultant','Surgical Oncology & Uro-oncology','Surgical Oncology'],
      ['Dr. Anjali Mehta','Director & Head','Dermatology & Cosmetic Dermatology','Dermatology'],
      ['Dr. Rahul Kapoor','Senior Consultant','Dermatology & Skin Cancer Surgery','Dermatology'],
      ['Dr. Sneha Patel','Consultant','Dermatology & Hair Transplant','Dermatology'],
      ['Dr. Mohit Sharma','Associate Consultant','Dermatology & Pediatric Dermatology','Dermatology'],
      ['Dr. Kavita Nair','Senior Consultant','Dermatology & Laser Therapy','Dermatology'],
      ['Dr. Priya Sharma','Director & Head','Pediatrics & Neonatology','Pediatrics'],
      ['Dr. Rajesh Verma','Senior Consultant','Pediatrics & Pediatric Cardiology','Pediatrics'],
      ['Dr. Meera Desai','Consultant','Pediatrics & Pediatric Neurology','Pediatrics'],
      ['Dr. Ankit Kumar','Associate Consultant','Pediatrics & Pediatric Emergency','Pediatrics'],
      ['Dr. Sunita Reddy','Senior Consultant','Pediatrics & Developmental Pediatrics','Pediatrics']
    ];
    return base.map((row, i) => ({
      name: row[0],
      title: row[1],
      speciality: row[2],
      specialization: row[3],
      coords: coordsForId(i+1)
    }));
  }, [])

  const specialities = useMemo(() => {
    const s = Array.from(new Set(doctorsData.map(d => d.specialization)));
    return s.sort();
  }, [doctorsData])

  function locateMe() {
    if (!navigator.geolocation) {
      setLocError('Geolocation not supported in this browser.');
      return;
    }
    setLocError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords([pos.coords.latitude, pos.coords.longitude]);
      },
      (err) => {
        setLocError('Unable to get location. Please allow location access.');
        console.error(err);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  const filtered = useMemo(() => {
    return doctorsData.filter(d => {
      if (speciality && d.specialization !== speciality) return false;
      if (nameSearch && !d.name.toLowerCase().includes(nameSearch.toLowerCase())) return false;
      if (userCoords && maxDistanceKm) {
        const dist = haversineKm(userCoords, d.coords);
        return dist <= maxDistanceKm;
      }
      return true;
    });
  }, [doctorsData, speciality, nameSearch, userCoords, maxDistanceKm]);

  return (
    <div className="find-doctor-wrapper">
      <div className="find-doctor-layout">
        <aside className="fd-sidebar">
          <h3>Find doctors near you</h3>
          <div className="fd-controls">
            <label>Search by name</label>
            <input className="fd-search" placeholder="e.g. Dr. Priya" value={nameSearch} onChange={(e) => setNameSearch(e.target.value)} />

            <label>Speciality</label>
            <select className="fd-select" value={speciality} onChange={(e) => setSpeciality(e.target.value)}>
              <option value="">All specialities</option>
              {specialities.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            <label>Max distance (km)</label>
            <div className="fd-distance-row">
              <input type="range" min="1" max="100" value={maxDistanceKm} onChange={(e) => setMaxDistanceKm(Number(e.target.value))} />
              <div className="fd-distance-value">{maxDistanceKm} km</div>
            </div>

            <div className="fd-locate-row">
              <Button className="btn" onClick={locateMe}>Use my location</Button>
              {locError && <div className="fd-loc-error">{locError}</div>}
              {userCoords && <div className="fd-loc-ok">Using your location</div>}
            </div>

            <div className="fd-actions">
              <Button className="btn-secondary" onClick={() => { setNameSearch(''); setSpeciality(''); setUserCoords(null); setMaxDistanceKm(25); }}>Reset</Button>
            </div>
          </div>
        </aside>

        <main className="fd-main">
          <div className="fd-results-header">
            <h2>Doctors</h2>
            <p className="muted">Showing {filtered.length} results</p>
          </div>

          <div className="doctor-cards-grid">
            {filtered.length === 0 && <div className="empty">No matches found.</div>}
            {filtered.slice(0, 50).map((d, idx) => {
              const dist = userCoords ? haversineKm(userCoords, d.coords).toFixed(1) : null;
              return (
                <motion.div key={d.name} whileHover={{ scale:1.02, y:-4 }} transition={{ type:'spring', stiffness:260, damping:22 }}>
                  <Card className="doctor-card">
                    <div className="doctor-card-hero">
                      <div className="doctor-silhouette" aria-hidden="true">
                        <svg width="96" height="96" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="12" cy="8" r="4.5" stroke="white" strokeWidth="1.5" fill="rgba(255,255,255,0.15)" />
                          <path d="M4.5 19.5c0-3.59 3.134-6.5 7.5-6.5s7.5 2.91 7.5 6.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="rgba(255,255,255,0.07)" />
                        </svg>
                      </div>
                    </div>
                    <CardContent className="doctor-card-body">
                      <div className="card-row">
                        <h3 className="name">{d.name}</h3>
                        {dist && <div className="distance">{dist} km</div>}
                      </div>
                      <div className="title">{d.title}</div>
                      <div className="speciality">{d.speciality}</div>
                      <div className="card-actions">
                        <button className="profile-link" onClick={(e)=> e.preventDefault()}>View Full Profile</button>
                        <Button className="book-btn" onClick={() => navigate('/appointment-form', { state:{ doctorName: d.name, speciality: d.specialization } })}>Book an Appointment</Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </main>
      </div>
    </div>
  )
}
