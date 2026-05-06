// Manager.jsx
import { useState, useEffect, useCallback } from 'react';
import './Manager.css';

const Manager = () => {
    const [manager] = useState({ name: 'Sarah Johnson', managerID: 1 });

    const [jobs, setJobs] = useState([]);
    const [mechanics, setMechanics] = useState([]);

    const [activeTab,      setActiveTab]      = useState('active');
    const [searchTerm,     setSearchTerm]     = useState('');
    const [sortBy,        setSortBy]        = useState('jobId'); // jobId, pending, assigned, quoted, terminated
    const [selectedMechId, setSelectedMechId] = useState(null);
    const [quoteJobId,     setQuoteJobId]     = useState(null);
    const [quoteInput,     setQuoteInput]     = useState('');
    const [assignJobId,    setAssignJobId]    = useState(null);
    const [showNotification, setShowNotification] = useState(null);
    const [isLoading,      setIsLoading]      = useState(false);

    function notify(message, type = 'success') {
        setShowNotification({ message, type });
        setTimeout(() => setShowNotification(null), 3000);
    }

    const loadData = useCallback(async () => {
        try {
            const [jobsRes, mechsRes] = await Promise.all([
                fetch('/api/manager/jobs'),
                fetch('/api/mechanics'),
            ]);
            const [jobsData, mechsData] = await Promise.all([
                jobsRes.json(),
                mechsRes.json(),
            ]);
            setJobs(jobsData.jobs || []);
            setMechanics(mechsData.mechanics || []);
        } catch (error) {
            console.error('Error loading data:', error);
            notify('Error loading data', 'error');
        }
    }, []);

    useEffect(() => {
        let active = true;
        (async () => {
            if (active) await loadData();
        })();
        return () => {
            active = false;
        };
    }, [loadData]);

    const terminateJob = async (jobId) => {
        const parsedJobId = Number(jobId);
        if (!parsedJobId) return;
        setIsLoading(true);
        try {
            const res = await fetch(`/api/manager/jobs/${parsedJobId}/terminate`, { method: 'PATCH' });
            if (!res.ok) throw new Error('terminate failed');
            await loadData();
            notify(`Job #${parsedJobId} has been terminated`);
        } catch {
            notify('Error terminating job', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const recordQuote = async (jobId, amount) => {
        const parsedJobId = Number(jobId);
        const parsedAmount = Number(amount);
        if (!parsedJobId || Number.isNaN(parsedAmount) || parsedAmount < 0) return;
        setIsLoading(true);
        try {
            const res = await fetch(`/api/jobs/${parsedJobId}/quote`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount_num: parsedAmount }),
            });
            if (!res.ok) throw new Error('quote failed');
            await loadData();
            notify(`Quote of $${parsedAmount.toFixed(2)} saved for job #${parsedJobId}`);
        } catch {
            notify('Error saving quote', 'error');
        } finally {
            setIsLoading(false);
            setQuoteJobId(null);
            setQuoteInput('');
        }
    };

    const assignMechanics = async (jobId, mechanicId) => {
        const parsedJobId = Number(jobId);
        const parsedMechanicId = Number(mechanicId);
        if (!parsedJobId || !parsedMechanicId) return;
        const mechName = mechanics.find((m) => m.mechanicId === parsedMechanicId)?.name;
        setIsLoading(true);
        try {
            const res = await fetch(`/api/manager/jobs/${parsedJobId}/assign`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mechanic_id: parsedMechanicId }),
            });
            if (!res.ok) throw new Error('assign failed');
            await loadData();
            notify(`${mechName} assigned to job #${parsedJobId}`);
        } catch {
            notify('Error assigning mechanic', 'error');
        } finally {
            setIsLoading(false);
            setAssignJobId(null);
            setSelectedMechId(null);
        }
    };

    const unassignMechanic = async (jobId) => {
        const job = jobs.find((j) => j.jobId === jobId);
        if (!job || job.mechanicId === null) return;
        setIsLoading(true);
        try {
            const res = await fetch(`/api/manager/jobs/${jobId}/assign`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mechanic_id: null }),
            });
            if (!res.ok) throw new Error('unassign failed');
            await loadData();
            notify(`Mechanic unassigned from job #${jobId}`);
        } catch {
            notify('Error unassigning mechanic', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    function activeJobCount(mechId) {
        return jobs.filter((j) => j.mechanicId === mechId && j.jobStatus !== 'terminated').length;
    }

    const stats = {
        total:      jobs.length,
        pending:    jobs.filter((j) => j.jobStatus === 'pending').length,
        assigned:   jobs.filter((j) => j.jobStatus === 'assigned').length,
        quoted:     jobs.filter((j) => j.jobStatus === 'quoted').length,
        terminated: jobs.filter((j) => j.jobStatus === 'terminated').length,
    };

    const statusOrder = { pending: 1, assigned: 2, quoted: 3, terminated: 4 };

    const sortJobs = (jobList) => {
        if (sortBy === 'jobId') {
            return [...jobList].sort((a, b) => a.jobId - b.jobId);
        }
        // Sort by status order
        return [...jobList].sort((a, b) => {
            const statusA = statusOrder[a.jobStatus] || 999;
            const statusB = statusOrder[b.jobStatus] || 999;
            if (statusA !== statusB) return statusA - statusB;
            return a.jobId - b.jobId; // Tie-breaker by job ID
        });
    };

    const activeJobs     = jobs.filter((j) => j.jobStatus !== 'terminated');
    const terminatedJobs = jobs.filter((j) => j.jobStatus === 'terminated');
    const displayedJobs  = sortJobs(
        (activeTab === 'active' ? activeJobs : terminatedJobs)
            .filter((j) =>
                searchTerm === '' ||
                String(j.jobId).includes(searchTerm) ||
                j.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                String(j.vehicleId).includes(searchTerm) ||
                j.diagnosis?.toLowerCase().includes(searchTerm.toLowerCase())
            )
    );

    return (
        <div className="manager-portal">
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

            {/* Manager Info Header */}
            <div className="manager-info-header">
                <div className="manager-info-content">
                    <div className="manager-greeting">
                        <div className="manager-avatar">
                            <span></span>
                        </div>
                        <div>
                            <h1 className="welcome-text">Welcome, {manager.name}!</h1>
                            <p className="manager-id-text">Manager ID: {manager.managerID} • Operations Dashboard</p>
                        </div>
                    </div>
                    <div className="manager-stats-mini">
                        <div className="mini-stat">
                            <span className="mini-stat-label">Active Jobs</span>
                            <span className="mini-stat-value">{activeJobs.length}</span>
                        </div>
                        <div className="mini-stat">
                            <span className="mini-stat-label">Active Mechanics</span>
                            <span className="mini-stat-value" style={{ color: 'var(--accent-cyan)' }}>
                                {mechanics.length}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="manager-main-content">
                {/* Stats Grid */}
                <div className="manager-stats-grid">
                    <div className="stat-card">
                        <div className="stat-card-content">
                            <div>
                                <p className="stat-label">Total Jobs</p>
                                <p className="stat-value">{stats.total}</p>
                            </div>
                            <div className="stat-icon"></div>
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

                    <div className="stat-card stat-card-assigned">
                        <div className="stat-card-content">
                            <div>
                                <p className="stat-label">Assigned</p>
                                <p className="stat-value">{stats.assigned}</p>
                            </div>
                        </div>
                    </div>

                    <div className="stat-card stat-card-quoted">
                        <div className="stat-card-content">
                            <div>
                                <p className="stat-label">Quoted</p>
                                <p className="stat-value">{stats.quoted}</p>
                            </div>
                        </div>
                    </div>

                    <div className="stat-card stat-card-terminated">
                        <div className="stat-card-content">
                            <div>
                                <p className="stat-label">Terminated</p>
                                <p className="stat-value">{stats.terminated}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Search and Tab Bar */}
                <div className="manager-filter-bar">
                    <div className="filter-controls">
                        <div className="manager-tabs">
                            <button
                                className={`tab-btn ${activeTab === 'active' ? 'active' : ''}`}
                                onClick={() => setActiveTab('active')}
                            >
                                Active Jobs
                            </button>
                            <button
                                className={`tab-btn ${activeTab === 'terminated' ? 'active' : ''}`}
                                onClick={() => setActiveTab('terminated')}
                            >
                                Terminated
                            </button>
                        </div>

                        <div className="search-wrapper">
                            <input
                                type="text"
                                className="search-input-manager"
                                placeholder=" Search by job, customer, or vehicle..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="sort-wrapper">
                            <select
                                className="sort-select-manager"
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                            >
                                <option value="jobId">Sort by Job ID</option>
                                <option value="status">Sort by Status</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Jobs Grid */}
                <div className="jobs-section">
                    <div className="jobs-header">
                        <h2 className="jobs-title">
                            {activeTab === 'active' ? ' Active Jobs' : ' Terminated Jobs'}
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
                                {searchTerm ? 'Try adjusting your search' : 'Nothing here yet!'}
                            </p>
                        </div>
                    ) : (
                        <div className="manager-jobs-grid">
                            {displayedJobs.map((job) => {
                                const assignedMech = job.mechanicId ? mechanics.find((m) => m.mechanicId === job.mechanicId) : null;
                                const isTerminated = job.jobStatus === 'terminated';
                                return (
                                    <div key={job.jobId} className="manager-job-card">
                                        {/* Card Header */}
                                        <div className="manager-job-card-header">
                                            <div className="job-header-left">
                                                <span className={`status-badge-manager status-${job.jobStatus}`}>
                                                    {job.jobStatus.toUpperCase()}
                                                </span>
                                                <h3 className="job-title-manager">Job #{job.jobId}</h3>
                                                <p className="job-subtitle-manager">Vehicle #{job.vehicleId}</p>
                                            </div>
                                            <div className="job-header-icon">
                                                {isTerminated ? '' : job.jobStatus === 'quoted' ? '' : job.jobStatus === 'assigned' ? '' : ''}
                                            </div>
                                        </div>

                                        {/* Card Body */}
                                        <div className="manager-job-card-body">
                                            <div className="job-details">
                                                <div className="job-detail-item">
                                                    <span className="detail-icon"></span>
                                                    <div>
                                                        <p className="detail-label">Customer</p>
                                                        <p className="detail-value">{job.customerName || 'N/A'}</p>
                                                    </div>
                                                </div>

                                                <div className="job-detail-item">
                                                    <span className="detail-icon"></span>
                                                    <div>
                                                        <p className="detail-label">Diagnosis</p>
                                                        <p className="detail-value">{job.diagnosis || 'Pending'}</p>
                                                    </div>
                                                </div>

                                                <div className="job-detail-item">
                                                    <span className="detail-icon"></span>
                                                    <div>
                                                        <p className="detail-label">Mechanic</p>
                                                        <p className="detail-value">
                                                            {assignedMech ? `${assignedMech.name} (ID: ${assignedMech.mechanicId})` : 'Unassigned'}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="job-detail-item quote-item">
                                                    <span className="detail-icon"></span>
                                                    <div>
                                                        <p className="detail-label">Quote</p>
                                                        <p className={`detail-value quote-value ${job.jobQuote > 0 ? 'has-quote' : ''}`}>
                                                            {job.jobQuote > 0 ? `$${job.jobQuote.toFixed(2)}` : 'Not set'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            {!isTerminated && (
                                                <div className="manager-job-actions">
                                                    {/* Set/Update Quote */}
                                                    {quoteJobId === job.jobId ? (
                                                        <div className="action-input-group">
                                                            <input
                                                                type="number"
                                                                className="action-input"
                                                                placeholder="Enter quote amount..."
                                                                value={quoteInput}
                                                                onChange={(e) => setQuoteInput(e.target.value)}
                                                                autoFocus
                                                            />
                                                            <div className="action-buttons">
                                                                <button 
                                                                    className="action-btn save-quote-btn"
                                                                    onClick={() => recordQuote(job.jobId, quoteInput)}
                                                                >
                                                                    Save Quote
                                                                </button>
                                                                <button 
                                                                    className="action-btn cancel-btn"
                                                                    onClick={() => { setQuoteJobId(null); setQuoteInput(''); }}
                                                                >
                                                                    Cancel
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <button 
                                                            className="action-btn quote-btn"
                                                            onClick={() => { setQuoteJobId(job.jobId); setQuoteInput(job.jobQuote > 0 ? String(job.jobQuote) : ''); }}
                                                        >
                                                             {job.jobQuote > 0 ? 'Update Quote' : 'Set Quote'}
                                                        </button>
                                                    )}

                                                    {/* Assign Mechanic */}
                                                    {assignJobId === job.jobId ? (
                                                        <div className="mechanic-selector">
                                                            <p className="selector-title">Select a mechanic:</p>
                                                            <div className="mechanics-list">
                                                                {mechanics.map((m) => {
                                                                    const count = activeJobCount(m.mechanicId);
                                                                    const isSelected = selectedMechId === m.mechanicId;
                                                                    return (
                                                                        <div
                                                                            key={m.mechanicId}
                                                                            className={`mechanic-item ${isSelected ? 'selected' : ''}`}
                                                                            onClick={() => setSelectedMechId(isSelected ? null : m.mechanicId)}
                                                                        >
                                                                            <div className={`mechanic-status-dot ${count === 0 ? 'free' : count <= 2 ? 'busy' : 'overloaded'}`} />
                                                                            <div className="mechanic-info">
                                                                                <span className="mechanic-name">{m.name}</span>
                                                                                <span className="mechanic-workload">
                                                                                    {count === 0 ? 'Free' : `${count} job${count !== 1 ? 's' : ''}`}
                                                                                </span>
                                                                            </div>
                                                                            {isSelected && <span className="check-icon"></span>}
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                            <div className="action-buttons">
                                                                <button
                                                                    className="action-btn assign-btn"
                                                                    onClick={() => assignMechanics(job.jobId, selectedMechId)}
                                                                    disabled={!selectedMechId}
                                                                >
                                                                    Assign
                                                                </button>
                                                                <button 
                                                                    className="action-btn cancel-btn"
                                                                    onClick={() => { setAssignJobId(null); setSelectedMechId(null); }}
                                                                >
                                                                    Cancel
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <button 
                                                            className="action-btn assign-mechanic-btn"
                                                            onClick={() => { setAssignJobId(job.jobId); setSelectedMechId(job.mechanicId); }}
                                                        >
                                                             {assignedMech ? 'Reassign Mechanic' : 'Assign Mechanic'}
                                                        </button>
                                                    )}

                                                    {/* Unassign Mechanic */}
                                                    {assignedMech && assignJobId !== job.jobId && (
                                                        <button 
                                                            className="action-btn unassign-btn"
                                                            onClick={() => unassignMechanic(job.jobId)}
                                                        >
                                                             Unassign Mechanic
                                                        </button>
                                                    )}

                                                    {/* Terminate Job */}
                                                    <button 
                                                        className="action-btn terminate-btn"
                                                        onClick={() => terminateJob(job.jobId)}
                                                    >
                                                         Terminate Job
                                                    </button>
                                                </div>
                                            )}

                                            {isTerminated && (
                                                <div className="terminated-badge">
                                                    <span></span>
                                                    <p>This job has been terminated</p>
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

export default Manager;
