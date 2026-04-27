// App.jsx
import { useState } from 'react';
import Mechanic from './classes/Mechanic';
import Customer from './classes/Customer';
import Manager from './classes/Manager';
import './App.css';

function App() {
  const [view, setView] = useState('mechanic');

  return (
    <div className="app-container">
      {/* AutoZone-style Header */}
      <div className="app-header">
        <div className="app-header-content">
          <div className="brand-section">
            <span className="brand-text">AutoCare</span>
            <span className="brand-tagline">Professional Auto Service</span>
          </div>
          
          {/* Portal Navigation Buttons */}
          <div className="portal-nav">
            <button 
              className={`portal-nav-btn ${view === 'mechanic' ? 'active' : ''}`}
              onClick={() => setView('mechanic')}
            >
              Mechanic Portal
            </button>
            <button 
              className={`portal-nav-btn ${view === 'customer' ? 'active' : ''}`}
              onClick={() => setView('customer')}
            >
              Customer Portal
            </button>
            <button 
              className={`portal-nav-btn ${view === 'manager' ? 'active' : ''}`}
              onClick={() => setView('manager')}
            >
              Manager Portal
            </button>
          </div>
        </div>
      </div>

      {/* Render Selected View */}
      {view === 'mechanic' && <Mechanic />}
      {view === 'customer' && <Customer />}
      {view === 'manager' && <Manager />}
    </div>
  );
}

export default App;