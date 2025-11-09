import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import "./Appointment-form.css";

// Simplified appointment form: only doctorName, reasonForVisit, appointmentDate
// Prefetch doctors from /api/auth/doctors and offer a dropdown (datalist) for selection.
export default function AppointmentForm({ prefill }) {
  const location = useLocation();
  const navState = location.state || {};

  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [doctorFetchError, setDoctorFetchError] = useState(null);

  const [formData, setFormData] = useState({
    doctorId: "",
    doctorName: (prefill?.doctorName ?? navState?.doctorName) || "", // display only
    appointmentDate: "",
    appointmentTime: "",
    reasonForVisit: ""
  });

  // Update doctorName if parent supplies different prefill later
  useEffect(() => {
    if (prefill?.doctorName && prefill?.doctorName !== formData.doctorName) {
      setFormData(f => ({ ...f, doctorName: prefill.doctorName }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefill?.doctorName]);

  // Prefetch doctors list
  useEffect(() => {
    const fetchDoctors = async () => {
      setLoadingDoctors(true);
      setDoctorFetchError(null);
      try {
        const base = import.meta.env.VITE_API_BASE_URL || '/';
        const url = new URL('api/auth/doctors', base).toString();
        const res = await fetch(url);

        // If non-OK, attempt to read text for better debugging (avoid JSON parse error)
        if (!res.ok) {
          const text = await res.text().catch(() => '');
          throw new Error(`Failed to load doctors (status ${res.status}): ${text}`);
        }

        const data = await res.json().catch(() => null);
        // API returns { ok, count, items: [...] } — prefer items, then doctors, then array body
        const list = Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data?.doctors)
          ? data.doctors
          : Array.isArray(data)
          ? data
          : data
          ? [data]
          : [];
        setDoctors(list);
        // If a doctorName was prefilled, try to map it to an id
        if (!formData.doctorId && ((prefill?.doctorName) || (navState?.doctorName))) {
          const target = (prefill?.doctorName || navState?.doctorName || '').trim().toLowerCase();
          const found = list.find(d => ( (d?.profile?.name || d?.profile?.fullName || d?.name || d?.email || '')
            .toString()
            .toLowerCase()
            .includes(target)));
          if (found?._id) {
            setFormData(prev => ({ ...prev, doctorId: found._id }));
          }
        }
      } catch (err) {
        // include more context so the console points at a helpful message
        console.error('Doctor fetch failed:', err?.message || err);
        setDoctorFetchError(err?.message || 'Failed to load doctors');
      } finally {
        setLoadingDoctors(false);
      }
    };
    fetchDoctors();
  }, []);

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const handleReset = () => {
    setFormData({
      doctorId: "",
      doctorName: (prefill?.doctorName ?? navState?.doctorName) || "",
      appointmentDate: "",
      appointmentTime: "",
      reasonForVisit: ""
    });
    setErrors({});
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.doctorId) newErrors.doctorId = 'Doctor is required';
    if (!formData.reasonForVisit.trim()) newErrors.reasonForVisit = 'Reason for visit is required';
    if (!formData.appointmentDate) newErrors.appointmentDate = 'Appointment date is required';
    if (!formData.appointmentTime) newErrors.appointmentTime = 'Appointment time is required';
    if (formData.appointmentDate) {
      const selected = new Date(formData.appointmentDate);
      const today = new Date();
      today.setHours(0,0,0,0);
      if (selected < today) newErrors.appointmentDate = 'Appointment date cannot be in the past';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
  const session = JSON.parse(localStorage.getItem('session') || '{}');
  const patientId = session?.user?._id || session?.user?.id || session?.user?.email;
      if (!patientId) {
        toast.error('Please login to book an appointment', { position: 'top-right' });
        setIsSubmitting(false);
        return;
      }
      const processingToast = toast.loading('Processing your appointment...', { position: 'top-center' });
      const selectedDoctor = doctors.find(d => (d._id === formData.doctorId));
      const selectedName = selectedDoctor ? (selectedDoctor?.profile?.name || selectedDoctor?.profile?.fullName || selectedDoctor?.name || selectedDoctor?.email) : formData.doctorName;
      const appointmentData = {
        patientId,
        doctorId: formData.doctorId,
        doctorName: selectedName,
        appointmentDate: formData.appointmentDate,
        appointmentTime: formData.appointmentTime,
        reason: formData.reasonForVisit,
        status: 'pending'
      };
      const base = import.meta.env.VITE_API_BASE_URL || '/';
      const token = session?.token || localStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const response = await fetch(new URL('api/appointments', base).toString(), {
        method: 'POST',
        headers,
        body: JSON.stringify(appointmentData)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to book appointment');
      toast.dismiss(processingToast);
      toast.success(
        <div>
          <strong>Appointment Scheduled</strong>
          <p style={{ margin: '0.4rem 0 0', fontSize: '0.85rem' }}>With {selectedName} on {formData.appointmentDate}</p>
        </div>,
        { position: 'top-center', autoClose: 4000 }
      );
      handleReset();
    } catch (err) {
      console.error('Error booking appointment', err);
      toast.error(`Failed: ${err.message}`, { position: 'top-right' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const doctorDisplayName = (doc) => {
    const raw = doc?.profile?.name || doc?.profile?.fullName || doc?.name || doc?.email || '';
    return raw.startsWith('Dr.') ? raw : `Dr. ${raw}`;
  };

  return (
    <div className="prescribe-form-page">
      <ToastContainer />
      <div className="prescribe-form-container">
        <div className="form-header">
          <h1>Book Appointment</h1>
          <p>Just three quick details to schedule.</p>
        </div>
        <form onSubmit={handleSubmit} className="prescribe-form">
          <div className="form-section">
            <h2 className="section-title">Details</h2>
            <div className="form-row" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
              <div className="form-group" style={{ flex: '1 1 300px' }}>
                <label htmlFor="doctorId">Doctor <span className="required">*</span></label>
                <select
                  id="doctorId"
                  name="doctorId"
                  value={formData.doctorId}
                  onChange={handleChange}
                  className={errors.doctorId ? 'error' : ''}
                >
                  <option value="">{loadingDoctors ? 'Loading...' : 'Select a doctor'}</option>
                  {doctors
                    .filter(d => d && d._id)
                    .map((d) => (
                      <option key={String(d._id)} value={d._id}>{doctorDisplayName(d)}</option>
                    ))}
                </select>
                {doctorFetchError && <span className="error-message">{doctorFetchError}</span>}
                {errors.doctorId && <span className="error-message">{errors.doctorId}</span>}
              </div>
              <div className="form-group" style={{ flex: '1 1 180px' }}>
                <label htmlFor="appointmentDate">Date <span className="required">*</span></label>
                <input
                  type="date"
                  id="appointmentDate"
                  name="appointmentDate"
                  value={formData.appointmentDate}
                  onChange={handleChange}
                  className={errors.appointmentDate ? 'error' : ''}
                  min={new Date().toISOString().split('T')[0]}
                />
                {errors.appointmentDate && <span className="error-message">{errors.appointmentDate}</span>}
              </div>
              <div className="form-group" style={{ flex: '1 1 180px' }}>
                <label htmlFor="appointmentTime">Time <span className="required">*</span></label>
                <select
                  id="appointmentTime"
                  name="appointmentTime"
                  value={formData.appointmentTime}
                  onChange={handleChange}
                  className={errors.appointmentTime ? 'error' : ''}
                >
                  <option value="">Select</option>
                  <option value="09:00">09:00</option>
                  <option value="09:30">09:30</option>
                  <option value="10:00">10:00</option>
                  <option value="10:30">10:30</option>
                  <option value="11:00">11:00</option>
                  <option value="11:30">11:30</option>
                  <option value="12:00">12:00</option>
                  <option value="12:30">12:30</option>
                  <option value="13:00">13:00</option>
                  <option value="13:30">13:30</option>
                  <option value="14:00">14:00</option>
                </select>
                {errors.appointmentTime && <span className="error-message">{errors.appointmentTime}</span>}
              </div>
              <div className="form-group" style={{ flex: '1 1 300px' }}>
                <label htmlFor="reasonForVisit">Reason <span className="required">*</span></label>
                <input
                  type="text"
                  id="reasonForVisit"
                  name="reasonForVisit"
                  value={formData.reasonForVisit}
                  onChange={handleChange}
                  className={errors.reasonForVisit ? 'error' : ''}
                  placeholder="Describe your concern"
                />
                {errors.reasonForVisit && <span className="error-message">{errors.reasonForVisit}</span>}
              </div>
            </div>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Appointment'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={handleReset} disabled={isSubmitting}>Reset</button>
          </div>
        </form>
      </div>
    </div>
  );
}
