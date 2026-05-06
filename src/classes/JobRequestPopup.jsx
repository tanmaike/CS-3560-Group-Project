// JobRequestPopup.jsx
import { useState, useEffect } from 'react';
import './Popup.css';

function JobRequestPopup({ customerID, customerName, onClose, onSuccess }) {
    const [vehicles, setVehicles] = useState([]);
    const [formData, setFormData] = useState({
        vehicleId: '',
        issue: '',
        estimatedCost: '',
        priority: 'medium',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetch(`/api/customers/${customerID}/vehicles`)
            .then(r => r.json())
            .then(data => setVehicles(data.vehicles || []))
            .catch(() => setError('Could not load vehicles'));
    }, [customerID]);

    const selectedVehicle = vehicles.find(v => v.id === Number(formData.vehicleId));

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedVehicle) {
            setError('Please select a vehicle.');
            return;
        }
        if (!formData.issue.trim()) {
            setError('Please describe the issue.');
            return;
        }
        setLoading(true);
        setError('');

        const vehicleDescription = `${selectedVehicle.year} ${selectedVehicle.make} ${selectedVehicle.model}`;
        const plateInfo = selectedVehicle.plate ? ` (${selectedVehicle.plate})` : '';

        try {
            // 1. Create the service request (for customer's history)
            const srRes = await fetch(`/api/customers/${customerID}/service-requests`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    vehicle_id: selectedVehicle.id,
                    vehicle_txt: vehicleDescription,
                    issue_txt: formData.issue.trim(),
                    est_cost: Number(formData.estimatedCost) || 0,
                }),
            });

            const srData = await srRes.json();
            if (!srRes.ok) {
                console.log('Service request response:', srData);
                // Continue anyway - job creation is more important
            }

            // 2. Also create a job (for manager/mechanic to see)
            const jobRes = await fetch('/api/jobs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title_txt: formData.issue.trim(),
                    customer_nm: customerName,
                    vehicle_txt: vehicleDescription + plateInfo,
                    vehicle_id: selectedVehicle.id,
                    status_txt: 'pending',
                    priority_txt: formData.priority,
                    diag_code: 'new_ticket',
                    est_cost: Number(formData.estimatedCost) || 0,
                }),
            });

            const jobData = await jobRes.json();
            console.log('Job creation response:', jobData);

            if (!jobRes.ok) {
                throw new Error('Failed to create job: ' + (jobData.msg || 'Unknown error'));
            }

            onSuccess?.();
            onClose();
        } catch (err) {
            console.error('Submit error:', err);
            setError(err.message || 'Error creating request. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Common vehicle issues for quick selection
    const commonIssues = [
        'Oil Change',
        'Brake Inspection',
        'Check Engine Light',
        'Tire Rotation',
        'Transmission Issue',
        'A/C Not Working',
        'Strange Noise',
        'Engine Diagnostic',
        'Scheduled Maintenance',
        'Other',
    ];

    return (
        <div className="popup-overlay" onClick={onClose}>
            <div className="popup-card" onClick={e => e.stopPropagation()}>
                <div className="popup-header">
                    <h2>🔧 Request a Job</h2>
                    <p className="popup-subtitle">Submit a new service request for your vehicle</p>
                </div>

                <form onSubmit={handleSubmit} className="popup-form">
                    {error && <div className="popup-error">{error}</div>}

                    <div className="popup-field">
                        <label className="popup-label">Select Vehicle</label>
                        <select
                            name="vehicleId"
                            className="popup-input popup-select"
                            value={formData.vehicleId}
                            onChange={handleChange}
                        >
                            <option value="">-- Choose a vehicle --</option>
                            {vehicles.map(v => (
                                <option key={v.id} value={v.id}>
                                    {v.year} {v.make} {v.model} ({v.plate})
                                </option>
                            ))}
                        </select>
                        {vehicles.length === 0 && (
                            <p className="popup-hint">No vehicles registered yet. Add one first!</p>
                        )}
                    </div>

                    {selectedVehicle && (
                        <div className="popup-vehicle-preview">
                            <span className="popup-vehicle-icon">🚗</span>
                            <div>
                                <p className="popup-vehicle-name">
                                    {selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}
                                </p>
                                <p className="popup-vehicle-detail">
                                    Plate: {selectedVehicle.plate} • Status: {selectedVehicle.status}
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="popup-field">
                        <label className="popup-label">Common Issues</label>
                        <div className="popup-issue-chips">
                            {commonIssues.map(issue => (
                                <button
                                    key={issue}
                                    type="button"
                                    className={`popup-chip ${formData.issue === issue ? 'popup-chip-active' : ''}`}
                                    onClick={() => setFormData(prev => ({ ...prev, issue: issue === 'Other' ? '' : issue }))}
                                >
                                    {issue}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="popup-field">
                        <label className="popup-label">Describe the Issue</label>
                        <textarea
                            name="issue"
                            className="popup-input popup-textarea"
                            placeholder="Tell us what's going on with your vehicle..."
                            value={formData.issue}
                            onChange={handleChange}
                            rows={3}
                        />
                    </div>

                    <div className="popup-field">
                        <label className="popup-label">Priority Level</label>
                        <div className="popup-priority-selector">
                            {[
                                { value: 'low', label: '🟢 Low', desc: 'Routine maintenance' },
                                { value: 'medium', label: '🟡 Medium', desc: 'Minor issues' },
                                { value: 'high', label: '🔴 High', desc: 'Urgent repair needed' },
                            ].map(p => (
                                <label
                                    key={p.value}
                                    className={`popup-priority-option ${formData.priority === p.value ? 'popup-priority-active' : ''}`}
                                >
                                    <input
                                        type="radio"
                                        name="priority"
                                        value={p.value}
                                        checked={formData.priority === p.value}
                                        onChange={handleChange}
                                        className="popup-radio-hidden"
                                    />
                                    <div className="popup-priority-content">
                                        <span className="popup-priority-label">{p.label}</span>
                                        <span className="popup-priority-desc">{p.desc}</span>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="popup-field">
                        <label className="popup-label">Estimated Cost (optional)</label>
                        <div className="popup-amount-input">
                            <span className="popup-dollar-sign">$</span>
                            <input
                                type="number"
                                name="estimatedCost"
                                className="popup-input popup-input-dollar"
                                placeholder="0.00"
                                value={formData.estimatedCost}
                                onChange={handleChange}
                                min="0"
                                step="0.01"
                            />
                        </div>
                    </div>

                    <div className="popup-actions">
                        <button type="button" className="popup-btn popup-btn-cancel" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="popup-btn popup-btn-primary" disabled={loading}>
                            {loading ? 'Submitting...' : 'Submit Request'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default JobRequestPopup;
