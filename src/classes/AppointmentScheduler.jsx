// AppointmentScheduler.jsx
import { useState, useEffect } from 'react';
import './Popup.css';

function AppointmentScheduler({ customerId, vehicles, mechanics, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    vehicleId: '',
    selectedDate: '',
    selectedTime: '',
    serviceType: '',
    preferredMechanicId: '',
    notes: '',
  });

  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [slotsLoading, setSlotsLoading] = useState(true);

  const serviceTypes = [
    'Oil Change',
    'Inspection',
    'Tire Service',
    'Brake Service',
    'A/C Service',
    'Battery Service',
    'Fluid Flush',
    'Other',
  ];

  // Load available slots on component mount
  useEffect(() => {
    const fetchSlots = async () => {
      try {
        const res = await fetch('/api/appointments/available-slots');
        if (!res.ok) {
          throw new Error('Failed to load available slots');
        }
        const data = await res.json();
        if (data.ok && data.availableSlots) {
          setAvailableSlots(data.availableSlots);
        }
      } catch (err) {
        console.error('Failed to load available slots:', err);
      } finally {
        setSlotsLoading(false);
      }
    };

    fetchSlots();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      selectedTime: name === 'selectedDate' ? '' : prev.selectedTime,
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.vehicleId || !formData.selectedDate || !formData.selectedTime || !formData.serviceType) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      // Find the selected time slot to get the ISO datetime
      const selectedSlot = availableSlots.find(
        (slot) => slot.date === formData.selectedDate && slot.time === formData.selectedTime
      );

      if (!selectedSlot) {
        setError('Invalid time slot selected');
        setLoading(false);
        return;
      }

      const payload = {
        vehicleId: Number(formData.vehicleId),
        scheduledAt: selectedSlot.dateTime,
        serviceType: formData.serviceType,
        notes: formData.notes,
      };

      if (formData.preferredMechanicId) {
        payload.preferredMechanicId = Number(formData.preferredMechanicId);
      }

      const res = await fetch(`/api/customers/${customerId}/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!data.ok) {
        setError(data.msg || 'Failed to schedule appointment');
        setLoading(false);
        return;
      }

      onSuccess?.();
    } catch (err) {
      setError(err.message || 'An error occurred');
      setLoading(false);
    }
  };

  const filteredSlots = formData.selectedDate
    ? availableSlots.filter((slot) => slot.date === formData.selectedDate)
    : [];

  // Get unique dates from available slots for display
  const uniqueDates = availableSlots.length > 0
    ? [...new Set(availableSlots.map((s) => s.date))].sort()
    : [];

  return (
    <div className="popup-overlay" onClick={onClose}>
      <div className="popup-card" onClick={(e) => e.stopPropagation()}>
        <div className="popup-header">
          <h2>Schedule Appointment</h2>
          <p className="popup-subtitle">Select a date and time for your vehicle service</p>
        </div>

        <form onSubmit={handleSubmit} className="popup-form">
          {error && <div className="popup-error">{error}</div>}

          {/* Vehicle Selection */}
          <div className="popup-field">
            <label className="popup-label">Vehicle *</label>
            <select
              name="vehicleId"
              value={formData.vehicleId}
              onChange={handleChange}
              className="popup-input"
            >
              <option value="">Select a vehicle</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.year} {v.make} {v.model} ({v.plate})
                </option>
              ))}
            </select>
          </div>

          {/* Service Type */}
          <div className="popup-field">
            <label className="popup-label">Service Type *</label>
            <select
              name="serviceType"
              value={formData.serviceType}
              onChange={handleChange}
              className="popup-input"
            >
              <option value="">Select service type</option>
              {serviceTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Date Selection */}
          <div className="popup-field">
            <label className="popup-label">Appointment Date *</label>
            <select
              name="selectedDate"
              value={formData.selectedDate}
              onChange={handleChange}
              className="popup-input"
              disabled={slotsLoading || availableSlots.length === 0}
            >
              <option value="">
                {slotsLoading ? 'Loading dates...' : availableSlots.length === 0 ? 'No available dates' : 'Select a date'}
              </option>
              {uniqueDates.map((date) => {
                const dateObj = new Date(date);
                const formatted = dateObj.toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                });
                return (
                  <option key={date} value={date}>
                    {formatted}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Time Selection */}
          <div className="popup-field">
            <label className="popup-label">Appointment Time *</label>
            <select
              name="selectedTime"
              value={formData.selectedTime}
              onChange={handleChange}
              className="popup-input"
              disabled={filteredSlots.length === 0}
            >
              <option value="">
                {formData.selectedDate ? (filteredSlots.length === 0 ? 'No available times' : 'Select a time') : 'Select date first'}
              </option>
              {filteredSlots.map((slot) => (
                <option key={slot.dateTime} value={slot.time}>
                  {slot.time} 
                  {slot.mechanics && slot.mechanics.length > 0
                    ? ` (${Math.min(...slot.mechanics.map((m) => m.activeJobCount))} mechanics available)`
                    : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Preferred Mechanic */}
          <div className="popup-field">
            <label className="popup-label">Preferred Mechanic (Optional)</label>
            <select
              name="preferredMechanicId"
              value={formData.preferredMechanicId}
              onChange={handleChange}
              className="popup-input"
            >
              <option value="">No preference - auto-assign</option>
              {mechanics.map((m) => (
                <option key={m.mechanicId} value={m.mechanicId}>
                  {m.name} ({m.assignedJobs?.length || 0} active jobs)
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div className="popup-field">
            <label className="popup-label">Additional Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              className="popup-input popup-textarea"
              placeholder="Any additional details or special requests?"
              rows="3"
              style={{ resize: 'vertical', fontFamily: 'inherit' }}
            />
          </div>

          {/* Actions */}
          <div className="popup-actions">
            <button type="button" className="popup-btn popup-btn-cancel" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="popup-btn popup-btn-primary" disabled={loading}>
              {loading ? 'Scheduling...' : 'Schedule Appointment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AppointmentScheduler;
