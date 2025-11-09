import React, { useState, useMemo, useEffect } from 'react';
import DashboardLayout from './DashboardLayout.jsx'
import '../styles/doctor-dashboard.scss';
import PrescribeForm from './doctor/PrescribeForm.jsx';
import CalendarPane from './doctor/CalendarPane.jsx';
import AppointmentsPane from './doctor/AppointmentsPane.jsx';
import MapPicker from './MapPicker.jsx';

export default function DoctorDashboard() {
  // Helper to build API URLs from env
  const apiUrl = (path) => new URL(path, import.meta.env.VITE_API_BASE_URL || '/').toString()
  const [active, setActive] = useState('prescribe');
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(() => today.toISOString().slice(0,10));

  // Location state for doctor
  const session = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('session')||'null') } catch { return null }
  }, [])
  const initialLoc = session?.user?.profile?.location || null
  const [docLocation, setDocLocation] = useState(initialLoc)
  const [locMsg, setLocMsg] = useState('')

  // Appointments state populated from backend
  const [appointmentRequests, setAppointmentRequests] = useState([]); // pending status
  const [upcoming, setUpcoming] = useState([]); // approved/confirmed
  const [loadMsg, setLoadMsg] = useState('');

  // Fetch doctor appointments
  async function refreshAppointments() {
    try {
      setLoadMsg('');
      const sess = JSON.parse(localStorage.getItem('session')||'null');
      const doctorId = sess?.user?._id || sess?.user?.id;
      if (!doctorId) { setLoadMsg('Missing doctor id'); return; }
      const token = localStorage.getItem('token');
      const res = await fetch(apiUrl(`api/appointments?doctorId=${doctorId}`), {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const json = await res.json();
      if (!res.ok) { setLoadMsg(json.error || 'Failed to load appointments'); return; }
      const list = Array.isArray(json) ? json : [];
      // fetch patient names
      const ids = Array.from(new Set(list.map(a => a.patientId).filter(Boolean)));
      const nameMap = {};
      await Promise.all(ids.map(async (pid) => {
        try {
          const r = await fetch(apiUrl(`api/auth/user/${pid}`));
          if (!r.ok) return;
          const j = await r.json();
          const nm = j?.profile?.name || j?.profile?.fullName || j?.email || String(pid).slice(0,6);
          nameMap[pid] = nm;
        } catch {}
      }));
      const withNames = list.map(a => ({ ...a, patientName: nameMap[a.patientId] || a.patientName }));
      const pending = withNames.filter(a => a.status === 'pending');
      const upcomingList = withNames.filter(a => a.status === 'approved' || a.status === 'confirmed');
      setAppointmentRequests(pending);
      setUpcoming(upcomingList);
    } catch (e) {
      setLoadMsg('Network error while fetching');
    }
  }
  useEffect(() => { refreshAppointments(); }, []);

  function compareDateTime(a, b) {
    const aDate = a.date || a.appointmentDate || '';
    const aTime = a.time || a.appointmentTime || '';
    const bDate = b.date || b.appointmentDate || '';
    const bTime = b.time || b.appointmentTime || '';
    return new Date(`${aDate}T${aTime}`) - new Date(`${bDate}T${bTime}`);
  }
  function formatDate(d) {
    const dt = new Date(d);
    return dt.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' });
  }

  async function acceptRequest(id) {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(apiUrl(`api/appointments/${id}/status`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(token? { 'Authorization': `Bearer ${token}` } : {}) },
        body: JSON.stringify({ status: 'confirmed' })
      });
      const j = await res.json();
      if (!res.ok) { console.error(j); return; }
      refreshAppointments();
    } catch (e) { console.error(e); }
  }
  async function rejectRequest(id) {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(apiUrl(`api/appointments/${id}/status`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(token? { 'Authorization': `Bearer ${token}` } : {}) },
        body: JSON.stringify({ status: 'cancelled' })
      });
      const j = await res.json();
      if (!res.ok) { console.error(j); return; }
      refreshAppointments();
    } catch (e) { console.error(e); }
  }

  // Aggregate upcoming appointments by date for calendar heatmap
  const appointmentsByDate = useMemo(() => {
    const map = {};
    upcoming.forEach(a => {
      const dateIso = a.appointmentDate ? new Date(a.appointmentDate).toISOString().slice(0,10) : null;
      if (!dateIso) return;
      const entry = {
        date: dateIso,
        time: a.appointmentTime || '',
        patient: a.patientName || a.patientId || 'Patient',
        reason: a.reason
      };
      map[dateIso] = map[dateIso] ? [...map[dateIso], entry] : [entry];
    });
    return map;
  }, [upcoming]);

  // Build calendar days for current month
  const calendarDays = useMemo(() => {
    const year = today.getFullYear();
    const month = today.getMonth();
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const days = [];
    for (let i = 0; i < first.getDay(); i++) days.push(null);
    for (let d = 1; d <= last.getDate(); d++) {
      const dateObj = new Date(year, month, d);
      const iso = dateObj.toISOString().slice(0,10);
      const appts = appointmentsByDate[iso] || [];
      days.push({ day: d, iso, count: appts.length });
    }
    return days;
  }, [appointmentsByDate, today]);

  const selectedAppointments = appointmentsByDate[selectedDate] || [];

  function heatColor(count) {
    if (!count) return 'transparent';
    if (count >= 10) return 'linear-gradient(135deg,#1e5f34,#2ECC71)';
    // scale lightness based on count (1..9)
    const lightness = 85 - count * 4; // from ~81 to ~49
    return `hsl(145deg 60% ${lightness}%)`;
  }

  const menuItems = [
    { key: 'prescribe', label: 'Prescribe' },
    { key: 'calendar', label: 'Calendar' },
    { key: 'appointments', label: 'Appointments' },
    { key: 'location', label: 'Location' }
  ];

  return (
    <div className="doctor-dashboard">
      <DashboardLayout
        brand="MediChain"
        menuItems={menuItems}
        active={active}
        setActive={setActive}
      >
        {active === 'prescribe' && (
          <section className="prescribe-pane">
            <h2>Prescribe</h2>
            <p>Create a prescription for a patient. All fields optional, but patient name recommended.</p>
            <PrescribeForm />
          </section>
        )}
        {active === 'calendar' && (
          <CalendarPane
            calendarDays={calendarDays}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            selectedAppointments={selectedAppointments}
            heatColor={heatColor}
          />
        )}
        {active === 'appointments' && (
          <AppointmentsPane
            appointmentRequests={appointmentRequests}
            upcoming={upcoming}
            formatDate={formatDate}
            compareDateTime={compareDateTime}
            rejectRequest={rejectRequest}
            acceptRequest={acceptRequest}
            loadMsg={loadMsg}
            onRefresh={refreshAppointments}
          />
        )}
        {active === 'location' && (
          <section className="profile-section">
            <h2>Practice Location</h2>
            {locMsg && <div className="auth-message" style={{marginBottom:8}}>{locMsg}</div>}
            <MapPicker label="Location" value={docLocation} onChange={setDocLocation} height={260} />
            {docLocation?.address && <div style={{marginTop:8}}><strong>Address:</strong> {docLocation.address}</div>}
            <div style={{marginTop:12}}>
              <button
                className="btn primary"
                onClick={async () => {
                  setLocMsg('')
                  if (!docLocation?.lat || !docLocation?.lng || !docLocation?.address) { setLocMsg('Pick a location first'); return }
                  try {
                    const token = localStorage.getItem('token')
                    const res = await fetch(apiUrl('api/auth/location'), {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                      body: JSON.stringify({ lat: docLocation.lat, lng: docLocation.lng, address: docLocation.address })
                    })
                    const data = await res.json()
                    if (!res.ok) { setLocMsg(data.error || 'Failed to save location'); return }
                    // update session cache
                    const sess = JSON.parse(localStorage.getItem('session')||'null')
                    if (sess?.user) { sess.user.profile = data.profile; localStorage.setItem('session', JSON.stringify(sess)) }
                    setLocMsg('Location saved')
                  } catch (e) {
                    setLocMsg('Network error while saving')
                  }
                }}
              >Save Location</button>
            </div>
          </section>
        )}
      </DashboardLayout>
    </div>
  );
}

// Child components moved to ./doctor/* for clarity
