import React, { useState } from 'react';
import { FaCheckCircle } from 'react-icons/fa';

export default function PharmacyVerificationForm() {
  const [formData, setFormData] = useState({
    shopName: '',
    ownerName: '',
    phone: '',
    email: '',
    licenseNumber: '',
    gstNumber: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    yearsInBusiness: ''
  });
  const [licenses, setLicenses] = useState([{ id: crypto.randomUUID(), name: 'Drug License', file: null, preview: null }]);
  const [certificates, setCertificates] = useState([{ id: crypto.randomUUID(), name: '', file: null, preview: null }]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }

  // License handlers
  function addLicense() {
    setLicenses(prev => [...prev, { id: crypto.randomUUID(), name: '', file: null, preview: null }]);
  }
  function updateLicense(id, field, value) {
    setLicenses(prev => prev.map(l => l.id === id ? { ...l, [field]: value } : l));
  }
  function handleLicenseFile(id, file) {
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setLicenses(prev => prev.map(l => l.id === id ? { ...l, file, preview } : l));
  }
  function removeLicense(id) {
    setLicenses(prev => prev.filter(l => l.id !== id));
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
    if (!formData.shopName.trim()) { setError('Shop name is required'); return; }
    if (!formData.ownerName.trim()) { setError('Owner name is required'); return; }
    if (!formData.licenseNumber.trim()) { setError('License number is required'); return; }
    if (!formData.email.trim()) { setError('Email is required'); return; }
    if (!formData.phone.trim()) { setError('Phone number is required'); return; }
    if (!formData.address.trim()) { setError('Address is required'); return; }
    if (licenses.length === 0 || !licenses[0].file) { setError('Drug license document is required'); return; }

    setSubmitting(true);
    try {
      // Build FormData for multipart upload
      const fd = new FormData();
      fd.append('shopName', formData.shopName);
      fd.append('ownerName', formData.ownerName);
      fd.append('phone', formData.phone);
      fd.append('email', formData.email);
      fd.append('licenseNumber', formData.licenseNumber);
      fd.append('gstNumber', formData.gstNumber);
      fd.append('address', formData.address);
      fd.append('city', formData.city);
      fd.append('state', formData.state);
      fd.append('pincode', formData.pincode);
      fd.append('yearsInBusiness', formData.yearsInBusiness);

      // Licenses metadata and files
      const licensesMeta = licenses.map(l => ({ name: l.name }));
      fd.append('licensesMeta', JSON.stringify(licensesMeta));
      licenses.forEach((l, i) => {
        if (l.file) fd.append(`license_${i}`, l.file);
      });

      // Certificates metadata and files
      const certsMeta = certificates.filter(c => c.name.trim()).map(c => ({ name: c.name }));
      fd.append('certificatesMeta', JSON.stringify(certsMeta));
      certificates.forEach((c, i) => {
        if (c.file) fd.append(`certificate_${i}`, c.file);
      });

      const token = localStorage.getItem('token');
      const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
      const res = await fetch(`${baseUrl}/api/pharmacy/verification`, {
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
          <p>Your pharmacy documents have been submitted for review. You will be notified once verified.</p>
          <button className="btn primary" onClick={() => setSubmitted(false)} style={{ marginTop: 16 }}>
            Submit Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <form className="verification-form" onSubmit={handleSubmit}>
      <h2>Pharmacy Verification</h2>
      <p className="hint">Please provide your pharmacy details and upload relevant documents for verification.</p>

      {error && <div className="error-banner" style={{ background: '#fee', color: '#c00', padding: '0.75rem 1rem', borderRadius: 8, marginBottom: '1rem' }}>{error}</div>}

      {/* Shop & Owner Information */}
      <fieldset style={{ border: '1px solid var(--color-border, #e0e0e0)', borderRadius: 10, padding: '1rem 1.25rem', marginBottom: '1.25rem' }}>
        <legend style={{ fontWeight: 600, padding: '0 0.5rem' }}>Shop & Owner Information</legend>
        <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <label className="field">
            <span>Shop Name <span style={{ color: 'red' }}>*</span></span>
            <input type="text" name="shopName" value={formData.shopName} onChange={handleChange} placeholder="MediCare Pharmacy" required />
          </label>
          <label className="field">
            <span>Owner Name <span style={{ color: 'red' }}>*</span></span>
            <input type="text" name="ownerName" value={formData.ownerName} onChange={handleChange} placeholder="John Doe" required />
          </label>
          <label className="field">
            <span>Phone Number <span style={{ color: 'red' }}>*</span></span>
            <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="+91 98765 43210" required />
          </label>
          <label className="field">
            <span>Email <span style={{ color: 'red' }}>*</span></span>
            <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="pharmacy@example.com" required />
          </label>
          <label className="field">
            <span>Years in Business</span>
            <input type="number" name="yearsInBusiness" value={formData.yearsInBusiness} onChange={handleChange} placeholder="5" min="0" />
          </label>
        </div>
      </fieldset>

      {/* License & Registration */}
      <fieldset style={{ border: '1px solid var(--color-border, #e0e0e0)', borderRadius: 10, padding: '1rem 1.25rem', marginBottom: '1.25rem' }}>
        <legend style={{ fontWeight: 600, padding: '0 0.5rem' }}>License & Registration</legend>
        <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <label className="field">
            <span>Drug License Number <span style={{ color: 'red' }}>*</span></span>
            <input type="text" name="licenseNumber" value={formData.licenseNumber} onChange={handleChange} placeholder="DL/2020/12345" required />
          </label>
          <label className="field">
            <span>GST Number</span>
            <input type="text" name="gstNumber" value={formData.gstNumber} onChange={handleChange} placeholder="22AAAAA0000A1Z5" />
          </label>
        </div>
      </fieldset>

      {/* Address */}
      <fieldset style={{ border: '1px solid var(--color-border, #e0e0e0)', borderRadius: 10, padding: '1rem 1.25rem', marginBottom: '1.25rem' }}>
        <legend style={{ fontWeight: 600, padding: '0 0.5rem' }}>Address</legend>
        <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <label className="field" style={{ gridColumn: '1 / -1' }}>
            <span>Street Address <span style={{ color: 'red' }}>*</span></span>
            <input type="text" name="address" value={formData.address} onChange={handleChange} placeholder="123 Main Street, Shop No. 5" required />
          </label>
          <label className="field">
            <span>City</span>
            <input type="text" name="city" value={formData.city} onChange={handleChange} placeholder="Mumbai" />
          </label>
          <label className="field">
            <span>State</span>
            <input type="text" name="state" value={formData.state} onChange={handleChange} placeholder="Maharashtra" />
          </label>
          <label className="field">
            <span>PIN Code</span>
            <input type="text" name="pincode" value={formData.pincode} onChange={handleChange} placeholder="400001" />
          </label>
        </div>
      </fieldset>

      {/* License Documents */}
      <fieldset style={{ border: '1px solid var(--color-border, #e0e0e0)', borderRadius: 10, padding: '1rem 1.25rem', marginBottom: '1.25rem' }}>
        <legend style={{ fontWeight: 600, padding: '0 0.5rem' }}>License Documents <span style={{ color: 'red' }}>*</span></legend>
        <p style={{ fontSize: 13, color: '#666', marginBottom: '0.75rem' }}>
          Upload a clear photo or scan of your drug license and any other required licenses. Framed photos are acceptable.
        </p>
        {licenses.map((lic, idx) => (
          <div key={lic.id} className="doc-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto auto', gap: '1rem', alignItems: 'end', marginBottom: '1rem' }}>
            <label className="field">
              <span>License Type</span>
              <input type="text" value={lic.name} onChange={e => updateLicense(lic.id, 'name', e.target.value)} placeholder="Drug License, Retail License, etc." style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #ccc', borderRadius: 6 }} />
            </label>
            <label className="field">
              <span>Upload Document</span>
              <input type="file" accept="image/*,.pdf" onChange={e => handleLicenseFile(lic.id, e.target.files?.[0])} style={{ width: '100%' }} />
            </label>
            {lic.preview ? (
              <div style={{ width: 60, height: 60, border: '1px solid #ccc', borderRadius: 6, overflow: 'hidden', flexShrink: 0 }}>
                <img src={lic.preview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ) : (
              <div style={{ width: 60, height: 60 }} />
            )}
            {licenses.length > 1 ? (
              <button type="button" className="btn secondary small" onClick={() => removeLicense(lic.id)} style={{ height: 36, whiteSpace: 'nowrap' }}>Remove</button>
            ) : (
              <div style={{ width: 70 }} />
            )}
          </div>
        ))}
        <button type="button" className="btn secondary" onClick={addLicense}>+ Add Another License</button>
      </fieldset>

      {/* Certificates Section */}
      <fieldset style={{ border: '1px solid var(--color-border, #e0e0e0)', borderRadius: 10, padding: '1rem 1.25rem', marginBottom: '1.25rem' }}>
        <legend style={{ fontWeight: 600, padding: '0 0.5rem' }}>Certificates &amp; Other Documents</legend>
        <p style={{ fontSize: 13, color: '#666', marginBottom: '0.75rem' }}>
          Upload any additional certificates like Pharmacist registration, GST certificate, or shop establishment certificate.
        </p>
        {certificates.map((cert, idx) => (
          <div key={cert.id} className="doc-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto auto', gap: '1rem', alignItems: 'end', marginBottom: '1rem' }}>
            <label className="field">
              <span>Certificate Name</span>
              <input type="text" value={cert.name} onChange={e => updateCertificate(cert.id, 'name', e.target.value)} placeholder="Pharmacist Cert, GST Cert, etc." style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #ccc', borderRadius: 6 }} />
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
