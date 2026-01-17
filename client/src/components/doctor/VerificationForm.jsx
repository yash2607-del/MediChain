import React, { useState } from 'react';
import { FaCheckCircle, FaTimesCircle, FaSpinner } from 'react-icons/fa';

export default function VerificationForm() {
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    phone: '',
    email: '',
    registrationNumber: '',
    yearsOfPractice: '',
    specialisation: ''
  });
  const [degrees, setDegrees] = useState([{ id: crypto.randomUUID(), name: '', file: null, preview: null }]);
  const [certificates, setCertificates] = useState([{ id: crypto.randomUUID(), name: '', file: null, preview: null }]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  
  // IMA Verification state
  const [imaVerifying, setImaVerifying] = useState(false);
  const [imaVerified, setImaVerified] = useState(null); // null = not checked, true = found, false = not found
  const [imaResult, setImaResult] = useState(null);

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Reset IMA verification when name changes
    if (name === 'firstName' || name === 'lastName') {
      setImaVerified(null);
      setImaResult(null);
    }
  }

  // IMA API verification lookup
  async function verifyWithIMA() {
    const firstName = formData.firstName.trim();
    const lastName = formData.lastName.trim();
    
    if (!firstName && !lastName) {
      setError('Please enter your first name or last name to verify');
      return;
    }
    
    setImaVerifying(true);
    setImaVerified(null);
    setImaResult(null);
    setError(null);
    
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
      const params = new URLSearchParams();
      if (firstName) params.append('firstName', firstName);
      if (lastName) params.append('lastName', lastName);
      
      const res = await fetch(`${baseUrl}/api/doctor/verify-ima?${params.toString()}`);
      const data = await res.json();
      
      if (data.found && data.matchedRecord) {
        setImaVerified(true);
        setImaResult(data.matchedRecord); // Now contains { state, branch, firstName, lastName }
      } else {
        setImaVerified(false);
        setImaResult(null);
      }
    } catch (err) {
      console.error('IMA verification error:', err);
      setImaVerified(false);
      setError('Could not verify with IMA. Please try again.');
    } finally {
      setImaVerifying(false);
    }
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
    if (!formData.firstName.trim()) { setError('First name is required'); return; }
    if (!formData.lastName.trim()) { setError('Last name is required'); return; }
    if (!formData.registrationNumber.trim()) { setError('Registration number is required'); return; }
    if (!formData.email.trim()) { setError('Email is required'); return; }
    if (degrees.length === 0 || !degrees[0].name.trim()) { setError('At least one degree is required'); return; }

    setSubmitting(true);
    try {
      // Build FormData for multipart upload
      const fd = new FormData();
      fd.append('firstName', formData.firstName);
      fd.append('middleName', formData.middleName);
      fd.append('lastName', formData.lastName);
      fd.append('phone', formData.phone);
      fd.append('email', formData.email);
      fd.append('registrationNumber', formData.registrationNumber);
      fd.append('yearsOfPractice', formData.yearsOfPractice);
      fd.append('specialisation', formData.specialisation);
      fd.append('imaVerified', imaVerified === true ? 'true' : 'false');

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
          <div style={{ fontSize: 48, marginBottom: 16, color: '#10b981' }}>
            <FaCheckCircle />
          </div>
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
        <h2 style={{ margin: 0 }}>Doctor Verification</h2>
        {imaVerified === true && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#22c55e', fontSize: 14 }}>
            <FaCheckCircle /> IMA Verified
          </span>
        )}
        {imaVerified === false && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#f59e0b', fontSize: 14 }}>
            <FaTimesCircle /> Not found in IMA
          </span>
        )}
      </div>
      <p className="hint" style={{ color: '#666', marginBottom: '1rem' }}>
        Please provide your credentials and upload relevant documents for verification.
        {imaVerified !== true && <span style={{ color: '#888' }}> (Degrees to be verified soon)</span>}
      </p>

      {error && <div className="error-banner" style={{ background: '#fee', color: '#c00', padding: '0.75rem 1rem', borderRadius: 8, marginBottom: '1rem' }}>{error}</div>}

      {/* Personal Information */}
      <fieldset style={{ border: '1px solid var(--color-border, #e0e0e0)', borderRadius: 10, padding: '1rem 1.25rem', marginBottom: '1.25rem' }}>
        <legend style={{ fontWeight: 600, padding: '0 0.5rem' }}>Personal Information</legend>
        <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <label className="field">
            <span>First Name <span style={{ color: 'red' }}>*</span></span>
            <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} placeholder="John" required />
          </label>
          <label className="field">
            <span>Middle Name <span style={{ color: '#999', fontSize: 12 }}>(optional)</span></span>
            <input type="text" name="middleName" value={formData.middleName} onChange={handleChange} placeholder="William" />
          </label>
          <label className="field">
            <span>Last Name <span style={{ color: 'red' }}>*</span></span>
            <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Doe" required />
          </label>
          <label className="field">
            <span>Phone Number</span>
            <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="+91 98765 43210" />
          </label>
          <label className="field">
            <span>Email <span style={{ color: 'red' }}>*</span></span>
            <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="doctor@example.com" required />
          </label>
        </div>
        
        {/* IMA Verification Button */}
        <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn secondary"
            onClick={verifyWithIMA}
            disabled={imaVerifying || (!formData.firstName.trim() && !formData.lastName.trim())}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            {imaVerifying ? <><FaSpinner className="spin" /> Verifying...</> : 'Verify with IMA India'}
          </button>
          {imaVerified === true && imaResult && (
            <span style={{ fontSize: 13, color: '#22c55e' }}>
              ✓ Verified: {imaResult.firstName} {imaResult.lastName} ({imaResult.branch}, {imaResult.state})
            </span>
          )}
        </div>
      </fieldset>

      {/* Professional Information */}
      <fieldset style={{ border: '1px solid var(--color-border, #e0e0e0)', borderRadius: 10, padding: '1rem 1.25rem', marginBottom: '1.25rem' }}>
        <legend style={{ fontWeight: 600, padding: '0 0.5rem' }}>Professional Information</legend>
        <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <label className="field">
            <span>Medical Registration Number <span style={{ color: 'red' }}>*</span></span>
            <input type="text" name="registrationNumber" value={formData.registrationNumber} onChange={handleChange} placeholder="MCI/2015/12345" required />
          </label>
          <label className="field">
            <span>Specialisation <span style={{ color: 'red' }}>*</span></span>
            <input type="text" name="specialisation" value={formData.specialisation} onChange={handleChange} placeholder="Cardiology, Pediatrics, etc." required />
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
          <div key={deg.id} className="doc-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto auto', gap: '1rem', alignItems: 'end', marginBottom: '1rem' }}>
            <label className="field">
              <span>Degree Name</span>
              <input type="text" value={deg.name} onChange={e => updateDegree(deg.id, 'name', e.target.value)} placeholder="MBBS, MD, etc." style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #ccc', borderRadius: 6 }} />
            </label>
            <label className="field">
              <span>Upload Document</span>
              <input type="file" accept="image/*,.pdf" onChange={e => handleDegreeFile(deg.id, e.target.files?.[0])} style={{ width: '100%' }} />
            </label>
            {deg.preview ? (
              <div style={{ width: 60, height: 60, border: '1px solid #ccc', borderRadius: 6, overflow: 'hidden', flexShrink: 0 }}>
                <img src={deg.preview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ) : (
              <div style={{ width: 60, height: 60 }} />
            )}
            {degrees.length > 1 ? (
              <button type="button" className="btn secondary small" onClick={() => removeDegree(deg.id)} style={{ height: 36, whiteSpace: 'nowrap' }}>Remove</button>
            ) : (
              <div style={{ width: 70 }} />
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
          <div key={cert.id} className="doc-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto auto', gap: '1rem', alignItems: 'end', marginBottom: '1rem' }}>
            <label className="field">
              <span>Certificate Name</span>
              <input type="text" value={cert.name} onChange={e => updateCertificate(cert.id, 'name', e.target.value)} placeholder="Fellowship, Board Cert, etc." style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #ccc', borderRadius: 6 }} />
            </label>
            <label className="field">
              <span>Upload Document</span>
              <input type="file" accept="image/*,.pdf" onChange={e => handleCertificateFile(cert.id, e.target.files?.[0])} style={{ width: '100%' }} />
            </label>
            {cert.preview ? (
              <div style={{ width: 60, height: 60, border: '1px solid #ccc', borderRadius: 6, overflow: 'hidden', flexShrink: 0 }}>
                <img src={cert.preview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ) : (
              <div style={{ width: 60, height: 60 }} />
            )}
            {certificates.length > 1 ? (
              <button type="button" className="btn secondary small" onClick={() => removeCertificate(cert.id)} style={{ height: 36, whiteSpace: 'nowrap' }}>Remove</button>
            ) : (
              <div style={{ width: 70 }} />
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
