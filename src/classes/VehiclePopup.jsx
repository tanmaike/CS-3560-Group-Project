// VehiclePopup.jsx
import { useState } from 'react';
import './Popup.css';

function VehiclePopup({ customerID, onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        year: new Date().getFullYear(),
        make: '',
        model: '',
        plate: '',
        issue: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.make.trim() || !formData.model.trim() || !formData.plate.trim()) {
            setError('Please fill in make, model, and plate number.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`/api/customers/${customerID}/vehicles`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    year_num: Number(formData.year),
                    make_txt: formData.make.trim(),
                    model_txt: formData.model.trim(),
                    plate_txt: formData.plate.trim(),
                    status_txt: 'No Active Service',
                    issue_txt: formData.issue.trim() || 'None',
                    appointment_txt: 'No appointment scheduled',
                }),
            });
            if (!res.ok) throw new Error('Failed to add vehicle');
            onSuccess?.();
            onClose();
        } catch (err) {
            setError(err.message || 'Error adding vehicle');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="popup-overlay" onClick={onClose}>
            <div className="popup-card" onClick={e => e.stopPropagation()}>
                <div className="popup-header">
                    <h2>Add a Vehicle</h2>
                    <p className="popup-subtitle">Register a new vehicle to your account</p>
                </div>

                <form onSubmit={handleSubmit} className="popup-form">
                    {error && <div className="popup-error">{error}</div>}

                    <div className="popup-row">
                        <div className="popup-field">
                            <label className="popup-label">Year</label>
                            <input
                                type="number"
                                name="year"
                                className="popup-input"
                                value={formData.year}
                                onChange={handleChange}
                                min="1980"
                                max={new Date().getFullYear() + 1}
                            />
                        </div>
                        <div className="popup-field">
                            <label className="popup-label">Plate Number</label>
                            <input
                                type="text"
                                name="plate"
                                className="popup-input"
                                placeholder="ABC-1234"
                                value={formData.plate}
                                onChange={handleChange}
                                maxLength={10}
                            />
                        </div>
                    </div>

                    <div className="popup-row">
                        <div className="popup-field">
                            <label className="popup-label">Make</label>
                            <input
                                type="text"
                                name="make"
                                className="popup-input"
                                placeholder="Toyota, Honda, Ford..."
                                value={formData.make}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="popup-field">
                            <label className="popup-label">Model</label>
                            <input
                                type="text"
                                name="model"
                                className="popup-input"
                                placeholder="Camry, Civic, F-150..."
                                value={formData.model}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="popup-field">
                        <label className="popup-label">Known Issue (optional)</label>
                        <input
                            type="text"
                            name="issue"
                            className="popup-input"
                            placeholder="e.g., Check engine light, weird noise..."
                            value={formData.issue}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="popup-actions">
                        <button type="button" className="popup-btn popup-btn-cancel" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="popup-btn popup-btn-primary" disabled={loading}>
                            {loading ? 'Adding...' : 'Add Vehicle'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default VehiclePopup;