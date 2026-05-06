// AppointmentsListView.jsx
import './AppointmentsListView.css';

function AppointmentsListView({ appointments }) {
  if (!appointments || appointments.length === 0) {
    return (
      <div className="appointments-container">
        <h3 className="appointments-title">Scheduled Appointments</h3>
        <div className="appointments-empty">
          <p>No appointments scheduled yet.</p>
          <p>Click "Schedule Appointment" to book a service.</p>
        </div>
      </div>
    );
  }

  // Separate upcoming and past appointments
  const now = new Date();
  const upcoming = [];
  const past = [];

  appointments.forEach((appt) => {
    const apptDate = new Date(appt.scheduledAt);
    if (apptDate >= now) {
      upcoming.push(appt);
    } else {
      past.push(appt);
    }
  });

  // Sort by date
  upcoming.sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
  past.sort((a, b) => new Date(b.scheduledAt) - new Date(a.scheduledAt));

  const formatDateTime = (dateTimeStr) => {
    const date = new Date(dateTimeStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      meridiem: 'short',
    });
  };

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'status-pending';
      case 'confirmed':
        return 'status-confirmed';
      case 'completed':
        return 'status-completed';
      default:
        return 'status-pending';
    }
  };

  const renderAppointmentsList = (appts, title) => {
    if (appts.length === 0) return null;

    return (
      <div className="appointments-section">
        <h4 className="appointments-section-title">{title}</h4>
        <div className="appointments-list">
          {appts.map((appt) => (
            <div key={appt.appointmentId} className="appointment-card">
              <div className="appointment-header">
                <div className="appointment-vehicle">
                  <span className="appointment-service-type">{appt.serviceType}</span>
                  <span className="appointment-vehicle-name">{appt.vehicleDisplay}</span>
                </div>
                <span className={`appointment-status ${getStatusBadgeClass(appt.status)}`}>
                  {appt.status.charAt(0).toUpperCase() + appt.status.slice(1)}
                </span>
              </div>

              <div className="appointment-details">
                <div className="appointment-detail-row">
                  <span className="appointment-label">Date & Time:</span>
                  <span className="appointment-value">{formatDateTime(appt.scheduledAt)}</span>
                </div>

                {appt.mechanicName && (
                  <div className="appointment-detail-row">
                    <span className="appointment-label">Assigned Mechanic:</span>
                    <span className="appointment-value">{appt.mechanicName}</span>
                  </div>
                )}

                {appt.notes && (
                  <div className="appointment-detail-row">
                    <span className="appointment-label">Notes:</span>
                    <span className="appointment-value">{appt.notes}</span>
                  </div>
                )}

                <div className="appointment-detail-row">
                  <span className="appointment-label">Created:</span>
                  <span className="appointment-value">
                    {new Date(appt.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="appointments-container">
      <h3 className="appointments-title">Scheduled Appointments</h3>
      {renderAppointmentsList(upcoming, 'Upcoming')}
      {renderAppointmentsList(past, 'Past')}
    </div>
  );
}

export default AppointmentsListView;
