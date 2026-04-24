import { useMemo, useState } from 'react';
import '../App.css';

// Customer Portal
const statusStyles = {
  pending: { bg: '#fef3c7', text: '#d97706', border: '#fde68a', label: 'Pending' },
  'in-progress': { bg: '#dbeafe', text: '#2563eb', border: '#93c5fd', label: 'In Progress' },
  quoted: { bg: '#f0fdf4', text: '#166534', border: '#86efac', label: 'Quote Ready' },
  approved: { bg: '#ecfdf5', text: '#059669', border: '#86efac', label: 'Approved' },
  completed: { bg: '#d1fae5', text: '#059669', border: '#86efac', label: 'Completed' },
  cancelled: { bg: '#fef2f2', text: '#991b1b', border: '#fca5a5', label: 'Cancelled' },
};

const vehicleStyles = {
  'In Service': { bg: '#eff6ff', text: '#2563eb', border: '#93c5fd' },
  'Ready for Pickup': { bg: '#ecfdf5', text: '#059669', border: '#86efac' },
  'No Active Service': { bg: '#f3f4f6', text: '#6b7280', border: '#d1d5db' },
  'Awaiting Approval': { bg: '#fffbeb', text: '#d97706', border: '#fde68a' },
};

const formatMoney = (value) => `$${Number(value || 0).toFixed(2)}`;
const getStatusColor = (status) => statusStyles[status] || {
  bg: '#f3f4f6', text: '#6b7280', border: '#d1d5db', label: String(status).toUpperCase(),
};
const getVehicleStatusColor = (status) => vehicleStyles[status] || vehicleStyles['No Active Service'];

