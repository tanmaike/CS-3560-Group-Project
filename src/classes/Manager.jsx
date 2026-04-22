import { useState } from 'react';

const getStatusColor = (status) => {
    switch (status) {
        case 'pending':    return { bg: '#fefce8', text: '#854d0e', border: '#fde047' };
        case 'assigned':   return { bg: '#eff6ff', text: '#1d4ed8', border: '#93c5fd' };
        case 'quoted':     return { bg: '#f0fdf4', text: '#166534', border: '#86efac' };
        case 'terminated': return { bg: '#fef2f2', text: '#991b1b', border: '#fca5a5' };
        default:           return { bg: '#f3f4f6', text: '#374151', border: '#d1d5db' };
    }
};

function Manager() {
    const [manager] = useState({ name: 'Manager', managerID: 1 });

    const [jobs, setJobs] = useState([
        { jobId: 101, vehicleId: 5001, customerName: 'John Doe',   mechanicId: null, diagnosis: 'Need brake pad replacement', jobQuote: 0,   jobStatus: 'pending'  },
        { jobId: 102, vehicleId: 5002, customerName: 'Jane Smith', mechanicId: 2,    diagnosis: 'Oil leak',                  jobQuote: 250, jobStatus: 'assigned' },
    ]);

    const [mechanics, setMechanics] = useState([
        { mechanicId: 1, name: 'Alex',   assignedJobs: []    },
        { mechanicId: 2, name: 'Chris',  assignedJobs: [102] },
        { mechanicId: 3, name: 'Taylor', assignedJobs: []    },
    ]);

    const [activeTab,      setActiveTab]      = useState('active');
    const [searchTerm,     setSearchTerm]     = useState('');
    const [selectedJobId,  setSelectedJobId]  = useState(null);
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

    function withLoading(fn) {
        setIsLoading(true);
        setTimeout(() => { fn(); setIsLoading(false); }, 400);
    }

    // ── logic ──────────────────────────────────────────────────────────────────

    const terminateJob = (jobId) => {
        const parsedJobId = Number(jobId);
        if (!parsedJobId) return;
        const jobToTerminate = jobs.find((j) => j.jobId === parsedJobId);
        if (!jobToTerminate) return;
        withLoading(() => {
            if (jobToTerminate.mechanicId !== null) {
                setMechanics((prev) =>
                    prev.map((m) =>
                        m.mechanicId === jobToTerminate.mechanicId
                            ? { ...m, assignedJobs: m.assignedJobs.filter((id) => id !== parsedJobId) }
                            : m
                    )
                );
            }
            setJobs((prev) =>
                prev.map((j) => j.jobId === parsedJobId ? { ...j, jobStatus: 'terminated', mechanicId: null } : j)
            );
            setSelectedJobId(null);
            notify(`Job #${parsedJobId} has been terminated`);
        });
    };

    const recordQuote = (jobId, amount) => {
        const parsedJobId = Number(jobId);
        const parsedAmount = Number(amount);
        if (!parsedJobId || Number.isNaN(parsedAmount) || parsedAmount < 0) return;
        withLoading(() => {
            setJobs((prev) =>
                prev.map((j) =>
                    j.jobId === parsedJobId ? { ...j, jobQuote: parsedAmount, jobStatus: 'quoted' } : j
                )
            );
            setQuoteJobId(null);
            setQuoteInput('');
            notify(`Quote of $${parsedAmount.toFixed(2)} saved for job #${parsedJobId}`);
        });
    };

    const updateQuote = (jobId, newAmount) => {
        const parsedJobId = Number(jobId);
        const parsedAmount = Number(newAmount);
        if (!parsedJobId || Number.isNaN(parsedAmount)) return;
        setJobs((prev) =>
            prev.map((j) => j.jobId === parsedJobId ? { ...j, jobQuote: parsedAmount } : j)
        );
    };

    const assignMechanics = (jobId, mechanicId) => {
        const parsedJobId = Number(jobId);
        const parsedMechanicId = Number(mechanicId);
        if (!parsedJobId || !parsedMechanicId) return;
        withLoading(() => {
            setJobs((prev) =>
                prev.map((j) =>
                    j.jobId === parsedJobId ? { ...j, mechanicId: parsedMechanicId, jobStatus: 'assigned' } : j
                )
            );
            setMechanics((prev) =>
                prev.map((m) => {
                    if (m.mechanicId !== parsedMechanicId) return m;
                    return {
                        ...m,
                        assignedJobs: m.assignedJobs.includes(parsedJobId)
                            ? m.assignedJobs
                            : [...m.assignedJobs, parsedJobId],
                    };
                })
            );
            const mechName = mechanics.find((m) => m.mechanicId === parsedMechanicId)?.name;
            setAssignJobId(null);
            setSelectedMechId(null);
            notify(`${mechName} assigned to job #${parsedJobId}`);
        });
    };

    const unassignMechanic = (jobId) => {
        const job = jobs.find((j) => j.jobId === jobId);
        if (!job || job.mechanicId === null) return;
        withLoading(() => {
            setMechanics((prev) =>
                prev.map((m) =>
                    m.mechanicId === job.mechanicId
                        ? { ...m, assignedJobs: m.assignedJobs.filter((id) => id !== jobId) }
                        : m
                )
            );
            setJobs((prev) =>
                prev.map((j) => j.jobId === jobId ? { ...j, mechanicId: null, jobStatus: 'pending' } : j)
            );
            notify(`Mechanic unassigned from job #${jobId}`);
        });
    };

    // ── derived ────────────────────────────────────────────────────────────────

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

    const activeJobs     = jobs.filter((j) => j.jobStatus !== 'terminated');
    const terminatedJobs = jobs.filter((j) => j.jobStatus === 'terminated');
    const displayedJobs  = (activeTab === 'active' ? activeJobs : terminatedJobs)
        .filter((j) =>
            searchTerm === '' ||
            String(j.jobId).includes(searchTerm) ||
            j.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            String(j.vehicleId).includes(searchTerm) ||
            j.diagnosis.toLowerCase().includes(searchTerm.toLowerCase())
        );

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>

            {/* Notification Toast */}
            {showNotification && (
                <div style={{
                    position: 'fixed', top: '20px', right: '20px', zIndex: 1000,
                    padding: '16px 24px', borderRadius: '12px',
                    backgroundColor: showNotification.type === 'success' ? '#10b981' : '#ef4444',
                    color: 'white', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                    animation: 'slideIn 0.3s ease-out', fontWeight: '500'
                }}>
                    {showNotification.message}
                </div>
            )}

            {/* Loading Overlay */}
            {isLoading && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 999,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '16px', textAlign: 'center' }}>
                        <div style={{
                            width: '40px', height: '40px', border: '3px solid #e5e7eb',
                            borderTopColor: '#1e40af', borderRadius: '50%',
                            animation: 'spin 1s linear infinite', margin: '0 auto 12px'
                        }} />
                        <p>Processing...</p>
                    </div>
                </div>
            )}

            {/* Header */}
            <header style={{
                background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)',
                color: 'white', padding: '20px 32px',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
            }}>
                <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            width: '48px', height: '48px', backgroundColor: 'rgba(255,255,255,0.2)',
                            borderRadius: '12px', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', fontSize: '24px'
                        }}>📋</div>
                        <div>
                            <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: 0 }}>Manager Portal</h1>
                            <p style={{ fontSize: '14px', opacity: 0.9, margin: '4px 0 0' }}>Job & Mechanic Management</p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div style={{ textAlign: 'right' }}>
                            <p style={{ fontWeight: 'bold', margin: 0 }}>{manager.name}</p>
                            <p style={{ fontSize: '12px', opacity: 0.9, margin: '4px 0 0' }}>ID: {manager.managerID}</p>
                        </div>
                        <div style={{
                            width: '48px', height: '48px', borderRadius: '50%',
                            background: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 'bold', fontSize: '20px', border: '2px solid rgba(255,255,255,0.3)'
                        }}>M</div>
                    </div>
                </div>
            </header>

            <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px' }}>

                {/* Stats Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', marginBottom: '32px' }}>
                    {[
                        { label: 'Total Jobs',  value: stats.total,      icon: '📋', accent: '#3b82f6', bg: 'white' },
                        { label: 'Pending',     value: stats.pending,    icon: '⏳', accent: '#eab308', bg: '#fefce8' },
                        { label: 'Assigned',    value: stats.assigned,   icon: '🔧', accent: '#2563eb', bg: '#eff6ff' },
                        { label: 'Quoted',      value: stats.quoted,     icon: '💰', accent: '#10b981', bg: '#ecfdf5' },
                        { label: 'Terminated',  value: stats.terminated, icon: '🚫', accent: '#ef4444', bg: '#fef2f2' },
                    ].map(({ label, value, icon, accent, bg }) => (
                        <div key={label} style={{
                            background: `linear-gradient(135deg, white 0%, ${bg} 100%)`,
                            borderRadius: '16px', padding: '24px',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                            borderLeft: `4px solid ${accent}`
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <p style={{ color: '#6b7280', fontSize: '14px', fontWeight: '500', margin: '0 0 8px' }}>{label}</p>
                                    <p style={{ fontSize: '36px', fontWeight: 'bold', margin: 0, color: '#1f2937' }}>{value}</p>
                                </div>
                                <div style={{ fontSize: '32px', opacity: 0.7 }}>{icon}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Search and Tab Bar */}
                <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '20px 24px', marginBottom: '32px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                        <div style={{ display: 'flex', gap: '8px', backgroundColor: '#f3f4f6', padding: '4px', borderRadius: '12px' }}>
                            {['active', 'terminated'].map((tab) => (
                                <button key={tab} onClick={() => setActiveTab(tab)} style={{
                                    padding: '10px 24px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                                    fontWeight: '500',
                                    backgroundColor: activeTab === tab ? '#1e40af' : 'transparent',
                                    color: activeTab === tab ? 'white' : '#6b7280',
                                    transition: 'all 0.2s'
                                }}>
                                    {tab === 'active' ? 'Active Jobs' : 'Terminated'}
                                </button>
                            ))}
                        </div>
                        <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
                            <input
                                type="text"
                                placeholder="🔍 Search by job, customer, or vehicle..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    width: '100%', padding: '10px 16px',
                                    border: '1px solid #e5e7eb', borderRadius: '12px',
                                    fontSize: '14px', outline: 'none', boxSizing: 'border-box'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#1e40af'}
                                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                            />
                        </div>
                    </div>
                </div>

                {/* Jobs Grid */}
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
                            {activeTab === 'active' ? '📌 Active Jobs' : '🚫 Terminated Jobs'}
                        </h2>
                        <p style={{ color: '#6b7280', fontSize: '14px' }}>
                            {displayedJobs.length} job{displayedJobs.length !== 1 ? 's' : ''} found
                        </p>
                    </div>

                    {displayedJobs.length === 0 ? (
                        <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '64px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                            <div style={{ fontSize: '64px', marginBottom: '16px' }}>📋</div>
                            <p style={{ color: '#6b7280', fontSize: '18px', margin: 0 }}>No jobs found</p>
                            <p style={{ color: '#9ca3af', fontSize: '14px', marginTop: '8px' }}>
                                {searchTerm ? 'Try adjusting your search' : 'Nothing here yet!'}
                            </p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '24px' }}>
                            {displayedJobs.map((job) => {
                                const statusStyle = getStatusColor(job.jobStatus);
                                const assignedMech = job.mechanicId ? mechanics.find((m) => m.mechanicId === job.mechanicId) : null;
                                const isTerminated = job.jobStatus === 'terminated';

                                return (
                                    <div key={job.jobId} style={{
                                        backgroundColor: 'white', borderRadius: '16px',
                                        overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                        transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'pointer'
                                    }}
                                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0,0,0,0.15)'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)'; }}
                                    >
                                        {/* Card Header */}
                                        <div style={{
                                            padding: '20px 24px',
                                            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                                            borderBottom: '1px solid #e5e7eb'
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <div>
                                                    <span style={{
                                                        backgroundColor: statusStyle.bg, color: statusStyle.text,
                                                        padding: '4px 10px', borderRadius: '12px', fontSize: '12px',
                                                        fontWeight: '600', border: `1px solid ${statusStyle.border}`
                                                    }}>
                                                        {job.jobStatus.toUpperCase()}
                                                    </span>
                                                    <h3 style={{ fontSize: '20px', fontWeight: 'bold', margin: '10px 0 4px', color: '#1f2937' }}>
                                                        Job #{job.jobId}
                                                    </h3>
                                                    <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
                                                        Vehicle #{job.vehicleId}
                                                    </p>
                                                </div>
                                                <div style={{ fontSize: '28px' }}>
                                                    {isTerminated ? '🚫' : job.jobStatus === 'quoted' ? '💰' : job.jobStatus === 'assigned' ? '🔧' : '⏳'}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Card Body */}
                                        <div style={{ padding: '20px 24px' }}>
                                            {[
                                                { icon: '👤', label: 'Customer',  value: job.customerName },
                                                { icon: '🔍', label: 'Diagnosis', value: job.diagnosis    },
                                                { icon: '👷', label: 'Mechanic',  value: assignedMech ? `${assignedMech.name} (ID: ${assignedMech.mechanicId})` : 'Unassigned' },
                                            ].map(({ icon, label, value }) => (
                                                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
                                                    <span style={{ fontSize: '20px' }}>{icon}</span>
                                                    <div>
                                                        <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>{label}</p>
                                                        <p style={{ fontSize: '14px', fontWeight: '500', margin: '4px 0 0', color: '#374151' }}>{value}</p>
                                                    </div>
                                                </div>
                                            ))}

                                            {/* Quote display */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0' }}>
                                                <span style={{ fontSize: '20px' }}>💵</span>
                                                <div>
                                                    <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>Quote</p>
                                                    <p style={{ fontSize: '18px', fontWeight: 'bold', margin: '4px 0 0', color: job.jobQuote > 0 ? '#059669' : '#9ca3af' }}>
                                                        {job.jobQuote > 0 ? `$${job.jobQuote.toFixed(2)}` : 'Not set'}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            {!isTerminated && (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>

                                                    {/* Set Quote */}
                                                    {quoteJobId === job.jobId ? (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                            <input
                                                                type="number"
                                                                placeholder="Enter quote amount..."
                                                                value={quoteInput}
                                                                onChange={(e) => setQuoteInput(e.target.value)}
                                                                style={{ padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '10px', fontSize: '14px', outline: 'none' }}
                                                                autoFocus
                                                            />
                                                            <div style={{ display: 'flex', gap: '10px' }}>
                                                                <button onClick={() => recordQuote(job.jobId, quoteInput)} style={{ flex: 1, backgroundColor: '#10b981', color: 'white', padding: '10px', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '500' }}>
                                                                    Save
                                                                </button>
                                                                <button onClick={() => { setQuoteJobId(null); setQuoteInput(''); }} style={{ flex: 1, backgroundColor: '#9ca3af', color: 'white', padding: '10px', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '500' }}>
                                                                    Cancel
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <button onClick={() => { setQuoteJobId(job.jobId); setQuoteInput(job.jobQuote > 0 ? String(job.jobQuote) : ''); }}
                                                            style={{ width: '100%', backgroundColor: '#10b981', color: 'white', padding: '12px', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}
                                                            onMouseEnter={(e) => e.target.style.backgroundColor = '#059669'}
                                                            onMouseLeave={(e) => e.target.style.backgroundColor = '#10b981'}
                                                        >
                                                            💰 {job.jobQuote > 0 ? 'Update Quote' : 'Set Quote'}
                                                        </button>
                                                    )}

                                                    {/* Assign Mechanic */}
                                                    {assignJobId === job.jobId ? (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                            <p style={{ fontSize: '13px', fontWeight: '600', color: '#374151', margin: '0 0 4px' }}>Select a mechanic:</p>
                                                            {mechanics.map((m) => {
                                                                const count = activeJobCount(m.mechanicId);
                                                                const isSelected = selectedMechId === m.mechanicId;
                                                                return (
                                                                    <div key={m.mechanicId}
                                                                        onClick={() => setSelectedMechId(isSelected ? null : m.mechanicId)}
                                                                        style={{
                                                                            display: 'flex', alignItems: 'center', gap: '10px',
                                                                            padding: '10px 12px', borderRadius: '10px', cursor: 'pointer',
                                                                            border: `1px solid ${isSelected ? '#1e40af' : '#e5e7eb'}`,
                                                                            backgroundColor: isSelected ? '#eff6ff' : 'white',
                                                                            transition: 'all 0.15s'
                                                                        }}>
                                                                        <div style={{
                                                                            width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                                                                            backgroundColor: count === 0 ? '#10b981' : count <= 2 ? '#f59e0b' : '#ef4444'
                                                                        }} />
                                                                        <div style={{ flex: 1 }}>
                                                                            <span style={{ fontSize: '13px', fontWeight: '500', color: '#1f2937' }}>{m.name}</span>
                                                                            <span style={{ fontSize: '12px', color: '#6b7280', marginLeft: '8px' }}>
                                                                                {count === 0 ? 'Free' : `${count} job${count !== 1 ? 's' : ''}`}
                                                                            </span>
                                                                        </div>
                                                                        {isSelected && <span style={{ fontSize: '16px' }}>✓</span>}
                                                                    </div>
                                                                );
                                                            })}
                                                            <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                                                                <button
                                                                    onClick={() => assignMechanics(job.jobId, selectedMechId)}
                                                                    disabled={!selectedMechId}
                                                                    style={{ flex: 1, backgroundColor: selectedMechId ? '#1e40af' : '#9ca3af', color: 'white', padding: '10px', border: 'none', borderRadius: '10px', cursor: selectedMechId ? 'pointer' : 'not-allowed', fontWeight: '500' }}
                                                                >
                                                                    Assign
                                                                </button>
                                                                <button onClick={() => { setAssignJobId(null); setSelectedMechId(null); }} style={{ flex: 1, backgroundColor: '#9ca3af', color: 'white', padding: '10px', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '500' }}>
                                                                    Cancel
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <button onClick={() => { setAssignJobId(job.jobId); setSelectedMechId(job.mechanicId); }}
                                                            style={{ width: '100%', backgroundColor: '#3b82f6', color: 'white', padding: '12px', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}
                                                            onMouseEnter={(e) => e.target.style.backgroundColor = '#2563eb'}
                                                            onMouseLeave={(e) => e.target.style.backgroundColor = '#3b82f6'}
                                                        >
                                                            👷 {assignedMech ? 'Reassign Mechanic' : 'Assign Mechanic'}
                                                        </button>
                                                    )}

                                                    {/* Unassign */}
                                                    {assignedMech && assignJobId !== job.jobId && (
                                                        <button onClick={() => unassignMechanic(job.jobId)}
                                                            style={{ width: '100%', backgroundColor: '#f3f4f6', color: '#374151', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '12px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}
                                                            onMouseEnter={(e) => e.target.style.backgroundColor = '#e5e7eb'}
                                                            onMouseLeave={(e) => e.target.style.backgroundColor = '#f3f4f6'}
                                                        >
                                                            ✖ Unassign Mechanic
                                                        </button>
                                                    )}

                                                    {/* Terminate */}
                                                    <button onClick={() => terminateJob(job.jobId)}
                                                        style={{ width: '100%', backgroundColor: '#fef2f2', color: '#991b1b', padding: '12px', border: '1px solid #fca5a5', borderRadius: '12px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}
                                                        onMouseEnter={(e) => e.target.style.backgroundColor = '#fee2e2'}
                                                        onMouseLeave={(e) => e.target.style.backgroundColor = '#fef2f2'}
                                                    >
                                                        🚫 Terminate Job
                                                    </button>
                                                </div>
                                            )}

                                            {isTerminated && (
                                                <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#fef2f2', borderRadius: '12px', marginTop: '16px' }}>
                                                    <span style={{ fontSize: '24px', display: 'block', marginBottom: '8px' }}>🚫</span>
                                                    <p style={{ fontSize: '13px', color: '#991b1b', margin: 0 }}>This job has been terminated</p>
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

            <style>{`
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to   { transform: translateX(0);    opacity: 1; }
                }
                @keyframes spin {
                    from { transform: rotate(0deg);   }
                    to   { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}

export default Manager;