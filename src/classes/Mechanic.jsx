import { useState } from 'react';
import './App.css';

const Mechanic = () => {
    const [name, setName] = useState("Mike Thompson");
    const [mechanicID, setMechanicID] = useState(101);
    const [assignedJobs, setAssignedJobs] = useState([
        { id: 201, title: "Oil Change", customer: "John Smith", vehicle: "2020 Toyota Camry", status: "pending", priority: "low", vehicleStatusCode: "needs_oil_change", estimatedCost: 49.99 },
        { id: 202, title: "Brake Pad Replacement", customer: "Sarah Johnson", vehicle: "2019 Honda CR-V", status: "in-progress", priority: "high", vehicleStatusCode: "brake_issue", estimatedCost: 299.99 },
        { id: 203, title: "Engine Diagnostics", customer: "Robert Brown", vehicle: "2018 Ford F-150", status: "pending", priority: "medium", vehicleStatusCode: "check_engine", estimatedCost: 149.99 },
        { id: 204, title: "Transmission Fluid Flush", customer: "Emily Davis", vehicle: "2021 Subaru Outback", status: "completed", priority: "low", vehicleStatusCode: "maintenance_due", estimatedCost: 189.99 },
        { id: 205, title: "Check Engine Light", customer: "David Wilson", vehicle: "2017 BMW 3 Series", status: "pending", priority: "high", vehicleStatusCode: "engine_issue", estimatedCost: 399.99 }
    ]);

    // Additional state for UI
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedJob, setSelectedJob] = useState(null);
    const [diagnosisInput, setDiagnosisInput] = useState('');
    const [costInput, setCostInput] = useState('');

    // Record vehicle diagnosis
    const recordVehicleDiagnosis = (jobId, diagnosisCode) => {
        setAssignedJobs(prevJobs =>
            prevJobs.map(job =>
                job.id === jobId
                    ? { ...job, vehicleStatusCode: diagnosisCode, diagnosisRecorded: new Date().toLocaleString() }
                    : job
            )
        );
        console.log(`Job ${jobId} diagnosis recorded: ${diagnosisCode}`);
        setDiagnosisInput('');
        setSelectedJob(null);
    };

    const notifyCost = (jobId, cost) => {
        const job = assignedJobs.find(j => j.id === jobId);
        if (job) {
            // This would typically send to a backend/manager API
            const notification = {
                jobId: job.id,
                customer: job.customer,
                vehicle: job.vehicle,
                cost: parseFloat(cost),
                mechanicId: mechanicID,
                mechanicName: name,
                timestamp: new Date().toISOString()
            };

            // Store in localStorage for manager to access (simulating backend)
            const pendingNotifications = JSON.parse(localStorage.getItem('pendingCostNotifications') || '[]');
            pendingNotifications.push(notification);
            localStorage.setItem('pendingCostNotifications', JSON.stringify(pendingNotifications));

            // Update job with notified cost
            setAssignedJobs(prevJobs =>
                prevJobs.map(job =>
                    job.id === jobId
                        ? { ...job, notifiedCost: parseFloat(cost), costNotifiedAt: new Date().toLocaleString() }
                        : job
                )
            );

            console.log(`Cost $${cost} notified to manager for job ${jobId}`);
            alert(`$${cost} cost notification sent to Manager for customer ${job.customer}`);
        }
        setCostInput('');
        setSelectedJob(null);
    };

    const viewAssignedJobs = () => {
        return assignedJobs;
    };

    const markJobCompleted = (jobId) => {
        setAssignedJobs(prevJobs =>
            prevJobs.map(job =>
                job.id === jobId
                    ? { ...job, status: "completed", completedAt: new Date().toLocaleString() }
                    : job
            )
        );
        console.log(`Job ${jobId} marked as completed`);
    };

    // Helper function to get filtered jobs
    const getFilteredJobs = () => {
        let filtered = assignedJobs.filter(job => job.status !== 'completed');

        if (filter !== 'all') {
            filtered = filtered.filter(job => job.status === filter);
        }

        if (searchTerm) {
            filtered = filtered.filter(job =>
                job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                job.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                job.vehicle.toLowerCase().includes(searchTerm.toLowerCase())
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

    const activeJobs = getFilteredJobs();

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-gradient-to-r from-blue-800 to-blue-900 text-white shadow-lg">
                <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <h1 className="text-2xl font-bold">Mechanic Portal</h1>
                    </div>
                    <div className="flex items-center space-x-3">
                        <div className="text-right">
                            <p className="font-semibold">{name}</p>
                            <p className="text-xs text-blue-200">Mechanic ID: {mechanicID}</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white">
                            {name.charAt(0)}
                        </div>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                {/* Stats Section */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
                        <p className="text-gray-500 text-sm font-medium">Total Jobs</p>
                        <p className="text-3xl font-bold mt-2">{stats.total}</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-yellow-500">
                        <p className="text-gray-500 text-sm font-medium">Pending</p>
                        <p className="text-3xl font-bold mt-2">{stats.pending}</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
                        <p className="text-gray-500 text-sm font-medium">In Progress</p>
                        <p className="text-3xl font-bold mt-2">{stats.inProgress}</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
                        <p className="text-gray-500 text-sm font-medium">Completed</p>
                        <p className="text-3xl font-bold mt-2">{stats.completed}</p>
                    </div>
                </div>

                {/* Controls */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                    <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                        <div className="flex space-x-2">
                            {['all', 'pending', 'in-progress'].map((filterOption) => (
                                <button
                                    key={filterOption}
                                    onClick={() => setFilter(filterOption)}
                                    className={`px-4 py-2 rounded-md transition-colors ${
                                        filter === filterOption
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                                >
                                    {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
                                </button>
                            ))}
                        </div>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search jobs..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-4 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-80"
                            />
                        </div>
                    </div>
                </div>

                {/* Active Jobs */}
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">My Assigned Jobs</h2>
                    {activeJobs.length === 0 ? (
                        <div className="bg-white rounded-lg shadow-md p-12 text-center">
                            <p className="text-gray-500 text-lg">No active jobs assigned</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {activeJobs.map(job => (
                                <div key={job.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-800">{job.title}</h3>
                                            <p className="text-sm text-gray-500">{job.vehicle}</p>
                                        </div>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                            job.priority === 'high' ? 'bg-red-100 text-red-800' :
                                                job.priority === 'medium' ? 'bg-orange-100 text-orange-800' :
                                                    'bg-gray-100 text-gray-800'
                                        }`}>
                                            {job.priority}
                                        </span>
                                    </div>

                                    <div className="space-y-2 mb-4">
                                        <p className="text-sm text-gray-600">Customer: {job.customer}</p>
                                        <p className="text-sm text-gray-600">Status Code: {job.vehicleStatusCode}</p>
                                        <p className="text-sm font-semibold text-gray-700">Est. Cost: ${job.estimatedCost}</p>
                                        {job.notifiedCost && (
                                            <p className="text-sm text-green-600">Notified Cost: ${job.notifiedCost}</p>
                                        )}
                                        {job.diagnosisRecorded && (
                                            <p className="text-xs text-gray-500">Diagnosis: {job.diagnosisRecorded}</p>
                                        )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="space-y-2">
                                        {job.status !== 'completed' && (
                                            <>
                                                <button
                                                    onClick={() => markJobCompleted(job.id)}
                                                    className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                                                >
                                                    Mark Complete
                                                </button>

                                                {selectedJob === job.id ? (
                                                    <div className="space-y-2">
                                                        <input
                                                            type="text"
                                                            placeholder="Diagnosis code..."
                                                            value={diagnosisInput}
                                                            onChange={(e) => setDiagnosisInput(e.target.value)}
                                                            className="w-full px-3 py-2 border rounded-md"
                                                        />
                                                        <button
                                                            onClick={() => recordVehicleDiagnosis(job.id, diagnosisInput)}
                                                            className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                                                        >
                                                            Save Diagnosis
                                                        </button>
                                                        <button
                                                            onClick={() => setSelectedJob(null)}
                                                            className="w-full bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => setSelectedJob(job.id)}
                                                        className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                                                    >
                                                        Record Diagnosis
                                                    </button>
                                                )}

                                                {selectedJob === `cost-${job.id}` ? (
                                                    <div className="space-y-2">
                                                        <input
                                                            type="number"
                                                            placeholder="Enter cost..."
                                                            value={costInput}
                                                            onChange={(e) => setCostInput(e.target.value)}
                                                            className="w-full px-3 py-2 border rounded-md"
                                                        />
                                                        <button
                                                            onClick={() => notifyCost(job.id, costInput)}
                                                            className="w-full bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
                                                        >
                                                            Send Cost to Manager
                                                        </button>
                                                        <button
                                                            onClick={() => setSelectedJob(null)}
                                                            className="w-full bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => setSelectedJob(`cost-${job.id}`)}
                                                        className="w-full bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
                                                    >
                                                        Notify Cost
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Completed Jobs Section */}
                {stats.completed > 0 && (
                    <div className="mt-12">
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">Recently Completed</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {assignedJobs.filter(job => job.status === 'completed').slice(0, 3).map(job => (
                                <div key={job.id} className="bg-gray-50 rounded-lg shadow-md p-6 opacity-75">
                                    <h3 className="text-lg font-semibold text-gray-800">{job.title}</h3>
                                    <p className="text-sm text-gray-500">{job.vehicle}</p>
                                    <p className="text-sm text-gray-600 mt-2">Customer: {job.customer}</p>
                                    {job.completedAt && (
                                        <p className="text-xs text-gray-400 mt-2">Completed: {job.completedAt}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Mechanic;
