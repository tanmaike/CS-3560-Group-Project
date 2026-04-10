import { useState } from 'react';
import '../App.css';

const Customer = () => {
  const [name, setName] = useState("Anthony DiDio");
  const [customerID] = useState(301);
  const [insurancePolicyID, setInsurancePolicyID] = useState(900145);
  const [paymentsDue, setPaymentsDue] = useState(249.99);

  const [vehicles, setVehicles] = useState([
    {
      id: 1,
      year: 2021,
      make: "Toyota",
      model: "Corolla",
      plate: "ABC-123",
      status: "In Service",
      issue: "Brake inspection",
      appointment: "2026-04-12 10:00 AM"
    },
    {
      id: 2,
      year: 2018,
      make: "Honda",
      model: "Civic",
      plate: "XYZ-789",
      status: "Ready for Pickup",
      issue: "Oil change",
      appointment: "2026-04-09 2:30 PM"
    }
  ]);

  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [serviceRequests, setServiceRequests] = useState([
    {
      id: 501,
      vehicle: "2021 Toyota Corolla",
      request: "Brake inspection",
      status: "pending",
      estimatedCost: 180.00
    },
    {
      id: 502,
      vehicle: "2018 Honda Civic",
      request: "Oil change",
      status: "completed",
      estimatedCost: 59.99
    },
    {
      id: 503,
      vehicle: "2021 Toyota Corolla",
      request: "Tire rotation",
      status: "in-progress",
      estimatedCost: 40.00
    }
  ]);

  const createProfile = () => {
    setName("Anthony DiDio");
    setInsurancePolicyID(900145);
    setPaymentsDue(249.99);
  };

  const updateInfo = () => {
    setName("Anthony D.");
  };

  const linkVehicle = () => {
    const newVehicle = {
      id: vehicles.length + 1,
      year: 2020,
      make: "Subaru",
      model: "Outback",
      plate: "NEW-456",
      status: "No Active Service",
      issue: "None",
      appointment: "No appointment scheduled"
    };
    setVehicles(prev => [...prev, newVehicle]);
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
    const newRequest = {
      id: serviceRequests.length + 501,
      vehicle: "2021 Toyota Corolla",
      request: "Customer-reported issue",
      status: "pending",
      estimatedCost: 120.00
    };
    setServiceRequests(prev => [newRequest, ...prev]);
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
        req.vehicle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.request.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.status.toLowerCase().includes(searchTerm.toLowerCase())
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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-blue-800 to-blue-900 text-white shadow-lg">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5v14" />
            </svg>
            <h1 className="text-2xl font-bold">Customer Portal</h1>
          </div>

          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="font-semibold">{name}</p>
              <p className="text-xs text-blue-200">Customer ID: {customerID}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white">
              {name.charAt(0)}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
            <p className="text-gray-500 text-sm font-medium">Vehicles</p>
            <p className="text-3xl font-bold mt-2">{stats.vehicles}</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-yellow-500">
            <p className="text-gray-500 text-sm font-medium">Active Requests</p>
            <p className="text-3xl font-bold mt-2">{stats.activeRequests}</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
            <p className="text-gray-500 text-sm font-medium">Completed</p>
            <p className="text-3xl font-bold mt-2">{stats.completedRequests}</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-red-500">
            <p className="text-gray-500 text-sm font-medium">Balance Due</p>
            <p className="text-3xl font-bold mt-2">${stats.balance.toFixed(2)}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex space-x-2">
              {['all', 'pending', 'in-progress', 'completed'].map((filterOption) => (
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
                placeholder="Search requests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-4 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-80"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Customer Actions</h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={createProfile}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Create Profile
            </button>
            <button
              onClick={updateInfo}
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
            >
              Update Info
            </button>
            <button
              onClick={linkVehicle}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            >
              Link Vehicle
            </button>
            <button
              onClick={linkInsurance}
              className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
            >
              Link Insurance
            </button>
            <button
              onClick={recordIssueRequest}
              className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700"
            >
              Request Service
            </button>
            <button
              onClick={() => makePayment(50)}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
            >
              Pay $50
            </button>
          </div>
        </div>

        <div className="mb-10">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">My Vehicles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {vehicles.map(vehicle => (
              <div key={vehicle.id} className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-800">
                  {vehicle.year} {vehicle.make} {vehicle.model}
                </h3>
                <p className="text-sm text-gray-500 mb-3">Plate: {vehicle.plate}</p>
                <div className="space-y-2 mb-4">
                  <p className="text-sm text-gray-600">Status: {vehicle.status}</p>
                  <p className="text-sm text-gray-600">Issue: {vehicle.issue}</p>
                  <p className="text-sm text-gray-600">Appointment: {vehicle.appointment}</p>
                </div>
                <button
                  onClick={() => viewVehicleStatus(vehicle.id)}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  View Status
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Service Requests</h2>
          {filteredRequests.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <p className="text-gray-500 text-lg">No matching service requests</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRequests.map(request => (
                <div key={request.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">{request.request}</h3>
                      <p className="text-sm text-gray-500">{request.vehicle}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      request.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : request.status === 'in-progress'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {request.status}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">Estimated Cost: ${request.estimatedCost.toFixed(2)}</p>
                    <p className="text-sm text-gray-600">Insurance Policy: {insurancePolicyID}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {serviceRequests.some(r => r.status === 'completed') && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Recent History</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {serviceRequests
                .filter(r => r.status === 'completed')
                .slice(0, 2)
                .map(request => (
                  <div key={request.id} className="bg-gray-50 rounded-lg shadow-md p-6 opacity-80">
                    <h3 className="text-lg font-semibold text-gray-800">{request.request}</h3>
                    <p className="text-sm text-gray-500">{request.vehicle}</p>
                    <p className="text-sm text-gray-600 mt-2">
                      Final Cost: ${request.estimatedCost.toFixed(2)}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Customer;