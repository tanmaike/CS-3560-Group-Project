import { useState, useEffect } from 'react';
import './Customer.css';

const Customer = () => {
  const [name, setName] = useState("Anthony DiDio");
  const [customerID] = useState(301);
  const [insurancePolicyID, setInsurancePolicyID] = useState(900145);
  const [paymentsDue, setPaymentsDue] = useState(249.99);
  const [vehicles, setVehicles] = useState([]);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [serviceRequests, setServiceRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadCustomerData = async () => {
    setLoading(true);
    try {
      const [vData, srData] = await Promise.all([
        fetch(`/api/customers/${customerID}/vehicles`).then((r) => r.json()),
        fetch(`/api/customers/${customerID}/service-requests`).then((r) => r.json()),
      ]);
      setVehicles(vData.vehicles || []);
      setServiceRequests(srData.requests || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCustomerData(); }, []);

  const createProfile = () => {
    setName("Anthony DiDio");
    setInsurancePolicyID(900145);
    setPaymentsDue(249.99);
  };

  const updateInfo = () => {
    setName("Anthony D.");
  };

  const linkVehicle = () => {
    fetch(`/api/customers/${customerID}/vehicles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        year_num: 2020, 
        make_txt: 'Subaru', 
        model_txt: 'Outback', 
        plate_txt: 'NEW-456', 
        status_txt: 'No Active Service', 
        issue_txt: 'None', 
        appointment_txt: 'No appointment scheduled' 
      }),
    }).then(() => loadCustomerData());
  };

  const viewVehicleStatus = (vehicleId) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (vehicle) {
      alert(`${vehicle.year} ${vehicle.make} ${vehicle.model}: ${vehicle.status}`);
    }
  };

  const linkInsurance = () => {
    setInsurancePolicyID(900999);
  };

  const recordIssueRequest = () => {
    fetch(`/api/customers/${customerID}/service-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        vehicle_txt: '2021 Toyota Corolla', 
        issue_txt: 'Customer-reported issue', 
        est_cost: 120.00 
      }),
    }).then(() => loadCustomerData());
  };

  const makePayment = (money) => {
    setPaymentsDue(prev => Math.max(0, prev - money));
  };

  const getFilteredRequests = () => {
    let filtered = serviceRequests;
    if (filter !== 'all') {
      filtered = filtered.filter(req => req.status === filter);
    }
    if (searchTerm) {
      filtered = filtered.filter(req =>
        req.vehicle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.request?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.status?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return filtered;
  };

  const stats = {
    vehicles: vehicles.length,
    activeRequests: serviceRequests.filter(r => r.status !== 'completed').length,
    completedRequests: serviceRequests.filter(r => r.status === 'completed').length,
    balance: paymentsDue
  };

  const filteredRequests = getFilteredRequests();

  if (loading) {
    return (
      <div className="customer-portal">
        <div className="main-content" style={{ textAlign: 'center', padding: '60px' }}>
          <div className="loading-spinner">Loading your data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="customer-portal">
      {/* Customer Info Header - Below App Navigation */}
      <div className="customer-info-header">
        <div className="customer-info-content">
          <div className="customer-greeting">
            <h1 className="welcome-text">Welcome back, {name}!</h1>
            <p className="customer-id-text">Customer ID: {customerID}</p>
          </div>
          <div className="customer-stats-mini">
            <div className="mini-stat">
              <span className="mini-stat-label">Insurance Policy</span>
              <span className="mini-stat-value">{insurancePolicyID}</span>
            </div>
            <div className="mini-stat">
              <span className="mini-stat-label">Balance Due</span>
              <span className="mini-stat-value" style={{ color: 'var(--accent-red)' }}>
                ${paymentsDue.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Stats Summary Cards */}
        <div className="stats-container">
          <table className="stats-table">
            <thead>
              <tr>
                <th>Vehicles</th>
                <th>Active Requests</th>
                <th>Completed</th>
                <th>Balance Due</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="stat-number">{stats.vehicles}</td>
                <td className="stat-number">{stats.activeRequests}</td>
                <td className="stat-number">{stats.completedRequests}</td>
                <td className="stat-number stat-balance">${stats.balance.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Action Buttons */}
        <div className="action-bar">
          <button className="btn btn-primary" onClick={createProfile}>Create Profile</button>
          <button className="btn btn-secondary" onClick={updateInfo}>Update Info</button>
          <button className="btn btn-primary" onClick={linkVehicle}>Link Vehicle</button>
          <button className="btn btn-secondary" onClick={linkInsurance}>Link Insurance</button>
          <button className="btn btn-primary" onClick={recordIssueRequest}>Request Service</button>
          <button className="btn btn-danger" onClick={() => makePayment(50)}>Pay $50</button>
        </div>

        {/* Filter and Search Bar */}
        <div className="filter-bar">
          <div className="filter-group">
            <button className={`filter-option ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All</button>
            <button className={`filter-option ${filter === 'pending' ? 'active' : ''}`} onClick={() => setFilter('pending')}>Pending</button>
            <button className={`filter-option ${filter === 'in-progress' ? 'active' : ''}`} onClick={() => setFilter('in-progress')}>In Progress</button>
            <button className={`filter-option ${filter === 'completed' ? 'active' : ''}`} onClick={() => setFilter('completed')}>Completed</button>
          </div>
          <div className="search-group">
            <input 
              type="text" 
              className="search-input" 
              placeholder="Search requests..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Vehicles Table */}
        <div className="table-container">
          <h2 className="section-title">My Vehicles</h2>
          <table className="data-table">
            <thead>
              <tr>
                <th>Year</th>
                <th>Make</th>
                <th>Model</th>
                <th>Plate</th>
                <th>Status</th>
                <th>Issue</th>
                <th>Appointment</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map(vehicle => (
                <tr key={vehicle.id}>
                  <td>{vehicle.year}</td>
                  <td>{vehicle.make}</td>
                  <td>{vehicle.model}</td>
                  <td>{vehicle.plate}</td>
                  <td>{vehicle.status}</td>
                  <td>{vehicle.issue || '—'}</td>
                  <td>{vehicle.appointment || '—'}</td>
                  <td className="action-cell">
                    <button className="btn-sm" onClick={() => viewVehicleStatus(vehicle.id)}>View</button>
                  </td>
                </tr>
              ))}
              {vehicles.length === 0 && (
                <tr>
                  <td colSpan="8" className="empty-row">No vehicles found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Service Requests Table */}
        <div className="table-container">
          <h2 className="section-title">Service Requests</h2>
          <table className="data-table">
            <thead>
              <tr>
                <th>Request</th>
                <th>Vehicle</th>
                <th>Status</th>
                <th>Estimated Cost</th>
                <th>Insurance Policy</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map(request => (
                <tr key={request.id}>
                  <td>{request.request}</td>
                  <td>{request.vehicle}</td>
                  <td>
                    <span className={`status-badge status-${request.status.toLowerCase().replace(' ', '-')}`}>
                      {request.status}
                    </span>
                  </td>
                  <td>${request.estimatedCost?.toFixed(2) || '0.00'}</td>
                  <td>{insurancePolicyID}</td>
                </tr>
              ))}
              {filteredRequests.length === 0 && (
                <tr>
                  <td colSpan="5" className="empty-row">No matching service requests</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Recent History Table */}
        {serviceRequests.some(r => r.status === 'completed') && (
          <div className="table-container">
            <h2 className="section-title">Recent History</h2>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Request</th>
                  <th>Vehicle</th>
                  <th>Final Cost</th>
                </tr>
              </thead>
              <tbody>
                {serviceRequests
                  .filter(r => r.status === 'completed')
                  .slice(0, 2)
                  .map(request => (
                    <tr key={request.id}>
                      <td>{request.request}</td>
                      <td>{request.vehicle}</td>
                      <td>${request.estimatedCost?.toFixed(2) || '0.00'}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Customer;