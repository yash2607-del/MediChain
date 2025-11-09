import { useState, useMemo, useEffect } from 'react'
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
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Removed per-doctor photos; we now show a single generic silhouette icon for all cards.

  // Fetch doctors from backend API
  useEffect(() => {
    let cancelled = false;
    async function loadDoctors() {
      setLoading(true); setError('');
      try {
        const base = import.meta.env.VITE_API_BASE_URL || '/';
        // Basic fetch; could add ?q= for server-side search later
        const url = new URL('api/auth/doctors', base).toString();
        const res = await fetch(url);
        const text = await res.text();
        let data = {};
        try { data = text ? JSON.parse(text) : {}; } catch { data = {}; }
        if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
        const items = Array.isArray(data.items) ? data.items : [];
        const mapped = items.map((doc, i) => {
          const profile = doc.profile || {};
          const rawName = profile.name || doc.email || 'Doctor';
          const name = rawName.toLowerCase().startsWith('dr') ? rawName : `Dr. ${rawName}`;
          const specialization = profile.specialization || profile.speciality || profile.field || 'General';
          const title = profile.title || profile.designation || 'Consultant';
          return {
            name,
            title,
            speciality: profile.speciality || profile.specialization || specialization,
            specialization,
            coords: coordsForId(i + 1),
            _id: doc._id || doc.id
          };
        });
        if (!cancelled) setDoctors(mapped);
      } catch (e) {
        if (!cancelled) setError(e.message || 'Failed to load doctors');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadDoctors();
    return () => { cancelled = true };
  }, []);

  const specialities = useMemo(() => {
    const s = Array.from(new Set(doctors.map(d => d.specialization)));
    return s.sort();
  }, [doctors])

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
    return doctors.filter(d => {
      if (speciality && d.specialization !== speciality) return false;
      if (nameSearch && !d.name.toLowerCase().includes(nameSearch.toLowerCase())) return false;
      if (userCoords && maxDistanceKm) {
        const dist = haversineKm(userCoords, d.coords);
        return dist <= maxDistanceKm;
      }
      return true;
    });
  }, [doctors, speciality, nameSearch, userCoords, maxDistanceKm]);

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
            <p className="muted">{loading ? 'Loading doctors...' : `Showing ${filtered.length} results`}</p>
            {error && <p className="fd-error" style={{color:'#b91c1c', fontSize:'0.8rem'}}>{error}</p>}
          </div>

          <div className="doctor-cards-grid">
            {!loading && filtered.length === 0 && !error && <div className="empty">No matches found.</div>}
            {loading && <div className="empty">Loading...</div>}
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
                        <Button
                          className="book-btn"
                          onClick={() => {
                            navigate('/patient', { state: { active: 'book', doctorName: d.name, speciality: d.specialization } })
                          }}
                        >
                          Book an Appointment
                        </Button>
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
