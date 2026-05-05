import { useState, useEffect } from 'react';
import './Customer.css';
import VehiclePopup from './VehiclePopup';
import JobRequestPopup from './JobRequestPopup';
import PaymentPopup from './PaymentPopup';

const Customer = () => {
  const [name, setName] = useState("Anthony DiDio");
  const [customerID] = useState(301);
  const [paymentsDue, setPaymentsDue] = useState(0);
  const [vehicles, setVehicles] = useState([]);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [serviceRequests, setServiceRequests] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);

  // Popup state
  const [showVehiclePopup, setShowVehiclePopup] = useState(false);
  const [showJobRequestPopup, setShowJobRequestPopup] = useState(false);
  const [showPaymentPopup, setShowPaymentPopup] = useState(false);
  const [paymentType, setPaymentType] = useState('full');
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const loadCustomerData = async () => {
    setLoading(true);
    try {
      const [custData, vData, srData, invData] = await Promise.all([
        fetch(`/api/customers/${customerID}`).then((r) => r.json()),
        fetch(`/api/customers/${customerID}/vehicles`).then((r) => r.json()),
        fetch(`/api/customers/${customerID}/service-requests`).then((r) => r.json()),
        fetch(`/api/customers/${customerID}/invoices`).then((r) => r.json()),
      ]);

      if (custData.ok && custData.customer) {
        setName(custData.customer.name);
        setPaymentsDue(custData.customer.paymentsDue);
      }

      setVehicles(vData.vehicles || []);
      setServiceRequests(srData.requests || []);
      setInvoices(invData.invoices || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCustomerData(); }, []);

  const updateInfo = () => {
    setName("Anthony D.");
  };

  const viewVehicleStatus = (vehicleId) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (vehicle) {
      alert(`${vehicle.year} ${vehicle.make} ${vehicle.model}: ${vehicle.status}`);
    }
  };

  const makePayment = async (amount, invoiceId = null) => {
    try {
      if (invoiceId) {
        const res = await fetch(`/api/invoices/${invoiceId}/pay`, {
          method: 'PATCH',
        });
        const data = await res.json();
        if (!res.ok) {
          alert(data.msg || 'Payment failed');
          return;
        }
      } else {
        const res = await fetch(`/api/customers/${customerID}/payment`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount_num: amount }),
        });
        const data = await res.json();
        if (!res.ok) {
          alert(data.msg || 'Payment failed');
          return;
        }
      }
      await loadCustomerData();
    } catch (error) {
      console.error('Payment failed:', error);
      alert('Payment failed. Please try again.');
    }
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
    activeRequests: serviceRequests.filter(r => r.status !== 'completed' && r.status !== 'terminated').length,
    completedRequests: serviceRequests.filter(r => r.status === 'completed').length,
    balance: paymentsDue
  };

  const filteredRequests = getFilteredRequests();

  const getStatusBadgeClass = (status) => {
    switch(status) {
      case 'pending': return 'status-pending';
      case 'assigned': return 'status-in-progress';
      case 'in-progress': return 'status-in-progress';
      case 'quoted': return 'status-in-progress';
      case 'completed': return 'status-completed';
      case 'terminated': return 'status-pending';
      default: return 'status-pending';
    }
  };

  const getStatusLabel = (status) => {
    switch(status) {
      case 'pending': return 'Pending';
      case 'assigned': return 'Assigned';
      case 'in-progress': return 'In Progress';
      case 'quoted': return 'Quote Ready';
      case 'completed': return 'Completed';
      case 'terminated': return 'Terminated';
      default: return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

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
        {/* Popups */}
        {showVehiclePopup && (
            <VehiclePopup
                customerID={customerID}
                onClose={() => setShowVehiclePopup(false)}
                onSuccess={loadCustomerData}
            />
        )}

        {showJobRequestPopup && (
            <JobRequestPopup
                customerID={customerID}
                customerName={name}
                onClose={() => setShowJobRequestPopup(false)}
                onSuccess={loadCustomerData}
            />
        )}

        {showPaymentPopup && (
            <PaymentPopup
                balanceDue={paymentType === 'full'
                    ? paymentsDue
                    : (invoices.find(inv => inv.ping_id === selectedInvoice)?.amount_num || 0)
                }
                invoiceAmount={paymentType === 'invoice' && selectedInvoice
                    ? invoices.find(inv => inv.ping_id === selectedInvoice)?.amount_num || 0
                    : null
                }
                invoiceId={paymentType === 'invoice' ? selectedInvoice : null}
                isPayAll={paymentType === 'payAll'}
                onClose={() => {
                  setShowPaymentPopup(false);
                  setSelectedInvoice(null);
                  setPaymentType('full');
                }}
                onPayment={(amount, invoiceId) => {
                  makePayment(amount, invoiceId);
                }}
            />
        )}

        {/* Customer Info Header */}
        <div className="customer-info-header">
          <div className="customer-info-content">
            <div className="customer-greeting">
              <h1 className="welcome-text">Welcome back, {name}!</h1>
              <p className="customer-id-text">Customer ID: {customerID}</p>
            </div>
            <div className="customer-stats-mini">
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
            <button className="btn btn-primary" onClick={() => setShowVehiclePopup(true)}>
              Add Vehicle
            </button>
            <button className="btn btn-primary" onClick={() => setShowJobRequestPopup(true)}>
              Request Service
            </button>
            <button className="btn btn-secondary" onClick={updateInfo}>Update Info</button>
            {paymentsDue > 0 && (
                <button
                    className="btn btn-danger"
                    onClick={() => {
                      setPaymentType('full');
                      setSelectedInvoice(null);
                      setShowPaymentPopup(true);
                    }}
                >
                  Pay Balance (${paymentsDue.toFixed(2)})
                </button>
            )}
          </div>

          {/* Filter and Search Bar */}
          <div className="filter-bar">
            <div className="filter-group">
              <button className={`filter-option ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All</button>
              <button className={`filter-option ${filter === 'pending' ? 'active' : ''}`} onClick={() => setFilter('pending')}>Pending</button>
              <button className={`filter-option ${filter === 'assigned' ? 'active' : ''}`} onClick={() => setFilter('assigned')}>Assigned</button>
              <button className={`filter-option ${filter === 'in-progress' ? 'active' : ''}`} onClick={() => setFilter('in-progress')}>In Progress</button>
              <button className={`filter-option ${filter === 'quoted' ? 'active' : ''}`} onClick={() => setFilter('quoted')}>Quoted</button>
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
                    <td>{vehicle.issue || '\u2014'}</td>
                    <td>{vehicle.appointment || '\u2014'}</td>
                    <td className="action-cell">
                      <button className="btn-sm" onClick={() => viewVehicleStatus(vehicle.id)}>View</button>
                    </td>
                  </tr>
              ))}
              {vehicles.length === 0 && (
                  <tr>
                    <td colSpan="8" className="empty-row">
                      No vehicles yet &mdash; <button className="btn-sm" onClick={() => setShowVehiclePopup(true)}>Add your first vehicle</button>
                    </td>
                  </tr>
              )}
              </tbody>
            </table>
          </div>

          {/* Service Requests Table */}
          <div className="table-container">
            <h2 className="section-title">Service Requests &amp; Status</h2>
            <table className="data-table">
              <thead>
              <tr>
                <th>Request</th>
                <th>Vehicle</th>
                <th>Status</th>
                <th>Estimated Cost</th>
                <th>Invoice</th>
                <th>Action</th>
              </tr>
              </thead>
              <tbody>
              {filteredRequests.map(request => {
                const invoice = request.invoiceId
                    ? invoices.find(inv => inv.ping_id === request.invoiceId)
                    : null;
                const isInvoicePaid = invoice?.paid_at;

                return (
                    <tr key={request.id}>
                      <td>{request.request}</td>
                      <td>{request.vehicle}</td>
                      <td>
                      <span className={`status-badge ${getStatusBadgeClass(request.status)}`}>
                        {getStatusLabel(request.status)}
                      </span>
                        {request.completedAt && (
                            <div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>
                              {new Date(request.completedAt).toLocaleDateString()}
                            </div>
                        )}
                      </td>
                      <td>${request.estimatedCost?.toFixed(2) || '0.00'}</td>
                      <td>
                        {request.invoiceAmount != null ? (
                            <span style={{ color: isInvoicePaid ? '#888' : '#059669', fontWeight: 600 }}>
                          ${request.invoiceAmount?.toFixed(2)}
                              {isInvoicePaid && <span style={{ fontSize: '11px', marginLeft: '6px', color: '#10b981' }}>Paid</span>}
                        </span>
                        ) : request.status === 'quoted' ? (
                            <span style={{ color: '#eab308', fontSize: '12px' }}>Awaiting invoice</span>
                        ) : (
                            '\u2014'
                        )}
                      </td>
                      <td>
                        {request.invoiceId && !isInvoicePaid && (
                            <button
                                className="btn-sm"
                                style={{ background: '#10b981', color: 'white' }}
                                onClick={() => {
                                  setPaymentType('invoice');
                                  setSelectedInvoice(request.invoiceId);
                                  setShowPaymentPopup(true);
                                }}
                            >
                              Pay Invoice
                            </button>
                        )}
                        {isInvoicePaid && (
                            <span style={{ fontSize: '12px', color: '#10b981' }}>Paid</span>
                        )}
                        {!request.invoiceId && request.status === 'completed' && paymentsDue > 0 && (
                            <button
                                className="btn-sm"
                                onClick={() => {
                                  setPaymentType('full');
                                  setSelectedInvoice(null);
                                  setShowPaymentPopup(true);
                                }}
                            >
                              Pay Balance
                            </button>
                        )}
                      </td>
                    </tr>
                );
              })}
              {filteredRequests.length === 0 && (
                  <tr>
                    <td colSpan="6" className="empty-row">
                      No service requests yet &mdash; <button className="btn-sm" onClick={() => setShowJobRequestPopup(true)}>Request a service</button>
                    </td>
                  </tr>
              )}
              </tbody>
            </table>
          </div>

          {/* Invoices Table */}
          {invoices.length > 0 && (
              <div className="table-container">
                <h2 className="section-title">Invoices</h2>
                <table className="data-table">
                  <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Vehicle</th>
                    <th>Service</th>
                    <th>Amount</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                  </thead>
                  <tbody>
                  {invoices.map(inv => (
                      <tr key={inv.ping_id} style={inv.paid_at ? { opacity: 0.65 } : {}}>
                        <td>#{inv.ping_id}</td>
                        <td>{inv.vehicle_txt}</td>
                        <td>{inv.title_txt || 'Service'}</td>
                        <td style={{ color: inv.paid_at ? '#888' : '#059669', fontWeight: 600 }}>
                          ${inv.amount_num?.toFixed(2)}
                        </td>
                        <td>{inv.made_at ? new Date(inv.made_at).toLocaleDateString() : '\u2014'}</td>
                        <td>
                          {inv.paid_at ? (
                              <span className="status-badge status-completed">Paid</span>
                          ) : (
                              <span className="status-badge status-pending">Unpaid</span>
                          )}
                        </td>
                        <td>
                          {!inv.paid_at ? (
                              <button
                                  className="btn-sm"
                                  style={{ background: '#10b981', color: 'white' }}
                                  onClick={() => {
                                    setPaymentType('invoice');
                                    setSelectedInvoice(inv.ping_id);
                                    setShowPaymentPopup(true);
                                  }}
                              >
                                Pay Invoice
                              </button>
                          ) : (
                              <span style={{ fontSize: '12px', color: '#888' }}>
                          Paid {new Date(inv.paid_at).toLocaleDateString()}
                        </span>
                          )}
                        </td>
                      </tr>
                  ))}
                  </tbody>
                </table>
              </div>
          )}

          {/* Unpaid Invoices Summary */}
          {invoices.filter(inv => !inv.paid_at).length > 0 && (
              <div className="action-bar" style={{ marginTop: '16px' }}>
            <span style={{ marginRight: '12px', fontWeight: 600, color: '#666' }}>
              {invoices.filter(inv => !inv.paid_at).length} unpaid invoice(s) &mdash;
              Total: ${invoices.filter(inv => !inv.paid_at).reduce((sum, inv) => sum + inv.amount_num, 0).toFixed(2)}
            </span>
                <button
                    className="btn btn-danger"
                    onClick={() => {
                      setPaymentType('payAll');
                      setSelectedInvoice(null);
                      setShowPaymentPopup(true);
                    }}
                >
                  Pay All Invoices
                </button>
              </div>
          )}

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
                    <th>Completed</th>
                    <th>Payment</th>
                  </tr>
                  </thead>
                  <tbody>
                  {serviceRequests
                      .filter(r => r.status === 'completed')
                      .slice(0, 5)
                      .map(request => {
                        const invoice = request.invoiceId
                            ? invoices.find(inv => inv.ping_id === request.invoiceId)
                            : null;

                        return (
                            <tr key={request.id}>
                              <td>{request.request}</td>
                              <td>{request.vehicle}</td>
                              <td>${request.estimatedCost?.toFixed(2) || '0.00'}</td>
                              <td>{request.completedAt ? new Date(request.completedAt).toLocaleDateString() : '\u2014'}</td>
                              <td>
                                {invoice?.paid_at ? (
                                    <span className="status-badge status-completed">Paid</span>
                                ) : request.invoiceId ? (
                                    <span className="status-badge status-pending">Unpaid</span>
                                ) : (
                                    '\u2014'
                                )}
                              </td>
                            </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
          )}
        </div>
      </div>
  );
};

export default Customer;