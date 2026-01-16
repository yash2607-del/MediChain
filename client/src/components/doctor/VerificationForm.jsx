import React, { useState } from 'react';

export default function VerificationForm() {
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    registrationNumber: '',
    yearsOfPractice: ''
  });
  const [degrees, setDegrees] = useState([{ id: crypto.randomUUID(), name: '', file: null, preview: null }]);
  const [certificates, setCertificates] = useState([{ id: crypto.randomUUID(), name: '', file: null, preview: null }]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }

  // Degree handlers
  function addDegree() {
    setDegrees(prev => [...prev, { id: crypto.randomUUID(), name: '', file: null, preview: null }]);
  }
  function updateDegree(id, field, value) {
    setDegrees(prev => prev.map(d => d.id === id ? { ...d, [field]: value } : d));
  }
  function handleDegreeFile(id, file) {
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setDegrees(prev => prev.map(d => d.id === id ? { ...d, file, preview } : d));
  }
  function removeDegree(id) {
    setDegrees(prev => prev.filter(d => d.id !== id));
  }

  // Certificate handlers
  function addCertificate() {
    setCertificates(prev => [...prev, { id: crypto.randomUUID(), name: '', file: null, preview: null }]);
  }
  function updateCertificate(id, field, value) {
    setCertificates(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
  }
  function handleCertificateFile(id, file) {
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setCertificates(prev => prev.map(c => c.id === id ? { ...c, file, preview } : c));
  }
  function removeCertificate(id) {
    setCertificates(prev => prev.filter(c => c.id !== id));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    // Basic validation
    if (!formData.fullName.trim()) { setError('Full name is required'); return; }
    if (!formData.registrationNumber.trim()) { setError('Registration number is required'); return; }
    if (!formData.email.trim()) { setError('Email is required'); return; }
    if (degrees.length === 0 || !degrees[0].name.trim()) { setError('At least one degree is required'); return; }

    setSubmitting(true);
    try {
      // Build FormData for multipart upload
      const fd = new FormData();
      fd.append('fullName', formData.fullName);
      fd.append('phone', formData.phone);
      fd.append('email', formData.email);
      fd.append('registrationNumber', formData.registrationNumber);
      fd.append('yearsOfPractice', formData.yearsOfPractice);

      // Degrees metadata and files
      const degreesMeta = degrees.map(d => ({ name: d.name }));
      fd.append('degreesMeta', JSON.stringify(degreesMeta));
      degrees.forEach((d, i) => {
        if (d.file) fd.append(`degree_${i}`, d.file);
      });

      // Certificates metadata and files
      const certsMeta = certificates.filter(c => c.name.trim()).map(c => ({ name: c.name }));
      fd.append('certificatesMeta', JSON.stringify(certsMeta));
      certificates.forEach((c, i) => {
        if (c.file) fd.append(`certificate_${i}`, c.file);
      });

      const token = localStorage.getItem('token');
      const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
      const res = await fetch(`${baseUrl}/api/doctor/verification`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'Submission failed');
      }

      setSubmitted(true);
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="verification-success">
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✓</div>
          <h2>Verification Submitted</h2>
          <p>Your documents have been submitted for review. You will be notified once verified.</p>
          <button className="btn primary" onClick={() => setSubmitted(false)} style={{ marginTop: 16 }}>
            Submit Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <form className="verification-form" onSubmit={handleSubmit}>
      <h2>Doctor Verification</h2>
      <p className="hint">Please provide your credentials and upload relevant documents for verification.</p>

      {error && <div className="error-banner" style={{ background: '#fee', color: '#c00', padding: '0.75rem 1rem', borderRadius: 8, marginBottom: '1rem' }}>{error}</div>}

      {/* Personal Information */}
      <fieldset style={{ border: '1px solid var(--color-border, #e0e0e0)', borderRadius: 10, padding: '1rem 1.25rem', marginBottom: '1.25rem' }}>
        <legend style={{ fontWeight: 600, padding: '0 0.5rem' }}>Personal Information</legend>
        <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <label className="field">
            <span>Full Name <span style={{ color: 'red' }}>*</span></span>
            <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} placeholder="Dr. John Doe" required />
          </label>
          <label className="field">
            <span>Phone Number</span>
            <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="+91 98765 43210" />
          </label>
          <label className="field">
            <span>Email <span style={{ color: 'red' }}>*</span></span>
            <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="doctor@example.com" required />
          </label>
          <label className="field">
            <span>Medical Registration Number <span style={{ color: 'red' }}>*</span></span>
            <input type="text" name="registrationNumber" value={formData.registrationNumber} onChange={handleChange} placeholder="MCI/2015/12345" required />
          </label>
          <label className="field">
            <span>Years of Practice</span>
            <input type="number" name="yearsOfPractice" value={formData.yearsOfPractice} onChange={handleChange} placeholder="10" min="0" />
          </label>
        </div>
      </fieldset>

      {/* Degrees Section */}
      <fieldset style={{ border: '1px solid var(--color-border, #e0e0e0)', borderRadius: 10, padding: '1rem 1.25rem', marginBottom: '1.25rem' }}>
        <legend style={{ fontWeight: 600, padding: '0 0.5rem' }}>Degrees <span style={{ color: 'red' }}>*</span></legend>
        <p style={{ fontSize: 13, color: '#666', marginBottom: '0.75rem' }}>
          Upload a clear photo or scan of your degree certificate. A framed photo is acceptable for older degrees.
        </p>
        {degrees.map((deg, idx) => (
          <div key={deg.id} className="doc-row" style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <label className="field" style={{ flex: '1 1 180px' }}>
              <span>Degree Name</span>
              <input type="text" value={deg.name} onChange={e => updateDegree(deg.id, 'name', e.target.value)} placeholder="MBBS, MD, etc." />
            </label>
            <label className="field" style={{ flex: '1 1 200px' }}>
              <span>Upload Document</span>
              <input type="file" accept="image/*,.pdf" onChange={e => handleDegreeFile(deg.id, e.target.files?.[0])} />
            </label>
            {deg.preview && (
              <div style={{ width: 80, height: 80, border: '1px solid #ccc', borderRadius: 6, overflow: 'hidden' }}>
                <img src={deg.preview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}
            {degrees.length > 1 && (
              <button type="button" className="btn secondary small" onClick={() => removeDegree(deg.id)} style={{ alignSelf: 'center' }}>Remove</button>
            )}
          </div>
        ))}
        <button type="button" className="btn secondary" onClick={addDegree}>+ Add Another Degree</button>
      </fieldset>

      {/* Certificates Section */}
      <fieldset style={{ border: '1px solid var(--color-border, #e0e0e0)', borderRadius: 10, padding: '1rem 1.25rem', marginBottom: '1.25rem' }}>
        <legend style={{ fontWeight: 600, padding: '0 0.5rem' }}>Certificates &amp; Specializations</legend>
        <p style={{ fontSize: 13, color: '#666', marginBottom: '0.75rem' }}>
          Upload any additional certifications, fellowships, or specialization documents.
        </p>
        {certificates.map((cert, idx) => (
          <div key={cert.id} className="doc-row" style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <label className="field" style={{ flex: '1 1 180px' }}>
              <span>Certificate Name</span>
              <input type="text" value={cert.name} onChange={e => updateCertificate(cert.id, 'name', e.target.value)} placeholder="Fellowship, Board Cert, etc." />
            </label>
            <label className="field" style={{ flex: '1 1 200px' }}>
              <span>Upload Document</span>
              <input type="file" accept="image/*,.pdf" onChange={e => handleCertificateFile(cert.id, e.target.files?.[0])} />
            </label>
            {cert.preview && (
              <div style={{ width: 80, height: 80, border: '1px solid #ccc', borderRadius: 6, overflow: 'hidden' }}>
                <img src={cert.preview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}
            {certificates.length > 1 && (
              <button type="button" className="btn secondary small" onClick={() => removeCertificate(cert.id)} style={{ alignSelf: 'center' }}>Remove</button>
            )}
          </div>
        ))}
        <button type="button" className="btn secondary" onClick={addCertificate}>+ Add Another Certificate</button>
      </fieldset>

      {/* Submit */}
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
        <button type="submit" className="btn primary" disabled={submitting}>
          {submitting ? 'Submitting…' : 'Submit for Verification'}
        </button>
      </div>
    </form>
  );
}
