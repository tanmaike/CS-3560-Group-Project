import { useState, useEffect } from 'react';

const Mechanic = () => {
    // State variables
    const [name, setName] = useState("Mike Thompson");
    const [mechanicID, setMechanicID] = useState(1);
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

    const loadJobs = () =>
        fetch(`/api/jobs?mechanic_id=${mechanicID}`)
            .then((r) => r.json())
            .then((data) =>
                setAssignedJobs(data.jobs.map((j) => ({
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
                })))
            );

    useEffect(() => { loadJobs(); }, []);

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

    // Priority color mapping
    const getPriorityColor = (priority) => {
        switch(priority) {
            case 'high': return { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' };
            case 'medium': return { bg: '#fffbeb', text: '#d97706', border: '#fde68a' };
            default: return { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0' };
        }
    };

    // Status color mapping
    const getStatusColor = (status) => {
        switch(status) {
            case 'pending': return { bg: '#fef3c7', text: '#d97706' };
            case 'in-progress': return { bg: '#dbeafe', text: '#2563eb' };
            case 'completed': return { bg: '#d1fae5', text: '#059669' };
            default: return { bg: '#f3f4f6', text: '#6b7280' };
        }
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
            {/* Notification Toast */}
            {showNotification && (
                <div style={{
                    position: 'fixed',
                    top: '20px',
                    right: '20px',
                    zIndex: 1000,
                    padding: '16px 24px',
                    borderRadius: '12px',
                    backgroundColor: showNotification.type === 'success' ? '#10b981' : '#ef4444',
                    color: 'white',
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                    animation: 'slideIn 0.3s ease-out',
                    fontWeight: '500'
                }}>
                    {showNotification.message}
                </div>
            )}

            {/* Loading Overlay */}
            {isLoading && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    zIndex: 999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        padding: '24px',
                        borderRadius: '16px',
                        textAlign: 'center'
                    }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            border: '3px solid #e5e7eb',
                            borderTopColor: '#3b82f6',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite',
                            margin: '0 auto 12px'
                        }} />
                        <p>Processing...</p>
                    </div>
                </div>
            )}

            {/* Header */}
            <header style={{
                background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)',
                color: 'white',
                padding: '20px 32px',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
            }}>
                <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            backgroundColor: 'rgba(255,255,255,0.2)',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '24px'
                        }}>
                            🔧
                        </div>
                        <div>
                            <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: 0 }}>Mechanic Portal</h1>
                            <p style={{ fontSize: '14px', opacity: 0.9, margin: '4px 0 0' }}>Job Management Dashboard</p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div style={{ textAlign: 'right' }}>
                            <p style={{ fontWeight: 'bold', margin: 0 }}>{name}</p>
                            <p style={{ fontSize: '12px', opacity: 0.9, margin: '4px 0 0' }}>ID: {mechanicID}</p>
                        </div>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                            fontSize: '20px',
                            border: '2px solid rgba(255,255,255,0.3)'
                        }}>
                            {name.charAt(0)}
                        </div>
                    </div>
                </div>
            </header>

            <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px' }}>
                {/* Stats Cards */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: '24px',
                    marginBottom: '32px'
                }}>
                    <div style={{
                        background: 'linear-gradient(135deg, white 0%, #f8fafc 100%)',
                        borderRadius: '16px',
                        padding: '24px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                        borderLeft: '4px solid #3b82f6',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        cursor: 'pointer'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <p style={{ color: '#6b7280', fontSize: '14px', fontWeight: '500', margin: '0 0 8px' }}>Total Jobs</p>
                                <p style={{ fontSize: '36px', fontWeight: 'bold', margin: 0, color: '#1f2937' }}>{stats.total}</p>
                            </div>
                            <div style={{ fontSize: '32px', opacity: 0.7 }}>📋</div>
                        </div>
                    </div>

                    <div style={{
                        background: 'linear-gradient(135deg, white 0%, #fefce8 100%)',
                        borderRadius: '16px',
                        padding: '24px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                        borderLeft: '4px solid #eab308'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <p style={{ color: '#6b7280', fontSize: '14px', fontWeight: '500', margin: '0 0 8px' }}>Pending</p>
                                <p style={{ fontSize: '36px', fontWeight: 'bold', margin: 0, color: '#1f2937' }}>{stats.pending}</p>
                            </div>
                            <div style={{ fontSize: '32px', opacity: 0.7 }}>⏳</div>
                        </div>
                    </div>

                    <div style={{
                        background: 'linear-gradient(135deg, white 0%, #eff6ff 100%)',
                        borderRadius: '16px',
                        padding: '24px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                        borderLeft: '4px solid #2563eb'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <p style={{ color: '#6b7280', fontSize: '14px', fontWeight: '500', margin: '0 0 8px' }}>In Progress</p>
                                <p style={{ fontSize: '36px', fontWeight: 'bold', margin: 0, color: '#1f2937' }}>{stats.inProgress}</p>
                            </div>
                            <div style={{ fontSize: '32px', opacity: 0.7 }}>⚙️</div>
                        </div>
                    </div>

                    <div style={{
                        background: 'linear-gradient(135deg, white 0%, #ecfdf5 100%)',
                        borderRadius: '16px',
                        padding: '24px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                        borderLeft: '4px solid #10b981'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <p style={{ color: '#6b7280', fontSize: '14px', fontWeight: '500', margin: '0 0 8px' }}>Completed</p>
                                <p style={{ fontSize: '36px', fontWeight: 'bold', margin: 0, color: '#1f2937' }}>{stats.completed}</p>
                            </div>
                            <div style={{ fontSize: '32px', opacity: 0.7 }}>✅</div>
                        </div>
                    </div>
                </div>

                {/* Search and Filter Bar */}
                <div style={{
                    backgroundColor: 'white',
                    borderRadius: '16px',
                    padding: '20px 24px',
                    marginBottom: '32px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                        {/* Tabs */}
                        <div style={{ display: 'flex', gap: '8px', backgroundColor: '#f3f4f6', padding: '4px', borderRadius: '12px' }}>
                            <button
                                onClick={() => setActiveTab('active')}
                                style={{
                                    padding: '10px 24px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontWeight: '500',
                                    backgroundColor: activeTab === 'active' ? '#3b82f6' : 'transparent',
                                    color: activeTab === 'active' ? 'white' : '#6b7280',
                                    transition: 'all 0.2s'
                                }}
                            >
                                Active Jobs
                            </button>
                            <button
                                onClick={() => setActiveTab('completed')}
                                style={{
                                    padding: '10px 24px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontWeight: '500',
                                    backgroundColor: activeTab === 'completed' ? '#3b82f6' : 'transparent',
                                    color: activeTab === 'completed' ? 'white' : '#6b7280',
                                    transition: 'all 0.2s'
                                }}
                            >
                                Completed
                            </button>
                        </div>

                        {/* Search */}
                        <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
                            <input
                                type="text"
                                placeholder="🔍 Search by job, customer, or vehicle..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '10px 16px',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '12px',
                                    fontSize: '14px',
                                    outline: 'none',
                                    transition: 'border-color 0.2s'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                            />
                        </div>
                    </div>

                    {/* Status Filter Chips (only for active jobs) */}
                    {activeTab === 'active' && (
                        <div style={{ display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '14px', color: '#6b7280', marginRight: '8px' }}>Filter by status:</span>
                            {['all', 'pending', 'in-progress'].map((filterOption) => (
                                <button
                                    key={filterOption}
                                    onClick={() => setFilter(filterOption)}
                                    style={{
                                        padding: '6px 16px',
                                        borderRadius: '20px',
                                        border: '1px solid',
                                        borderColor: filter === filterOption ? '#3b82f6' : '#e5e7eb',
                                        cursor: 'pointer',
                                        fontSize: '13px',
                                        fontWeight: '500',
                                        backgroundColor: filter === filterOption ? '#eff6ff' : 'white',
                                        color: filter === filterOption ? '#3b82f6' : '#6b7280',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {filterOption === 'all' ? 'All' : filterOption === 'in-progress' ? 'In Progress' : 'Pending'}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Jobs Grid */}
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
                            {activeTab === 'active' ? '📌 Active Jobs' : '✅ Completed Jobs'}
                        </h2>
                        <p style={{ color: '#6b7280', fontSize: '14px' }}>
                            {displayedJobs.length} job{displayedJobs.length !== 1 ? 's' : ''} found
                        </p>
                    </div>

                    {displayedJobs.length === 0 ? (
                        <div style={{
                            backgroundColor: 'white',
                            borderRadius: '16px',
                            padding: '64px',
                            textAlign: 'center',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                        }}>
                            <div style={{ fontSize: '64px', marginBottom: '16px' }}>🔧</div>
                            <p style={{ color: '#6b7280', fontSize: '18px', margin: 0 }}>No jobs found</p>
                            <p style={{ color: '#9ca3af', fontSize: '14px', marginTop: '8px' }}>
                                {searchTerm ? 'Try adjusting your search or filter' : 'You\'re all caught up!'}
                            </p>
                        </div>
                    ) : (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
                            gap: '24px'
                        }}>
                            {displayedJobs.map(job => {
                                const priorityStyle = getPriorityColor(job.priority);
                                const statusStyle = getStatusColor(job.status);
                                const isCompleted = job.status === 'completed';

                                return (
                                    <div key={job.id} style={{
                                        backgroundColor: 'white',
                                        borderRadius: '16px',
                                        overflow: 'hidden',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                        transition: 'transform 0.2s, box-shadow 0.2s',
                                        cursor: 'pointer'
                                    }}
                                         onMouseEnter={(e) => {
                                             e.currentTarget.style.transform = 'translateY(-4px)';
                                             e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0,0,0,0.15)';
                                         }}
                                         onMouseLeave={(e) => {
                                             e.currentTarget.style.transform = 'translateY(0)';
                                             e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                                         }}>
                                        {/* Card Header */}
                                        <div style={{
                                            padding: '20px 24px',
                                            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                                            borderBottom: '1px solid #e5e7eb'
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                                <div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                                        <span style={{
                                                            backgroundColor: priorityStyle.bg,
                                                            color: priorityStyle.text,
                                                            padding: '4px 10px',
                                                            borderRadius: '12px',
                                                            fontSize: '12px',
                                                            fontWeight: '600',
                                                            border: `1px solid ${priorityStyle.border}`
                                                        }}>
                                                            {job.priority.toUpperCase()} PRIORITY
                                                        </span>
                                                        <span style={{
                                                            backgroundColor: statusStyle.bg,
                                                            color: statusStyle.text,
                                                            padding: '4px 10px',
                                                            borderRadius: '12px',
                                                            fontSize: '12px',
                                                            fontWeight: '600'
                                                        }}>
                                                            {job.status === 'in-progress' ? 'IN PROGRESS' : job.status.toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <h3 style={{ fontSize: '20px', fontWeight: 'bold', margin: '8px 0 4px', color: '#1f2937' }}>
                                                        {job.title}
                                                    </h3>
                                                    <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
                                                        #{job.id} • {job.vehicle}
                                                    </p>
                                                </div>
                                                <div style={{ fontSize: '28px' }}>
                                                    {job.priority === 'high' ? '🚨' : job.priority === 'medium' ? '⚠️' : '🔧'}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Card Body */}
                                        <div style={{ padding: '20px 24px' }}>
                                            <div style={{ marginBottom: '16px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
                                                    <span style={{ fontSize: '20px' }}>👤</span>
                                                    <div>
                                                        <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>Customer</p>
                                                        <p style={{ fontSize: '14px', fontWeight: '500', margin: '4px 0 0', color: '#374151' }}>{job.customer}</p>
                                                    </div>
                                                </div>

                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
                                                    <span style={{ fontSize: '20px' }}>🔍</span>
                                                    <div>
                                                        <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>Status Code</p>
                                                        <p style={{ fontSize: '14px', fontWeight: '500', margin: '4px 0 0', color: '#374151' }}>{job.vehicleStatusCode}</p>
                                                    </div>
                                                </div>

                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0' }}>
                                                    <span style={{ fontSize: '20px' }}>💰</span>
                                                    <div>
                                                        <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>Estimated Cost</p>
                                                        <p style={{ fontSize: '18px', fontWeight: 'bold', margin: '4px 0 0', color: '#059669' }}>
                                                            ${job.estimatedCost}
                                                        </p>
                                                    </div>
                                                </div>

                                                {job.notifiedCost && (
                                                    <div style={{
                                                        marginTop: '12px',
                                                        padding: '8px 12px',
                                                        backgroundColor: '#ecfdf5',
                                                        borderRadius: '8px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '8px'
                                                    }}>
                                                        <span>✅</span>
                                                        <span style={{ fontSize: '13px', color: '#059669' }}>
                                                            Cost ${job.notifiedCost} notified to manager
                                                        </span>
                                                    </div>
                                                )}

                                                {job.diagnosisRecorded && (
                                                    <div style={{
                                                        marginTop: '8px',
                                                        padding: '8px 12px',
                                                        backgroundColor: '#eff6ff',
                                                        borderRadius: '8px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '8px'
                                                    }}>
                                                        <span>📝</span>
                                                        <span style={{ fontSize: '13px', color: '#2563eb' }}>
                                                            Diagnosis recorded: {job.diagnosisRecorded}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Action Buttons */}
                                            {!isCompleted && (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
                                                    <button
                                                        onClick={() => markJobCompleted(job.id)}
                                                        style={{
                                                            width: '100%',
                                                            backgroundColor: '#10b981',
                                                            color: 'white',
                                                            padding: '12px',
                                                            border: 'none',
                                                            borderRadius: '12px',
                                                            cursor: 'pointer',
                                                            fontWeight: '600',
                                                            fontSize: '14px',
                                                            transition: 'backgroundColor 0.2s'
                                                        }}
                                                        onMouseEnter={(e) => e.target.style.backgroundColor = '#059669'}
                                                        onMouseLeave={(e) => e.target.style.backgroundColor = '#10b981'}
                                                    >
                                                        ✅ Mark as Complete
                                                    </button>

                                                    {selectedJob === job.id ? (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                            <input
                                                                type="text"
                                                                placeholder="Enter diagnosis code..."
                                                                value={diagnosisInput}
                                                                onChange={(e) => setDiagnosisInput(e.target.value)}
                                                                style={{
                                                                    padding: '10px 12px',
                                                                    border: '1px solid #e5e7eb',
                                                                    borderRadius: '10px',
                                                                    fontSize: '14px',
                                                                    outline: 'none'
                                                                }}
                                                                autoFocus
                                                            />
                                                            <div style={{ display: 'flex', gap: '10px' }}>
                                                                <button
                                                                    onClick={() => recordVehicleDiagnosis(job.id, diagnosisInput)}
                                                                    style={{
                                                                        flex: 1,
                                                                        backgroundColor: '#3b82f6',
                                                                        color: 'white',
                                                                        padding: '10px',
                                                                        border: 'none',
                                                                        borderRadius: '10px',
                                                                        cursor: 'pointer',
                                                                        fontWeight: '500'
                                                                    }}
                                                                >
                                                                    Save
                                                                </button>
                                                                <button
                                                                    onClick={() => setSelectedJob(null)}
                                                                    style={{
                                                                        flex: 1,
                                                                        backgroundColor: '#9ca3af',
                                                                        color: 'white',
                                                                        padding: '10px',
                                                                        border: 'none',
                                                                        borderRadius: '10px',
                                                                        cursor: 'pointer',
                                                                        fontWeight: '500'
                                                                    }}
                                                                >
                                                                    Cancel
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => setSelectedJob(job.id)}
                                                            style={{
                                                                width: '100%',
                                                                backgroundColor: '#3b82f6',
                                                                color: 'white',
                                                                padding: '12px',
                                                                border: 'none',
                                                                borderRadius: '12px',
                                                                cursor: 'pointer',
                                                                fontWeight: '600',
                                                                fontSize: '14px',
                                                                transition: 'backgroundColor 0.2s'
                                                            }}
                                                            onMouseEnter={(e) => e.target.style.backgroundColor = '#2563eb'}
                                                            onMouseLeave={(e) => e.target.style.backgroundColor = '#3b82f6'}
                                                        >
                                                            🔍 Record Diagnosis
                                                        </button>
                                                    )}

                                                    {selectedJob === `cost-${job.id}` ? (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                            <input
                                                                type="number"
                                                                placeholder="Enter cost amount..."
                                                                value={costInput}
                                                                onChange={(e) => setCostInput(e.target.value)}
                                                                style={{
                                                                    padding: '10px 12px',
                                                                    border: '1px solid #e5e7eb',
                                                                    borderRadius: '10px',
                                                                    fontSize: '14px',
                                                                    outline: 'none'
                                                                }}
                                                                autoFocus
                                                            />
                                                            <div style={{ display: 'flex', gap: '10px' }}>
                                                                <button
                                                                    onClick={() => notifyCost(job.id, costInput)}
                                                                    style={{
                                                                        flex: 1,
                                                                        backgroundColor: '#8b5cf6',
                                                                        color: 'white',
                                                                        padding: '10px',
                                                                        border: 'none',
                                                                        borderRadius: '10px',
                                                                        cursor: 'pointer',
                                                                        fontWeight: '500'
                                                                    }}
                                                                >
                                                                    Send
                                                                </button>
                                                                <button
                                                                    onClick={() => setSelectedJob(null)}
                                                                    style={{
                                                                        flex: 1,
                                                                        backgroundColor: '#9ca3af',
                                                                        color: 'white',
                                                                        padding: '10px',
                                                                        border: 'none',
                                                                        borderRadius: '10px',
                                                                        cursor: 'pointer',
                                                                        fontWeight: '500'
                                                                    }}
                                                                >
                                                                    Cancel
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => setSelectedJob(`cost-${job.id}`)}
                                                            style={{
                                                                width: '100%',
                                                                backgroundColor: '#8b5cf6',
                                                                color: 'white',
                                                                padding: '12px',
                                                                border: 'none',
                                                                borderRadius: '12px',
                                                                cursor: 'pointer',
                                                                fontWeight: '600',
                                                                fontSize: '14px',
                                                                transition: 'backgroundColor 0.2s'
                                                            }}
                                                            onMouseEnter={(e) => e.target.style.backgroundColor = '#7c3aed'}
                                                            onMouseLeave={(e) => e.target.style.backgroundColor = '#8b5cf6'}
                                                        >
                                                            💰 Notify Cost to Manager
                                                        </button>
                                                    )}
                                                </div>
                                            )}

                                            {isCompleted && job.completedAt && (
                                                <div style={{
                                                    textAlign: 'center',
                                                    padding: '16px',
                                                    backgroundColor: '#f0fdf4',
                                                    borderRadius: '12px',
                                                    marginTop: '16px'
                                                }}>
                                                    <span style={{ fontSize: '24px', display: 'block', marginBottom: '8px' }}>🎉</span>
                                                    <p style={{ fontSize: '13px', color: '#059669', margin: 0 }}>
                                                        Completed on {job.completedAt}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>

            {/* Add CSS animations */}
            <style>{`
                @keyframes slideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                
                @keyframes spin {
                    from {
                        transform: rotate(0deg);
                    }
                    to {
                        transform: rotate(360deg);
                    }
                }
            `}</style>
        </div>
    );
};

export default Mechanic;