const Customer = () => {
  // Customer Info
  const [customer, setCustomer] = useState({
    name: 'Mitchell Sorenstein',
    customerID: 301,
    phone: '(123) 456-7890',
    email: 'woooooo@gmail.com',
    insurancePolicyID: 900145,
    preferredContact: 'Text Message',
  });


  // Payments
  const [paymentsDue, setPaymentsDue] = useState(249.99);
  const [paymentInput, setPaymentInput] = useState('50');

  // UI State
  const [activeTab, setActiveTab] = useState('active');
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [showProfileEditor, setShowProfileEditor] = useState(false);
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);

  // Notifications / Loading
  const [showNotification, setShowNotification] = useState(null);
  const [isLoading, setIsLoading] = useState(false);


  // Form Data
  const [profileForm, setProfileForm] = useState({
    name: customer.name,
    phone: customer.phone,
    email: customer.email,
    preferredContact: customer.preferredContact,
  });

  const [vehicleForm, setVehicleForm] = useState({
    year: '2020', make: 'Subaru', model: 'Outback', plate: 'NEW-456', mileage: '48500', vin: 'JF2SKAJC7LH123456',
  });

  const [requestForm, setRequestForm] = useState({
    vehicleId: '1', request: 'Customer-reported issue', preferredDate: '2026-04-29', notes: 'Please inspect and call before repairs.',
  });


  // Vehicles
  const [vehicles, setVehicles] = useState([
    { id: 1, year: 2021, make: 'Toyota', model: 'Corolla', plate: 'ABC-123', mileage: 38250, vin: '5YFEPMAE1MP123456', status: 'In Service', issue: 'Brake inspection', appointment: '2026-04-28 10:00 AM' },
    { id: 2, year: 2018, make: 'Honda', model: 'Civic', plate: 'XYZ-789', mileage: 64010, vin: '2HGFC2F59JH654321', status: 'Ready for Pickup', issue: 'Oil change', appointment: 'Pickup available today' },
  ]);


  // Service Requests
  const [serviceRequests, setServiceRequests] = useState([
    { id: 501, vehicleId: 1, vehicle: '2021 Toyota Corolla', request: 'Brake inspection', status: 'quoted', estimatedCost: 180, approved: false, mechanic: 'Chris', appointment: '2026-04-28 10:00 AM', notes: 'Front pads are worn. Approval needed before work begins.', updatedAt: '2026-04-24 8:45 AM' },
    { id: 502, vehicleId: 2, vehicle: '2018 Honda Civic', request: 'Oil change', status: 'completed', estimatedCost: 59.99, approved: true, mechanic: 'Taylor', appointment: '2026-04-20 2:30 PM', notes: 'Service complete. Vehicle is ready for pickup.', updatedAt: '2026-04-20 3:15 PM' },
    { id: 503, vehicleId: 1, vehicle: '2021 Toyota Corolla', request: 'Tire rotation', status: 'in-progress', estimatedCost: 40, approved: true, mechanic: 'Chris', appointment: '2026-04-28 10:00 AM', notes: 'Work is currently in progress.', updatedAt: '2026-04-24 9:10 AM' },
    { id: 504, vehicleId: 1, vehicle: '2021 Toyota Corolla', request: 'Cabin air filter replacement', status: 'pending', estimatedCost: 0, approved: false, mechanic: 'Unassigned', appointment: 'Awaiting scheduling', notes: 'Request received. Manager has not assigned a mechanic yet.', updatedAt: '2026-04-24 9:30 AM' },
  ]);


  // Helpers

  // Show an auto-hiding notification toast
  const notify = (message, type = 'success') => {
    setShowNotification({ message, type });
    setTimeout(() => setShowNotification(null), 3000);
  };


  // Simulate loading
  const withLoading = (fn) => {
    setIsLoading(true);
    setTimeout(() => {
      fn();
      setIsLoading(false);
    }, 450);
  };


  // Core Logic

  // Update vehicle statuses after service request changes
  const updateVehicleStatusFromRequests = (nextRequests) => {
    setVehicles((prevVehicles) => prevVehicles.map((vehicle) => {
      const relatedRequests = nextRequests.filter((request) => request.vehicleId === vehicle.id && request.status !== 'cancelled');
      const hasActive = relatedRequests.some((request) => ['pending', 'in-progress', 'approved'].includes(request.status));
      const hasQuote = relatedRequests.some((request) => request.status === 'quoted');
      const allCompleted = relatedRequests.length > 0 && relatedRequests.every((request) => request.status === 'completed');

      if (hasQuote) return { ...vehicle, status: 'Awaiting Approval' };
      if (hasActive) return { ...vehicle, status: 'In Service' };
      if (allCompleted) return { ...vehicle, status: 'Ready for Pickup' };
      return { ...vehicle, status: 'No Active Service', issue: 'None', appointment: 'No appointment scheduled' };
    }));
  };


  // Save customer profile edits
  const saveProfile = () => {
    if (!profileForm.name.trim() || !profileForm.email.trim()) {
      notify('Name and email are required', 'error');
      return;
    }

    withLoading(() => {
      setCustomer((prev) => ({ ...prev, ...profileForm }));
      setShowProfileEditor(false);
      notify('Customer profile updated');
    });
  };


  // Link insurance policy
  const linkInsurance = () => {
    withLoading(() => {
      setCustomer((prev) => ({ ...prev, insurancePolicyID: prev.insurancePolicyID === 900145 ? 900999 : 900145 }));
      notify('Insurance policy linked');
    });
  };


  // Add new vehicle to the customer account
  const linkVehicle = () => {
    if (!vehicleForm.year || !vehicleForm.make.trim() || !vehicleForm.model.trim() || !vehicleForm.plate.trim()) {
      notify('Please complete the vehicle form', 'error');
      return;
    }

    withLoading(() => {
      const newVehicle = {
        id: Math.max(...vehicles.map((vehicle) => vehicle.id)) + 1,
        year: Number(vehicleForm.year),
        make: vehicleForm.make.trim(),
        model: vehicleForm.model.trim(),
        plate: vehicleForm.plate.trim().toUpperCase(),
        mileage: Number(vehicleForm.mileage) || 0,
        vin: vehicleForm.vin.trim().toUpperCase() || 'VIN PENDING',
        status: 'No Active Service',
        issue: 'None',
        appointment: 'No appointment scheduled',
      };

      setVehicles((prev) => [...prev, newVehicle]);
      setShowVehicleForm(false);
      notify(`${newVehicle.year} ${newVehicle.make} ${newVehicle.model} linked to profile`);
    });
  };


  // Create a new service request for the selected vehicle
  const recordIssueRequest = () => {
    const vehicle = vehicles.find((item) => item.id === Number(requestForm.vehicleId));
    if (!vehicle || !requestForm.request.trim()) {
      notify('Please choose a vehicle and describe the issue', 'error');
      return;
    }

    withLoading(() => {
      const newRequest = {
        id: Math.max(...serviceRequests.map((request) => request.id)) + 1,
        vehicleId: vehicle.id,
        vehicle: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
        request: requestForm.request.trim(),
        status: 'pending',
        estimatedCost: 0,
        approved: false,
        mechanic: 'Unassigned',
        appointment: requestForm.preferredDate || 'Awaiting scheduling',
        notes: requestForm.notes.trim() || 'Customer did not provide additional notes.',
        updatedAt: new Date().toLocaleString(),
      };

      const nextRequests = [newRequest, ...serviceRequests];
      setServiceRequests(nextRequests);
      updateVehicleStatusFromRequests(nextRequests);
      setShowRequestForm(false);
      notify(`Service request #${newRequest.id} created`);
    });
  };


  // Approve quoted service request
  const approveQuote = (requestId) => {
    const request = serviceRequests.find((item) => item.id === requestId);
    if (!request || request.status !== 'quoted') return;

    withLoading(() => {
      const nextRequests = serviceRequests.map((item) => item.id === requestId
        ? { ...item, status: 'approved', approved: true, notes: 'Customer approved quote. Work can begin.', updatedAt: new Date().toLocaleString() }
        : item);
      setServiceRequests(nextRequests);
      updateVehicleStatusFromRequests(nextRequests);
      notify(`Quote approved for request #${requestId}`);
    });
  };


  // Cancel an open service request
  const cancelRequest = (requestId) => {
    const request = serviceRequests.find((item) => item.id === requestId);
    if (!request || request.status === 'completed') {
      notify('Completed requests cannot be cancelled', 'error');
      return;
    }

    withLoading(() => {
      const nextRequests = serviceRequests.map((item) => item.id === requestId
        ? { ...item, status: 'cancelled', notes: 'Customer cancelled this request.', updatedAt: new Date().toLocaleString() }
        : item);
      setServiceRequests(nextRequests);
      updateVehicleStatusFromRequests(nextRequests);
      setSelectedRequestId(null);
      notify(`Request #${requestId} cancelled`);
    });
  };


  // Request new appointment time
  const rescheduleRequest = (requestId) => {
    withLoading(() => {
      setServiceRequests((prev) => prev.map((request) => request.id === requestId
        ? { ...request, appointment: 'Reschedule requested', notes: 'Customer requested a new appointment time.', updatedAt: new Date().toLocaleString() }
        : request));
      notify(`Reschedule requested for #${requestId}`);
    });
  };


  // Apply customer payment to the current balance
  const makePayment = () => {
    const amount = Number(paymentInput);
    if (Number.isNaN(amount) || amount <= 0) {
      notify('Please enter a valid payment amount', 'error');
      return;
    }

    withLoading(() => {
      const applied = Math.min(amount, paymentsDue);
      setPaymentsDue((prev) => Math.max(0, prev - applied));
      setPaymentInput('');
      notify(`Payment of ${formatMoney(applied)} applied`);
    });
  };

  // Filter requests
  const displayedRequests = useMemo(() => {
    const tabFiltered = activeTab === 'active'
      ? serviceRequests.filter((request) => request.status !== 'completed' && request.status !== 'cancelled')
      : serviceRequests.filter((request) => request.status === activeTab);

    return tabFiltered
      .filter((request) => filter === 'all' || request.status === filter)
      .filter((request) => {
        const query = searchTerm.toLowerCase();
        return query === ''
          || request.vehicle.toLowerCase().includes(query)
          || request.request.toLowerCase().includes(query)
          || request.status.toLowerCase().includes(query)
          || request.mechanic.toLowerCase().includes(query)
          || String(request.id).includes(query);
      });
  }, [activeTab, filter, searchTerm, serviceRequests]);


  // Dashboard summary numbers
  const stats = {
    vehicles: vehicles.length,
    activeRequests: serviceRequests.filter((request) => !['completed', 'cancelled'].includes(request.status)).length,
    quotesReady: serviceRequests.filter((request) => request.status === 'quoted').length,
    completedRequests: serviceRequests.filter((request) => request.status === 'completed').length,
    balance: paymentsDue,
  };


  // UI Rendering

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      {/* Notification Toast */}
      {showNotification && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', zIndex: 1000,
          padding: '16px 24px', borderRadius: '12px',
          backgroundColor: showNotification.type === 'success' ? '#10b981' : '#ef4444',
          color: 'white', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
          animation: 'slideIn 0.3s ease-out', fontWeight: '600',
        }}>
          {showNotification.message}
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '16px', textAlign: 'center' }}>
            <div style={{
              width: '40px', height: '40px', border: '3px solid #e5e7eb',
              borderTopColor: '#1e40af', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px',
            }} />
            <p style={{ margin: 0, color: '#374151' }}>Processing...</p>
          </div>
        </div>
      )}

      {/* Header */}
      <header style={{
        background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)',
        color: 'white', padding: '20px 32px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '48px', height: '48px', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>🚗</div>
            <div>
              <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: 0 }}>Customer Portal</h1>
              <p style={{ fontSize: '14px', opacity: 0.9, margin: '4px 0 0' }}>Vehicle Service Dashboard</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontWeight: 'bold', margin: 0 }}>{customer.name}</p>
              <p style={{ fontSize: '12px', opacity: 0.9, margin: '4px 0 0' }}>Customer ID: {customer.customerID}</p>
            </div>
            <div style={{
              width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '20px', border: '2px solid rgba(255,255,255,0.3)',
            }}>{customer.name.charAt(0)}</div>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px' }}>
        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '24px', marginBottom: '32px' }}>
          {[
            { label: 'Vehicles', value: stats.vehicles, icon: '🚘', accent: '#3b82f6', bg: '#f8fafc' },
            { label: 'Active Requests', value: stats.activeRequests, icon: '⏳', accent: '#eab308', bg: '#fefce8' },
            { label: 'Quotes Ready', value: stats.quotesReady, icon: '💰', accent: '#10b981', bg: '#ecfdf5' },
            { label: 'Completed', value: stats.completedRequests, icon: '✅', accent: '#059669', bg: '#ecfdf5' },
            { label: 'Balance Due', value: formatMoney(stats.balance), icon: '💳', accent: '#ef4444', bg: '#fef2f2' },
          ].map(({ label, value, icon, accent, bg }) => (
            <div key={label} style={{
              background: `linear-gradient(135deg, white 0%, ${bg} 100%)`, borderRadius: '16px', padding: '24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderLeft: `4px solid ${accent}`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ color: '#6b7280', fontSize: '14px', fontWeight: '500', margin: '0 0 8px' }}>{label}</p>
                  <p style={{ fontSize: '34px', fontWeight: 'bold', margin: 0, color: '#1f2937' }}>{value}</p>
                </div>
                <div style={{ fontSize: '32px', opacity: 0.75 }}>{icon}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Search, Tabs, and Filters */}
        <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '20px 24px', marginBottom: '32px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '8px', backgroundColor: '#f3f4f6', padding: '4px', borderRadius: '12px', flexWrap: 'wrap' }}>
              {[
                { id: 'active', label: 'Active Requests' },
                { id: 'completed', label: 'Completed' },
                { id: 'cancelled', label: 'Cancelled' },
              ].map((tab) => (
                <button key={tab.id} onClick={() => { setActiveTab(tab.id); setFilter('all'); }} style={{
                  padding: '10px 22px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '500',
                  backgroundColor: activeTab === tab.id ? '#1e40af' : 'transparent',
                  color: activeTab === tab.id ? 'white' : '#6b7280', transition: 'all 0.2s',
                }}>
                  {tab.label}
                </button>
              ))}
            </div>

            <input
              type="text"
              placeholder="🔍 Search requests, vehicles, mechanic, or status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ flex: 1, maxWidth: '430px', minWidth: '250px', padding: '11px 16px', border: '1px solid #e5e7eb', borderRadius: '12px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
              onFocus={(e) => { e.target.style.borderColor = '#1e40af'; }}
              onBlur={(e) => { e.target.style.borderColor = '#e5e7eb'; }}
            />
          </div>

          {activeTab === 'active' && (
            <div style={{ display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', color: '#6b7280', marginRight: '8px' }}>Filter:</span>
              {['all', 'pending', 'quoted', 'approved', 'in-progress'].map((option) => (
                <button key={option} onClick={() => setFilter(option)} style={{
                  padding: '6px 16px', borderRadius: '20px', border: '1px solid', borderColor: filter === option ? '#1e40af' : '#e5e7eb',
                  cursor: 'pointer', fontSize: '13px', fontWeight: '500', backgroundColor: filter === option ? '#eff6ff' : 'white',
                  color: filter === option ? '#1e40af' : '#6b7280', transition: 'all 0.2s',
                }}>
                  {option === 'all' ? 'All' : getStatusColor(option).label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Customer Action Buttons and Forms */}
        <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '20px 24px', marginBottom: '32px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 16px', color: '#1f2937' }}>⚡ Customer Actions</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '12px' }}>
            {[
              { label: '✏️ Edit Profile', action: () => setShowProfileEditor((prev) => !prev), color: '#3b82f6', hover: '#2563eb' },
              { label: '🚘 Link Vehicle', action: () => setShowVehicleForm((prev) => !prev), color: '#10b981', hover: '#059669' },
              { label: '🛡️ Link Insurance', action: linkInsurance, color: '#8b5cf6', hover: '#7c3aed' },
              { label: '📝 Request Service', action: () => setShowRequestForm((prev) => !prev), color: '#f97316', hover: '#ea580c' },
            ].map((button) => (
              <button key={button.label} onClick={button.action} style={{ backgroundColor: button.color, color: 'white', padding: '12px', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}
                onMouseEnter={(e) => { e.target.style.backgroundColor = button.hover; }}
                onMouseLeave={(e) => { e.target.style.backgroundColor = button.color; }}>
                {button.label}
              </button>
            ))}
          </div>

          {(showProfileEditor || showVehicleForm || showRequestForm) && (
            <div style={{ marginTop: '18px', padding: '18px', backgroundColor: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: '14px' }}>
              {showProfileEditor && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                  {[
                    { key: 'name', placeholder: 'Full name' },
                    { key: 'phone', placeholder: 'Phone number' },
                    { key: 'email', placeholder: 'Email address' },
                    { key: 'preferredContact', placeholder: 'Preferred contact method' },
                  ].map((field) => (
                    <input key={field.key} value={profileForm[field.key]} onChange={(e) => setProfileForm((prev) => ({ ...prev, [field.key]: e.target.value }))} placeholder={field.placeholder} style={{ padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '10px', fontSize: '14px' }} />
                  ))}
                  <button onClick={saveProfile} style={{ backgroundColor: '#1e40af', color: 'white', padding: '10px 12px', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' }}>Save Profile</button>
                </div>
              )}

              {showVehicleForm && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '12px' }}>
                  {['year', 'make', 'model', 'plate', 'mileage', 'vin'].map((field) => (
                    <input key={field} value={vehicleForm[field]} onChange={(e) => setVehicleForm((prev) => ({ ...prev, [field]: e.target.value }))} placeholder={field.toUpperCase()} style={{ padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '10px', fontSize: '14px' }} />
                  ))}
                  <button onClick={linkVehicle} style={{ backgroundColor: '#10b981', color: 'white', padding: '10px 12px', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' }}>Add Vehicle</button>
                </div>
              )}

              {showRequestForm && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                  <select value={requestForm.vehicleId} onChange={(e) => setRequestForm((prev) => ({ ...prev, vehicleId: e.target.value }))} style={{ padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '10px', fontSize: '14px' }}>
                    {vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.year} {vehicle.make} {vehicle.model}</option>)}
                  </select>
                  <input value={requestForm.request} onChange={(e) => setRequestForm((prev) => ({ ...prev, request: e.target.value }))} placeholder="Describe issue" style={{ padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '10px', fontSize: '14px' }} />
                  <input type="date" value={requestForm.preferredDate} onChange={(e) => setRequestForm((prev) => ({ ...prev, preferredDate: e.target.value }))} style={{ padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '10px', fontSize: '14px' }} />
                  <input value={requestForm.notes} onChange={(e) => setRequestForm((prev) => ({ ...prev, notes: e.target.value }))} placeholder="Notes for service team" style={{ padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '10px', fontSize: '14px' }} />
                  <button onClick={recordIssueRequest} style={{ backgroundColor: '#f97316', color: 'white', padding: '10px 12px', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' }}>Submit Request</button>
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.6fr) minmax(320px, 0.8fr)', gap: '24px', marginBottom: '36px' }}>
          <section>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 20px', color: '#111827' }}>📌 Service Requests</h2>
            {displayedRequests.length === 0 ? (
              <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '64px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <div style={{ fontSize: '64px', marginBottom: '16px' }}>🧾</div>
                <p style={{ color: '#6b7280', fontSize: '18px', margin: 0 }}>No matching service requests</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '24px' }}>
                {displayedRequests.map((request) => {
                  const statusStyle = getStatusColor(request.status);
                  const isClosed = ['completed', 'cancelled'].includes(request.status);
                
  return (
                    <div key={request.id} style={{ backgroundColor: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'pointer' }}
                      onClick={() => setSelectedRequestId(selectedRequestId === request.id ? null : request.id)}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0,0,0,0.15)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)'; }}>
                      <div style={{ padding: '20px 24px', background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', borderBottom: '1px solid #e5e7eb' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <span style={{ backgroundColor: statusStyle.bg, color: statusStyle.text, border: `1px solid ${statusStyle.border}`, padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' }}>{statusStyle.label}</span>
                            <h3 style={{ fontSize: '20px', fontWeight: 'bold', margin: '10px 0 4px', color: '#1f2937' }}>{request.request}</h3>
                            <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>Request #{request.id} • {request.vehicle}</p>
                          </div>
                          <div style={{ fontSize: '28px' }}>{request.status === 'quoted' ? '💰' : request.status === 'completed' ? '✅' : request.status === 'cancelled' ? '🚫' : '🔧'}</div>
                        </div>
                      </div>

                      <div style={{ padding: '20px 24px' }}>
                        {[
                          { icon: '💰', label: 'Estimated Cost', value: request.estimatedCost > 0 ? formatMoney(request.estimatedCost) : 'Awaiting quote', strong: true },
                          { icon: '👷', label: 'Mechanic', value: request.mechanic },
                          { icon: '📅', label: 'Appointment', value: request.appointment },
                          { icon: '🕒', label: 'Last Updated', value: request.updatedAt },
                        ].map((item) => (
                          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
                            <span style={{ fontSize: '20px' }}>{item.icon}</span>
                            <div>
                              <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>{item.label}</p>
                              <p style={{ fontSize: item.strong ? '18px' : '14px', fontWeight: item.strong ? 'bold' : '500', margin: '4px 0 0', color: item.strong ? '#059669' : '#374151' }}>{item.value}</p>
                            </div>
                          </div>
                        ))}

                        {selectedRequestId === request.id && (
                          <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                            <p style={{ margin: '0 0 12px', color: '#374151', fontSize: '14px' }}>{request.notes}</p>
                            {!isClosed && (
                              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                {request.status === 'quoted' && <button onClick={(e) => { e.stopPropagation(); approveQuote(request.id); }} style={{ flex: 1, minWidth: '130px', backgroundColor: '#10b981', color: 'white', padding: '10px', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' }}>Approve Quote</button>}
                                <button onClick={(e) => { e.stopPropagation(); rescheduleRequest(request.id); }} style={{ flex: 1, minWidth: '130px', backgroundColor: '#3b82f6', color: 'white', padding: '10px', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' }}>Reschedule</button>
                                <button onClick={(e) => { e.stopPropagation(); cancelRequest(request.id); }} style={{ flex: 1, minWidth: '130px', backgroundColor: '#ef4444', color: 'white', padding: '10px', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' }}>Cancel</button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Billing and Profile Sidebar */}
          <aside style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '20px 24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h2 style={{ fontSize: '22px', fontWeight: 'bold', margin: '0 0 16px', color: '#111827' }}>💳 Billing</h2>
              <p style={{ color: '#6b7280', margin: '0 0 6px', fontSize: '14px' }}>Current Balance</p>
              <p style={{ fontSize: '34px', fontWeight: 'bold', margin: '0 0 16px', color: paymentsDue > 0 ? '#ef4444' : '#059669' }}>{formatMoney(paymentsDue)}</p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input type="number" min="0" step="0.01" value={paymentInput} onChange={(e) => setPaymentInput(e.target.value)} placeholder="Payment amount" style={{ flex: 1, minWidth: 0, padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '10px', fontSize: '14px' }} />
                <button onClick={makePayment} style={{ backgroundColor: '#ef4444', color: 'white', padding: '10px 14px', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' }}>Pay</button>
              </div>
            </div>

            <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '20px 24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h2 style={{ fontSize: '22px', fontWeight: 'bold', margin: '0 0 16px', color: '#111827' }}>👤 Profile</h2>
              {[
                { icon: '📞', label: 'Phone', value: customer.phone },
                { icon: '✉️', label: 'Email', value: customer.email },
                { icon: '🛡️', label: 'Insurance', value: customer.insurancePolicyID },
                { icon: '💬', label: 'Preferred Contact', value: customer.preferredContact },
              ].map((item) => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
                  <span style={{ fontSize: '20px' }}>{item.icon}</span>
                  <div>
                    <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>{item.label}</p>
                    <p style={{ fontSize: '14px', fontWeight: '500', margin: '4px 0 0', color: '#374151' }}>{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </div>

        {/* Vehicle Cards */}
        <section style={{ marginBottom: '36px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 20px', color: '#111827' }}>🚘 My Vehicles</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '24px' }}>
            {vehicles.map((vehicle) => {
              const vehicleStyle = getVehicleStatusColor(vehicle.status);
            
  return (
                <div key={vehicle.id} style={{ backgroundColor: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', transition: 'transform 0.2s, box-shadow 0.2s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0,0,0,0.15)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)'; }}>
                  <div style={{ padding: '20px 24px', background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', borderBottom: '1px solid #e5e7eb' }}>
                    <span style={{ backgroundColor: vehicleStyle.bg, color: vehicleStyle.text, border: `1px solid ${vehicleStyle.border}`, padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' }}>{vehicle.status.toUpperCase()}</span>
                    <h3 style={{ fontSize: '20px', fontWeight: 'bold', margin: '10px 0 4px', color: '#1f2937' }}>{vehicle.year} {vehicle.make} {vehicle.model}</h3>
                    <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>Plate: {vehicle.plate}</p>
                  </div>
                  <div style={{ padding: '20px 24px' }}>
                    {[
                      { icon: '🔍', label: 'Issue', value: vehicle.issue },
                      { icon: '📅', label: 'Appointment', value: vehicle.appointment },
                      { icon: '🛣️', label: 'Mileage', value: `${vehicle.mileage.toLocaleString()} mi` },
                      { icon: '🔢', label: 'VIN', value: vehicle.vin },
                    ].map((item) => (
                      <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
                        <span style={{ fontSize: '20px' }}>{item.icon}</span>
                        <div>
                          <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>{item.label}</p>
                          <p style={{ fontSize: '14px', fontWeight: '500', margin: '4px 0 0', color: '#374151' }}>{item.value}</p>
                        </div>
                      </div>
                    ))}
                    <button onClick={() => notify(`${vehicle.year} ${vehicle.make} ${vehicle.model}: ${vehicle.status}`)} style={{ width: '100%', backgroundColor: '#3b82f6', color: 'white', padding: '12px', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '600', marginTop: '8px' }}>🔍 View Status</button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Customer;
