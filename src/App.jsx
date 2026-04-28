// App.jsx
import { useState } from 'react';
import Login from './Login';
import Mechanic from './classes/Mechanic';
import Customer from './classes/Customer';
import Manager from './classes/Manager';
import './App.css';

const PORTAL_LABELS = {
  customer: 'Customer Portal',
  manager:  'Management Portal',
  mechanic: 'Mechanic Portal',
};

function App() {
  const [loggedInAs, setLoggedInAs] = useState(null);

  const handleLogin = (portalKey) => setLoggedInAs(portalKey);
  const handleLogout = () => setLoggedInAs(null);

  if (!loggedInAs) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="app-container">
      <div className="app-header">
        <div className="app-header-content">
          <div className="brand-section">
            <span className="brand-text">Mechanic Shop</span>
            <span className="brand-tagline">Professional Mechanical Service</span>
          </div>

          <div className="portal-label">
            {PORTAL_LABELS[loggedInAs]}
          </div>

          <button className="logout-btn" onClick={handleLogout}>
            Sign Out
          </button>
        </div>
      </div>

      {loggedInAs === 'mechanic' && <Mechanic />}
      {loggedInAs === 'customer' && <Customer />}
      {loggedInAs === 'manager'  && <Manager />}
    </div>
  );
}

export default App;
