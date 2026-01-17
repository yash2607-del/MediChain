import { useEffect, useMemo, useState } from 'react';
import { FaDownload, FaEye, FaTimes, FaCheckCircle, FaExclamationTriangle, FaShareAlt, FaLock, FaStore, FaCheck, FaCopy } from 'react-icons/fa';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import './Prescription-table.css';

export default function PrescriptionTable() {
  const [showModal, setShowModal] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [items, setItems] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  
  // OTP sharing state
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpData, setOtpData] = useState(null);
  const [sharingId, setSharingId] = useState(null);
  const [lockingId, setLockingId] = useState(null);
  
  // Pharmacy selector state
  const [showPharmacyModal, setShowPharmacyModal] = useState(false);
  const [pharmacies, setPharmacies] = useState([]);
  const [pharmaciesLoading, setPharmaciesLoading] = useState(false);
  const [selectedPharmacy, setSelectedPharmacy] = useState(null);
  const [pendingSharePrescription, setPendingSharePrescription] = useState(null);

  const session = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('session') || 'null') } catch { return null }
  }, []);
  const userEmail = session?.user?.profile?.email || session?.user?.email || '';

  useEffect(() => {
    const e = (userEmail || '').trim().toLowerCase();
    if (!e || !e.includes('@')) {
      setError('Your profile does not have a valid email. Please update your profile.');
      return;
    }
    const fetchHistory = async () => {
      setLoading(true);
      setError('');
      try {
        const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
        const url = `${base}/api/prescriptions?email=${encodeURIComponent(e)}`;
        const res = await fetch(url);
        const text = await res.text();
        let data = {};
        try { data = text ? JSON.parse(text) : {}; } catch { data = {}; }
        if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
        setItems(Array.isArray(data.items) ? data.items : []);
      } catch (err) {
        setError(err.message || 'Failed to load prescriptions');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [userEmail]);

  const handleView = async (prescription) => {
    setDetailError('');
    setDetailLoading(true);
    setShowModal(true);
    try {
      const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
      const url = `${base}/api/prescriptions/${encodeURIComponent(prescription._id)}`;
      const res = await fetch(url);
      const text = await res.text();
      let data = {};
      try { data = text ? JSON.parse(text) : {}; } catch { data = {}; }
      if (!res.ok && res.status !== 409) throw new Error(data.error || `HTTP ${res.status}`);
      const merged = {
        ok: !!data.ok,
        verified: data.verified === true,
        reason: data.reason || null,
        id: data.id,
        storedHash: data.storedHash,
        computedHash: data.computedHash,
        onChainVerified: typeof data.onChainVerified === 'boolean' ? data.onChainVerified : null,
        canonical: data.canonical,
        doc: data.doc || null
      };
      setSelectedPrescription(merged);
    } catch (err) {
      setDetailError(err.message || 'Failed to load prescription details');
      setSelectedPrescription(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDownload = async (prescription) => {
    try {
      let prescriptionData = prescription;
      let verified = prescription.verified === true;
      let storedHash = prescription.storedHash || null;
      
      // If we don't have full details, fetch them
      if (!prescription.medicines && !prescription.doc) {
        const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
        const url = `${base}/api/prescriptions/${encodeURIComponent(prescription._id)}`;
        const res = await fetch(url);
        const text = await res.text();
        let data = {};
        try { data = text ? JSON.parse(text) : {}; } catch { data = {}; }
        if (res.ok) {
          prescriptionData = data.doc || prescription;
          if (typeof data.verified === 'boolean') verified = data.verified;
          if (data.storedHash) storedHash = data.storedHash;
        }
      } else if (prescription.doc) {
        prescriptionData = prescription.doc;
        if (typeof prescription.verified === 'boolean') verified = prescription.verified;
        if (prescription.storedHash) storedHash = prescription.storedHash;
      }

      // Create PDF
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      // Header
      doc.setFillColor(16, 185, 129);
      doc.rect(0, 0, pageWidth, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont(undefined, 'bold');
      doc.text('PRESCRIPTION', pageWidth / 2, 20, { align: 'center' });
      
      doc.setFontSize(12);
      doc.setFont(undefined, 'normal');
      doc.text('MediChain - Blockchain Verified', pageWidth / 2, 30, { align: 'center' });
      
      // Reset text color
      doc.setTextColor(0, 0, 0);
      
      let yPos = 55;
      
      // Prescription ID
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text('Prescription ID:', 20, yPos);
      doc.setFont(undefined, 'normal');
      doc.text(prescriptionData._id || 'N/A', 70, yPos);
      
      yPos += 10;
      
      // Date
      doc.setFont(undefined, 'bold');
      doc.text('Date:', 20, yPos);
      doc.setFont(undefined, 'normal');
      const dateStr = prescriptionData.createdAt 
        ? new Date(prescriptionData.createdAt).toLocaleDateString('en-US', { 
            year: 'numeric', month: 'long', day: 'numeric' 
          })
        : 'N/A';
      doc.text(dateStr, 70, yPos);
      
      yPos += 10;
      
      // Doctor Name
      doc.setFont(undefined, 'bold');
      doc.text('Doctor:', 20, yPos);
      doc.setFont(undefined, 'normal');
      doc.text(prescriptionData.doctorName || prescriptionData.doctor?.name || 'N/A', 70, yPos);
      
      yPos += 10;
      
      // Patient Email
      doc.setFont(undefined, 'bold');
      doc.text('Patient:', 20, yPos);
      doc.setFont(undefined, 'normal');
      doc.text(prescriptionData.patientEmail || userEmail || 'N/A', 70, yPos);
      
      yPos += 15;
      
      // Diagnosis/Notes
      if (prescriptionData.notes) {
        doc.setFont(undefined, 'bold');
        doc.text('Diagnosis:', 20, yPos);
        yPos += 7;
        doc.setFont(undefined, 'normal');
        const splitNotes = doc.splitTextToSize(prescriptionData.notes, pageWidth - 40);
        doc.text(splitNotes, 20, yPos);
        yPos += splitNotes.length * 5 + 10;
      }
      
      // Medicines Table
      if (prescriptionData.medicines && prescriptionData.medicines.length > 0) {
        doc.setFont(undefined, 'bold');
        doc.setFontSize(14);
        doc.text('Prescribed Medicines', 20, yPos);
        yPos += 10;
        
        const tableData = prescriptionData.medicines.map((med, idx) => [
          idx + 1,
          med.name || 'N/A',
          med.dosageValue && med.dosageUnit 
            ? `${med.dosageValue} ${med.dosageUnit}` 
            : med.dosageValue || 'N/A',
          typeof med.timesPerDay === 'number' ? `${med.timesPerDay}x/day` : 'N/A',
          typeof med.totalDays === 'number' ? `${med.totalDays} days` : 'N/A'
        ]);
        
        doc.autoTable({
          startY: yPos,
          head: [['#', 'Medicine Name', 'Dosage', 'Frequency', 'Duration']],
          body: tableData,
          theme: 'grid',
          headStyles: { fillColor: [16, 185, 129], textColor: 255 },
          styles: { fontSize: 10 },
          margin: { left: 20, right: 20 }
        });
        
        yPos = doc.lastAutoTable.finalY + 15;
      }
      
      // Verification Status
      if (yPos + 30 > pageHeight) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text('Blockchain Verification:', 20, yPos);
      yPos += 7;
      
      doc.setFont(undefined, 'normal');
      const verificationText = verified
        ? 'This prescription has been verified and is authentic.' 
        : 'Verification status: Pending or Tampered';
      doc.text(verificationText, 20, yPos);
      
      if (storedHash) {
        yPos += 7;
        doc.setFontSize(8);
        doc.text(`Hash: ${storedHash.substring(0, 50)}...`, 20, yPos);
      }
      
      // Footer
      const footerY = pageHeight - 20;
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text('Generated by MediChain - Secure Prescription Management', pageWidth / 2, footerY, { align: 'center' });
      doc.text(`Generated on: ${new Date().toLocaleString()}`, pageWidth / 2, footerY + 5, { align: 'center' });
      
      // Save PDF
      const fileName = `Prescription_${prescriptionData._id || 'download'}.pdf`;
      doc.save(fileName);
      
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  // Share prescription - First show pharmacy selector
  const handleShare = async (prescription) => {
    const id = prescription._id;
    setSharingId(id);
    setPendingSharePrescription(prescription);
    setPharmaciesLoading(true);
    setPharmacies([]);
    setSelectedPharmacy(null);
    setShowPharmacyModal(true);
    
    try {
      const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
      const res = await fetch(`${base}/api/prescriptions/${id}/pharmacies`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch pharmacies');
      
      setPharmacies(data.pharmacies || []);
    } catch (err) {
      setError(err.message || 'Failed to load pharmacies');
      setShowPharmacyModal(false);
    } finally {
      setPharmaciesLoading(false);
      setSharingId(null);
    }
  };

  // Confirm share with selected pharmacy - Generate OTP
  const confirmShare = async () => {
    if (!pendingSharePrescription) return;
    
    const id = pendingSharePrescription._id;
    try {
      const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
      const res = await fetch(`${base}/api/prescriptions/${id}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pharmacyId: selectedPharmacy?._id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate OTP');
      
      setOtpData({ 
        prescriptionId: id, 
        otp: data.otp, 
        expiresAt: data.expiresAt,
        pharmacy: selectedPharmacy
      });
      setShowPharmacyModal(false);
      setShowOtpModal(true);
      
      // Update item's lock status in list
      setItems(prev => prev.map(p => 
        p._id === id ? { ...p, isLocked: false } : p
      ));
    } catch (err) {
      setError(err.message || 'Failed to share prescription');
    }
  };

  const closePharmacyModal = () => {
    setShowPharmacyModal(false);
    setPendingSharePrescription(null);
    setSelectedPharmacy(null);
    setPharmacies([]);
  };

  // Lock prescription - Revoke pharmacy access
  const handleLock = async (prescription) => {
    const id = prescription._id;
    setLockingId(id);
    try {
      const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
      const res = await fetch(`${base}/api/prescriptions/${id}/lock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to lock prescription');
      
      // Update item's lock status in list
      setItems(prev => prev.map(p => 
        p._id === id ? { ...p, isLocked: true } : p
      ));
    } catch (err) {
      setError(err.message || 'Failed to lock prescription');
    } finally {
      setLockingId(null);
    }
  };

  // Copy OTP to clipboard
  const copyOtp = () => {
    if (otpData?.otp) {
      navigator.clipboard.writeText(otpData.otp);
      alert('OTP copied to clipboard!');
    }
  };

  const closeOtpModal = () => {
    setShowOtpModal(false);
    setOtpData(null);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedPrescription(null);
  };

  return (
    <div className="prescription-table-container">
      <div className="table-header">
        <h1>My Prescriptions</h1>
        <p>View and download your prescription history</p>
      </div>

      <div className="table-wrapper">
        <table className="prescription-table">
          <thead>
            <tr>
              <th>S.No</th>
              <th>Doctor Name</th>
              <th>Prescription ID</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5}>
                  <div className="loading-row">Loading prescriptions...</div>
                </td>
              </tr>
            )}

            {!!error && !loading && (
              <tr>
                <td colSpan={5}>
                  <div className="error-row">{error}</div>
                </td>
              </tr>
            )}

            {!loading && !error && items.length === 0 && (
              <tr>
                <td colSpan={5}>
                  <div className="empty-row">No prescriptions found.</div>
                </td>
              </tr>
            )}

            {!loading && !error && items.map((p, index) => (
              <tr key={p._id}>
                <td>{index + 1}</td>
                <td>
                  <div className="doctor-cell">
                    <span className="doctor-name">{p.doctorName || p.doctor?.name || '—'}</span>
                  </div>
                </td>
                <td>
                  <span className="prescription-id">{p._id}</span>
                </td>
                <td>
                  <span className="date">{p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric', month: 'short', day: 'numeric'
                  }) : '—'}</span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button
                      className="btn-view"
                      onClick={() => handleView(p)}
                      title="View Details"
                    >
                      <FaEye /> View
                    </button>
                    <button
                      className="btn-download"
                      onClick={() => handleDownload(p)}
                      title="Download Prescription"
                    >
                      <FaDownload />
                    </button>
                    {/* Share button - generates OTP for pharmacy */}
                    <button
                      className="btn-share"
                      onClick={() => handleShare(p)}
                      disabled={sharingId === p._id}
                      title="Share with Pharmacy (Generate OTP)"
                    >
                      <FaShareAlt /> {sharingId === p._id ? '...' : 'Share'}
                    </button>
                    {/* Make Private / Lock button */}
                    {p.isLocked === false ? (
                      <button
                        className="btn-lock"
                        onClick={() => handleLock(p)}
                        disabled={lockingId === p._id}
                        title="Make Private (Revoke Pharmacy Access)"
                      >
                        <FaLock /> {lockingId === p._id ? '...' : 'Private'}
                      </button>
                    ) : (
                      <span className="status-private" title="This prescription is private">
                        <FaLock /> Private
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pharmacy Selector Modal */}
      {showPharmacyModal && (
        <div className="modal-overlay" onClick={closePharmacyModal}>
          <div className="modal-content pharmacy-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '550px' }}>
            <div className="modal-header">
              <h2><FaStore style={{ marginRight: '0.5rem' }} /> Select Pharmacy</h2>
              <button className="modal-close" onClick={closePharmacyModal}>
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              {pharmaciesLoading ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                  Loading pharmacies...
                </div>
              ) : pharmacies.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                  <FaExclamationTriangle style={{ fontSize: '2rem', color: '#f59e0b', marginBottom: '1rem' }} />
                  <p>No pharmacies registered in the system yet.</p>
                </div>
              ) : (
                <>
                  <p style={{ marginBottom: '1rem', color: '#666', fontSize: '0.9rem' }}>
                    Select a pharmacy to share your prescription with:
                  </p>
                  <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                    {pharmacies.map((pharmacy) => (
                      <div
                        key={pharmacy._id}
                        onClick={() => setSelectedPharmacy(pharmacy)}
                        style={{
                          padding: '1rem',
                          border: selectedPharmacy?._id === pharmacy._id 
                            ? '2px solid #3b82f6' 
                            : '1px solid #e5e7eb',
                          borderRadius: '10px',
                          marginBottom: '0.75rem',
                          cursor: 'pointer',
                          background: selectedPharmacy?._id === pharmacy._id 
                            ? '#f0f9ff' 
                            : '#fff',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ 
                              fontWeight: '600', 
                              color: '#1f2937',
                              fontSize: '1rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem'
                            }}>
                              <FaStore style={{ color: '#3b82f6' }} />
                              {pharmacy.name}
                            </div>
                            <div style={{ 
                              fontSize: '0.8rem', 
                              color: '#6b7280',
                              marginTop: '0.25rem',
                              paddingLeft: '1.5rem'
                            }}>
                              {pharmacy.address}
                            </div>
                          </div>
                          <div style={{ 
                            textAlign: 'right',
                            flexShrink: 0,
                            marginLeft: '1rem'
                          }}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              padding: '0.3rem 0.6rem',
                              borderRadius: '20px',
                              fontSize: '0.8rem',
                              fontWeight: '600',
                              background: pharmacy.hasNoMedicines ? '#fee2e2' : (pharmacy.hasAllMedicines ? '#dcfce7' : '#fef3c7'),
                              color: pharmacy.hasNoMedicines ? '#dc2626' : (pharmacy.hasAllMedicines ? '#166534' : '#92400e')
                            }}>
                              {pharmacy.hasNoMedicines ? <FaTimes /> : (pharmacy.hasAllMedicines ? <FaCheck /> : <FaExclamationTriangle />)}
                              {pharmacy.availabilityText}
                            </span>
                            {!pharmacy.hasAllMedicines && pharmacy.unavailableMedicines?.length > 0 && (
                              <div style={{ 
                                fontSize: '0.7rem', 
                                color: '#ef4444',
                                marginTop: '0.3rem'
                              }}>
                                Missing: {pharmacy.unavailableMedicines.slice(0, 2).join(', ')}
                                {pharmacy.unavailableMedicines.length > 2 && '...'}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
            {pharmacies.length > 0 && (
              <div className="modal-footer" style={{ 
                display: 'flex', 
                gap: '0.75rem', 
                justifyContent: 'flex-end',
                borderTop: '1px solid #e5e7eb',
                paddingTop: '1rem',
                marginTop: '1rem'
              }}>
                <button 
                  className="btn-lock"
                  onClick={closePharmacyModal}
                  style={{ background: '#e5e7eb', color: '#374151' }}
                >
                  Cancel
                </button>
                <button 
                  className="btn-share"
                  onClick={confirmShare}
                  disabled={!selectedPharmacy}
                  style={{ opacity: selectedPharmacy ? 1 : 0.5 }}
                >
                  <FaShareAlt /> Generate OTP
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* OTP Share Modal */}
      {showOtpModal && otpData && (
        <div className="modal-overlay" onClick={closeOtpModal}>
          <div className="modal-content otp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2><FaShareAlt style={{ marginRight: '0.5rem' }} /> Share Prescription</h2>
              <button className="modal-close" onClick={closeOtpModal}>
                <FaTimes />
              </button>
            </div>
            <div className="modal-body" style={{ textAlign: 'center' }}>
              {otpData.pharmacy && (
                <div style={{ 
                  background: '#f0f9ff', 
                  border: '1px solid #bfdbfe',
                  borderRadius: '8px', 
                  padding: '0.75rem',
                  marginBottom: '1rem',
                  textAlign: 'left'
                }}>
                  <div style={{ fontSize: '0.85rem', color: '#1e40af', fontWeight: '600' }}>
                    <FaStore style={{ marginRight: '0.4rem' }} />
                    {otpData.pharmacy.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                    {otpData.pharmacy.address}
                  </div>
                </div>
              )}
              <p style={{ marginBottom: '1rem', color: '#666' }}>
                Share this <strong>4-digit OTP</strong> with the pharmacy to allow them to view your prescription.
              </p>
              <div style={{ 
                fontSize: '3rem', 
                fontWeight: 'bold', 
                letterSpacing: '1rem',
                background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                border: '3px dashed #3b82f6',
                borderRadius: '16px',
                padding: '1.5rem 2rem',
                marginBottom: '1.5rem',
                color: '#1e40af',
                fontFamily: 'monospace'
              }}>
                {otpData.otp}
              </div>
              <button 
                className="btn-view" 
                onClick={copyOtp}
                style={{ marginBottom: '1rem', padding: '0.75rem 1.5rem' }}
              >
                <FaCopy /> Copy OTP
              </button>
              <div style={{ 
                background: '#fef3c7', 
                border: '1px solid #f59e0b', 
                borderRadius: '8px', 
                padding: '0.75rem', 
                marginTop: '1rem' 
              }}>
                <p style={{ fontSize: '0.85rem', color: '#92400e', margin: 0 }}>
                  ⏱️ Expires at <strong>{new Date(otpData.expiresAt).toLocaleTimeString()}</strong>
                </p>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#888', marginTop: '1rem' }}>
                <FaLock style={{ marginRight: '0.3rem' }} />
                Prescription will automatically become private after billing.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Prescription Details</h2>
              <button className="modal-close" onClick={closeModal}>
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              {detailLoading && (
                <div className="loading-row">Loading details...</div>
              )}

              {detailError && !detailLoading && (
                <div className="error-row">{detailError}</div>
              )}

              {selectedPrescription && selectedPrescription.doc && !detailLoading && (
                <>
                  <div className="detail-row">
                    <span className="detail-label">Verification:</span>
                    <span className="detail-value">
                      {selectedPrescription.verified ? (
                        <span style={{ color: '#10b981', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          <FaCheckCircle /> Verified
                        </span>
                      ) : (
                        <span style={{ color: '#ef4444', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          <FaExclamationTriangle /> Tampered
                        </span>
                      )}
                      {typeof selectedPrescription.onChainVerified === 'boolean' && (
                        <> — Blockchain: {selectedPrescription.onChainVerified ? 'present' : 'not found'}</>
                      )}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Prescription ID:</span>
                    <span className="detail-value">{selectedPrescription.id || selectedPrescription.doc._id}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Doctor:</span>
                    <span className="detail-value">{selectedPrescription.doc.doctorName || selectedPrescription.doc.doctor?.name || '—'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Date:</span>
                    <span className="detail-value">{selectedPrescription.doc.createdAt ? new Date(selectedPrescription.doc.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}</span>
                  </div>
                  {selectedPrescription.doc.notes && (
                    <div className="detail-row">
                      <span className="detail-label">Diagnosis:</span>
                      <span className="detail-value">{selectedPrescription.doc.notes}</span>
                    </div>
                  )}
                  <div className="detail-section">
                    <h3>Prescribed Medicines</h3>
                    <ul className="medicines-list">
                      {(selectedPrescription.doc.medicines || []).map((m, idx) => (
                        <li key={idx}>
                          {m.name}
                          {m.dosageValue ? ` — ${m.dosageValue}${m.dosageUnit ? ' ' + m.dosageUnit : ''}` : ''}
                          {typeof m.timesPerDay === 'number' ? ` — ${m.timesPerDay}x/day` : ''}
                          {typeof m.totalDays === 'number' ? ` for ${m.totalDays} days` : ''}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="detail-section">
                    <h3>Technical Details</h3>
                    <p><strong>Stored Hash:</strong> {selectedPrescription.storedHash || '—'}</p>
                    <p><strong>Computed Hash:</strong> {selectedPrescription.computedHash || '—'}</p>
                    {selectedPrescription.reason && (
                      <p><strong>Reason:</strong> {selectedPrescription.reason}</p>
                    )}
                  </div>
                </>
              )}
            </div>
            <div className="modal-footer">
              <button 
                className="btn-download"
                onClick={() => handleDownload(selectedPrescription || {})}
              >
                <FaDownload /> Download Prescription
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}