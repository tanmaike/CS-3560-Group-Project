// Mechanic.jsx
import { useState, useEffect, useCallback } from 'react';
import './Mechanic.css';

const Mechanic = ({ mechanicId = 1 }) => {
    // State variables
    const [name, setName] = useState("");
    const mechanicID = mechanicId;
    const [assignedJobs, setAssignedJobs] = useState([]);

    // UI State
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedJob, setSelectedJob] = useState(null);
    const [diagnosisInput, setDiagnosisInput] = useState('');
    const [costInput, setCostInput] = useState('');
    const [showNotification, setShowNotification] = useState(null);
    const [activeTab, setActiveTab] = useState('active');
    const [isLoading, setIsLoading] = useState(false);

    const loadJobs = useCallback(async () => {
        const res = await fetch(`/api/jobs?mechanic_id=${mechanicID}`);
        const data = await res.json();
        setAssignedJobs((data.jobs || []).map((j) => ({
                    id:               j.job_id,
                    title:            j.title_txt,
                    customer:         j.customer_nm,
                    vehicle:          j.vehicle_txt,
                    status:           j.status_txt,
                    priority:         j.priority_txt,
                    vehicleStatusCode: j.diag_code,
                    estimatedCost:    j.est_cost,
                    notifiedCost:     j.quote_at ? j.est_cost : null,
                    diagnosisRecorded: j.diag_at ? new Date(j.diag_at).toLocaleString() : null,
                    completedAt:      j.completed_at ? new Date(j.completed_at).toLocaleString() : null,
                })));
    }, [mechanicID]);

    // Load mechanic info and jobs on mount
    useEffect(() => {
        let active = true;
        (async () => {
            try {
                const res = await fetch('/api/mechanics');
                const data = await res.json();
                const mech = (data.mechanics || []).find(m => m.mechanicId === mechanicId);
                if (active && mech) {
                    setName(mech.name);
                }
            } catch (err) {
                console.error('Error loading mechanic info:', err);
            }

            if (active) {
                try {
                    await loadJobs();
                } catch (err) {
                    console.error('Error loading jobs:', err);
                }
            }
        })();
        return () => {
            active = false;
        };
    }, [mechanicId, loadJobs]);

    const showMessage = (message, type = 'success') => {
        setShowNotification({ message, type });
        setTimeout(() => setShowNotification(null), 3000);
    };

    const recordVehicleDiagnosis = async (jobId, diagnosisCode) => {
        if (!diagnosisCode.trim()) {
            showMessage('Please enter a diagnosis code', 'error');
            return;
        }
        setIsLoading(true);
        await fetch(`/api/jobs/${jobId}/diagnosis`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ diag_code: diagnosisCode, diag_note: diagnosisCode }),
        });
        await loadJobs();
        setIsLoading(false);
        setDiagnosisInput('');
        setSelectedJob(null);
        showMessage(`Diagnosis recorded for job #${jobId}`, 'success');
    };

    const notifyCost = async (jobId, cost) => {
        if (!cost || cost <= 0) {
            showMessage('Please enter a valid cost amount', 'error');
            return;
        }
        setIsLoading(true);
        await fetch(`/api/jobs/${jobId}/quote`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount_num: parseFloat(cost) }),
        });
        await loadJobs();
        setIsLoading(false);
        setCostInput('');
        setSelectedJob(null);
        showMessage(`$${cost} cost notification sent to Manager`, 'success');
    };

    const markJobCompleted = async (jobId) => {
        setIsLoading(true);
        await fetch(`/api/jobs/${jobId}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status_txt: 'completed' }),
        });

        await loadJobs();
        setIsLoading(false);
        showMessage(`Job #${jobId} marked as completed!`, 'success');
    };

    // Get filtered jobs based on active tab
    const getFilteredJobs = () => {
        let filtered = activeTab === 'active'
            ? assignedJobs.filter(job => job.status !== 'completed')
            : assignedJobs.filter(job => job.status === 'completed');

        if (filter !== 'all') {
            filtered = filtered.filter(job => job.status === filter);
        }

        if (searchTerm) {
            filtered = filtered.filter(job =>
                job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                job.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                job.vehicle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                job.id.toString().includes(searchTerm)
            );
        }

        return filtered;
    };

    // Stats
    const stats = {
        total: assignedJobs.length,
        pending: assignedJobs.filter(j => j.status === 'pending').length,
        inProgress: assignedJobs.filter(j => j.status === 'in-progress').length,
        completed: assignedJobs.filter(j => j.status === 'completed').length
    };

    const displayedJobs = getFilteredJobs();

    if (!name) {
        return (
            <div className="mechanic-portal">
                <div className="mechanic-main-content" style={{ textAlign: 'center', padding: '60px' }}>
                    <div className="loading-spinner">Loading mechanic profile...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="mechanic-portal">
            {/* Notification Toast */}
            {showNotification && (
                <div className={`notification-toast ${showNotification.type}`}>
                    {showNotification.message}
                </div>
            )}

            {/* Loading Overlay */}
            {isLoading && (
                <div className="loading-overlay">
                    <div className="loading-spinner-container">
                        <div className="loading-spinner"></div>
                        <p>Processing...</p>
                    </div>
                </div>
            )}

            {/* Mechanic Info Header */}
            <div className="mechanic-info-header">
                <div className="mechanic-info-content">
                    <div className="mechanic-greeting">
                        <div className="mechanic-avatar">
                            <span></span>
                        </div>
                        <div>
                            <h1 className="welcome-text">Welcome back, {name}!</h1>
                            <p className="mechanic-id-text">Mechanic ID: {mechanicID} • Senior Technician</p>
                        </div>
                    </div>
                    <div className="mechanic-stats-mini">
                        <div className="mini-stat">
                            <span className="mini-stat-label">Active Jobs</span>
                            <span className="mini-stat-value">{stats.pending + stats.inProgress}</span>
                        </div>
                        <div className="mini-stat">
                            <span className="mini-stat-label">Completed Today</span>
                            <span className="mini-stat-value" style={{ color: 'var(--accent-cyan)' }}>
                                {stats.completed}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="mechanic-main-content">
                {/* Stats Cards */}
                <div className="mechanic-stats-grid">
                    <div className="stat-card">
                        <div className="stat-card-content">
                            <div>
                                <p className="stat-label">Total Jobs</p>
                                <p className="stat-value">{stats.total}</p>
                            </div>
                        </div>
                    </div>

                    <div className="stat-card stat-card-pending">
                        <div className="stat-card-content">
                            <div>
                                <p className="stat-label">Pending</p>
                                <p className="stat-value">{stats.pending}</p>
                            </div>
                        </div>
                    </div>

                    <div className="stat-card stat-card-progress">
                        <div className="stat-card-content">
                            <div>
                                <p className="stat-label">In Progress</p>
                                <p className="stat-value">{stats.inProgress}</p>
                            </div>
                        </div>
                    </div>

                    <div className="stat-card stat-card-completed">
                        <div className="stat-card-content">
                            <div>
                                <p className="stat-label">Completed</p>
                                <p className="stat-value">{stats.completed}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Search and Filter Bar */}
                <div className="mechanic-filter-bar">
                    <div className="filter-controls">
                        {/* Tabs */}
                        <div className="mechanic-tabs">
                            <button
                                className={`tab-btn ${activeTab === 'active' ? 'active' : ''}`}
                                onClick={() => setActiveTab('active')}
                            >
                                Active Jobs
                            </button>
                            <button
                                className={`tab-btn ${activeTab === 'completed' ? 'active' : ''}`}
                                onClick={() => setActiveTab('completed')}
                            >
                                Completed
                            </button>
                        </div>

                        {/* Search */}
                        <div className="search-wrapper">
                            <input
                                type="text"
                                className="search-input-mechanic"
                                placeholder=" Search by job, customer, or vehicle..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Status Filter Chips (only for active jobs) */}
                    {activeTab === 'active' && (
                        <div className="status-chips">
                            <span className="chips-label">Filter by status:</span>
                            {['all', 'pending', 'in-progress'].map((filterOption) => (
                                <button
                                    key={filterOption}
                                    className={`status-chip ${filter === filterOption ? 'active' : ''}`}
                                    onClick={() => setFilter(filterOption)}
                                >
                                    {filterOption === 'all' ? 'All' : filterOption === 'in-progress' ? 'In Progress' : 'Pending'}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Jobs Grid */}
                <div className="jobs-section">
                    <div className="jobs-header">
                        <h2 className="jobs-title">
                            {activeTab === 'active' ? ' Active Jobs' : ' Completed Jobs'}
                        </h2>
                        <p className="jobs-count">
                            {displayedJobs.length} job{displayedJobs.length !== 1 ? 's' : ''} found
                        </p>
                    </div>

                    {displayedJobs.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-emoji"></div>
                            <p className="empty-title">No jobs found</p>
                            <p className="empty-subtitle">
                                {searchTerm ? 'Try adjusting your search or filter' : 'You\'re all caught up!'}
                            </p>
                        </div>
                    ) : (
                        <div className="jobs-grid">
                            {displayedJobs.map(job => {
                                const isCompleted = job.status === 'completed';

                                return (
                                    <div key={job.id} className="job-card">
                                        {/* Card Header */}
                                        <div className="job-card-header">
                                            <div className="job-badges">
                                                <span className={`priority-badge priority-${job.priority}`}>
                                                    {job.priority.toUpperCase()} PRIORITY
                                                </span>
                                                <span className={`status-badge status-${job.status === 'in-progress' ? 'in-progress' : job.status}`}>
                                                    {job.status === 'in-progress' ? 'IN PROGRESS' : job.status.toUpperCase()}
                                                </span>
                                            </div>
                                            <div className="job-icon">
                                                {job.priority === 'high' ? '' : job.priority === 'medium' ? '️' : ''}
                                            </div>
                                        </div>

                                        <div className="job-card-body">
                                            <h3 className="job-title">{job.title}</h3>
                                            <p className="job-subtitle">#{job.id} • {job.vehicle}</p>

                                            <div className="job-details">
                                                <div className="job-detail-item">
                                                    <span className="detail-icon"></span>
                                                    <div>
                                                        <p className="detail-label">Customer</p>
                                                        <p className="detail-value">{job.customer}</p>
                                                    </div>
                                                </div>

                                                <div className="job-detail-item">
                                                    <span className="detail-icon"></span>
                                                    <div>
                                                        <p className="detail-label">Status Code</p>
                                                        <p className="detail-value">{job.vehicleStatusCode || 'N/A'}</p>
                                                    </div>
                                                </div>

                                                <div className="job-detail-item">
                                                    <span className="detail-icon"></span>
                                                    <div>
                                                        <p className="detail-label">Estimated Cost</p>
                                                        <p className="detail-value cost-value">${job.estimatedCost?.toFixed(2) || '0.00'}</p>
                                                    </div>
                                                </div>

                                                {job.notifiedCost && (
                                                    <div className="notification-badge success">
                                                        <span></span>
                                                        <span>Cost ${job.notifiedCost} notified to manager</span>
                                                    </div>
                                                )}

                                                {job.diagnosisRecorded && (
                                                    <div className="notification-badge info">
                                                        <span></span>
                                                        <span>Diagnosis recorded: {job.diagnosisRecorded}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Action Buttons */}
                                            {!isCompleted && (
                                                <div className="job-actions">
                                                    <button
                                                        className="action-btn complete-btn"
                                                        onClick={() => markJobCompleted(job.id)}
                                                    >
                                                         Mark as Complete
                                                    </button>

                                                    {selectedJob === job.id ? (
                                                        <div className="input-group">
                                                            <input
                                                                type="text"
                                                                className="action-input"
                                                                placeholder="Enter diagnosis code..."
                                                                value={diagnosisInput}
                                                                onChange={(e) => setDiagnosisInput(e.target.value)}
                                                                autoFocus
                                                            />
                                                            <div className="input-actions">
                                                                <button
                                                                    className="action-btn save-btn"
                                                                    onClick={() => recordVehicleDiagnosis(job.id, diagnosisInput)}
                                                                >
                                                                    Save
                                                                </button>
                                                                <button
                                                                    className="action-btn cancel-btn"
                                                                    onClick={() => setSelectedJob(null)}
                                                                >
                                                                    Cancel
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            className="action-btn diagnosis-btn"
                                                            onClick={() => setSelectedJob(job.id)}
                                                        >
                                                             Record Diagnosis
                                                        </button>
                                                    )}

                                                    {selectedJob === `cost-${job.id}` ? (
                                                        <div className="input-group">
                                                            <input
                                                                type="number"
                                                                className="action-input"
                                                                placeholder="Enter cost amount..."
                                                                value={costInput}
                                                                onChange={(e) => setCostInput(e.target.value)}
                                                                autoFocus
                                                            />
                                                            <div className="input-actions">
                                                                <button
                                                                    className="action-btn notify-btn"
                                                                    onClick={() => notifyCost(job.id, costInput)}
                                                                >
                                                                    Send
                                                                </button>
                                                                <button
                                                                    className="action-btn cancel-btn"
                                                                    onClick={() => setSelectedJob(null)}
                                                                >
                                                                    Cancel
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            className="action-btn notify-cost-btn"
                                                            onClick={() => setSelectedJob(`cost-${job.id}`)}
                                                        >
                                                             Notify Cost to Manager
                                                        </button>
                                                    )}
                                                </div>
                                            )}

                                            {isCompleted && job.completedAt && (
                                                <div className="completion-badge">
                                                    <span></span>
                                                    <p>Completed on {job.completedAt}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Mechanic;
