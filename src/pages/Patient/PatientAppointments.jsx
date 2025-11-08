import { useState } from 'react';
import { FaPhoneAlt, FaTimes } from 'react-icons/fa';
import './PatientAppointments.css';

export default function PatientAppointments() {
  // Dummy pending appointments data
  const pendingAppointments = [
    {
      id: 1,
      doctorName: 'Dr. Arjun Mehta',
      speciality: 'Cardiology',
      date: '2024-11-11',
      time: '10:30',
      reason: 'Heart checkup',
      phone: '+1 (555) 123-4567',
      clinic: 'City Heart Clinic'
    },
    {
      id: 2,
      doctorName: 'Dr. Sanya Kapoor',
      speciality: 'Dermatology',
      date: '2024-11-11',
      time: '12:00',
      reason: 'Skin consultation',
      phone: '+1 (555) 234-5678',
      clinic: 'Skin Care Center'
    },
    {
      id: 3,
      doctorName: 'Dr. Ishaan Rao',
      speciality: 'Orthopaedics',
      date: '2024-11-12',
      time: '09:15',
      reason: 'Follow-up',
      phone: '+1 (555) 345-6789',
      clinic: 'Bone & Joint Hospital'
    }
  ];

  // Dummy confirmed appointments data
  const confirmedAppointments = [
    {
      id: 4,
      doctorName: 'Dr. Neha Iyer',
      speciality: 'Allergy',
      date: '2024-11-10',
      time: '16:00',
      reason: 'Allergy testing',
      phone: '+1 (555) 456-7890',
      clinic: 'Allergy Specialists'
    },
    {
      id: 5,
      doctorName: 'Dr. Kabir Khan',
      speciality: 'General Medicine',
      date: '2024-11-11',
      time: '09:00',
      reason: 'Annual physical',
      phone: '+1 (555) 567-8901',
      clinic: 'Health Plus Clinic'
    }
  ];

  const handleCallClinic = (phone) => {
    window.location.href = `tel:${phone}`;
  };

  const handleCancel = (appointment) => {
    if (confirm(`Are you sure you want to cancel your appointment with ${appointment.doctorName}?`)) {
      alert(`Appointment with ${appointment.doctorName} has been cancelled.`);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="patient-appointments-container">
      <div className="appointments-header">
        <h1>My Appointments</h1>
      </div>

      <div className="appointments-stats">
        <div className="stat-box pending">
          <div className="stat-number">{pendingAppointments.length}</div>
          <div className="stat-label">PENDING</div>
        </div>
        <div className="stat-box confirmed">
          <div className="stat-number">{confirmedAppointments.length}</div>
          <div className="stat-label">CONFIRMED</div>
        </div>
      </div>

      <div className="appointments-sections">
        {/* Pending Appointments Section */}
        <div className="pending-section">
          <h2>Pending Appointments</h2>
          {pendingAppointments.length === 0 ? (
            <p className="empty-message">No pending appointments.</p>
          ) : (
            <div className="appointments-list">
              {pendingAppointments.map((appointment) => (
                <div key={appointment.id} className="appointment-card pending">
                  <div className="appointment-info">
                    <div className="doctor-details">
                      <div className="doctor-name">{appointment.doctorName}</div>
                      <div className="doctor-speciality">{appointment.speciality}</div>
                    </div>
                    <div className="appointment-meta">
                      <div className="meta-item">
                        <strong>Date:</strong> {formatDate(appointment.date)}
                      </div>
                      <div className="meta-item">
                        <strong>Time:</strong> {appointment.time}
                      </div>
                      <div className="meta-item">
                        <strong>Clinic:</strong> {appointment.clinic}
                      </div>
                      <div className="meta-item">
                        <strong>Reason:</strong> {appointment.reason}
                      </div>
                    </div>
                  </div>
                  <div className="appointment-actions">
                    <button 
                      className="btn-call"
                      onClick={() => handleCallClinic(appointment.phone)}
                    >
                      <FaPhoneAlt /> Call
                    </button>
                    <button 
                      className="btn-cancel"
                      onClick={() => handleCancel(appointment)}
                    >
                      <FaTimes /> Cancel
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Confirmed Appointments Section */}
        <div className="confirmed-section">
          <h2>Confirmed Appointments</h2>
          {confirmedAppointments.length === 0 ? (
            <p className="empty-message">No confirmed appointments.</p>
          ) : (
            <div className="appointments-list">
              {confirmedAppointments.map((appointment) => (
                <div key={appointment.id} className="appointment-card confirmed">
                  <div className="appointment-info">
                    <div className="doctor-details">
                      <div className="doctor-name">{appointment.doctorName}</div>
                      <div className="doctor-speciality">{appointment.speciality}</div>
                    </div>
                    <div className="appointment-meta">
                      <div className="meta-item">
                        <strong>Date:</strong> {formatDate(appointment.date)}
                      </div>
                      <div className="meta-item">
                        <strong>Time:</strong> {appointment.time}
                      </div>
                      <div className="meta-item">
                        <strong>Clinic:</strong> {appointment.clinic}
                      </div>
                      <div className="meta-item">
                        <strong>Reason:</strong> {appointment.reason}
                      </div>
                    </div>
                  </div>
                  <div className="appointment-actions">
                    <button 
                      className="btn-call"
                      onClick={() => handleCallClinic(appointment.phone)}
                    >
                      <FaPhoneAlt /> Call
                    </button>
                    <button 
                      className="btn-cancel"
                      onClick={() => handleCancel(appointment)}
                    >
                      <FaTimes /> Cancel
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
