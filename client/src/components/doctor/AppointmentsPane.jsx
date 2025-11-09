import React from 'react';

export default function AppointmentsPane({
  appointmentRequests,
  upcoming,
  formatDate,
  compareDateTime,
  rejectRequest,
  acceptRequest
}) {
  return (
    <section className="appointments-pane">
      <h2>Appointments</h2>
      <div className="appt-header">
        <div className="stat-card pending">
          <div className="stat-value">{appointmentRequests.length}</div>
          <div className="stat-label">Pending requests</div>
        </div>
        <div className="stat-card upcoming">
          <div className="stat-value">{upcoming.length}</div>
          <div className="stat-label">Upcoming</div>
        </div>
      </div>
      <div className="appointments-sections">
        <div className="requests-section">
          <h3>Appointment Requests</h3>
          {appointmentRequests.length === 0 ? (
            <p className="empty">No pending requests.</p>
          ) : (
            <ul className="request-list">
              {appointmentRequests.sort(compareDateTime).map(req => (
                <li key={req._id || req.id} className="request-row">
                  <div className="info">
                    <div className="who">{req.patient || req.patientName || req.patientId || 'Patient'}</div>
                    <div className="meta">
                      <span className="when">{formatDate(req.date || req.appointmentDate)} • {req.time || req.appointmentTime || ''}</span>
                      {(req.reason || req.reasonForVisit) && <span className="dot">•</span>}
                      {(req.reason || req.reasonForVisit) && <span className="reason">{req.reason || req.reasonForVisit}</span>}
                    </div>
                  </div>
                  <div className="actions">
                    <button className="btn reject" onClick={() => rejectRequest(req._id || req.id)}>Reject</button>
                    <button className="btn accept" onClick={() => acceptRequest(req._id || req.id)}>Accept</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="upcoming-section">
          <h3>Upcoming Appointments</h3>
          {upcoming.length === 0 ? (
            <p className="empty">No upcoming appointments.</p>
          ) : (
            <ul className="upcoming-list">
              {upcoming.sort(compareDateTime).map(appt => (
                <li key={appt._id || appt.id} className="appt-card">
                  <div className="left">
                    <div className="date">{formatDate(appt.date || appt.appointmentDate)}</div>
                    <div className="time">{appt.time || appt.appointmentTime || ''}</div>
                  </div>
                  <div className="right">
                    <div className="patient">{appt.patient || appt.patientName || appt.patientId || 'Patient'}</div>
                    {(appt.reason || appt.reasonForVisit) && <div className="reason">{appt.reason || appt.reasonForVisit}</div>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );

  // no footer helpers
}
