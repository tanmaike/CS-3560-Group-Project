// App.jsx
import { useState, useEffect } from 'react';
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
  const [session, setSession] = useState(() => {
    const portal = localStorage.getItem('loggedInAs');
    const mechanicId = localStorage.getItem('mechanicId');
    const customerId = localStorage.getItem('customerId');
    const managerId = localStorage.getItem('managerId');
    const username = localStorage.getItem('username');
    const displayName = localStorage.getItem('displayName');
    if (!portal) return null;
    return {
      portal,
      customerId: customerId ? Number(customerId) : null,
      mechanicId: mechanicId ? Number(mechanicId) : null,
      managerId: managerId ? Number(managerId) : null,
      username: username || null,
      displayName: displayName || null,
    };
  });

  useEffect(() => {
    if (session?.portal) {
      localStorage.setItem('loggedInAs', session.portal);
      if (session.customerId != null) {
        localStorage.setItem('customerId', String(session.customerId));
      } else {
        localStorage.removeItem('customerId');
      }
      if (session.mechanicId != null) {
        localStorage.setItem('mechanicId', String(session.mechanicId));
      } else {
        localStorage.removeItem('mechanicId');
      }
      if (session.managerId != null) {
        localStorage.setItem('managerId', String(session.managerId));
      } else {
        localStorage.removeItem('managerId');
      }
      if (session.username) localStorage.setItem('username', session.username);
      else localStorage.removeItem('username');
      if (session.displayName) localStorage.setItem('displayName', session.displayName);
      else localStorage.removeItem('displayName');
    }
  }, [session]);

  const handleLogin = (portalKey, loginData = {}) => {
    setSession({
      portal: portalKey,
      customerId: loginData.customerId ?? null,
      mechanicId: loginData.mechanicId ?? null,
      managerId: loginData.managerId ?? null,
      username: loginData.username ?? null,
      displayName: loginData.displayName ?? null,
    });
  };
  const handleLogout = () => {
    localStorage.removeItem('loggedInAs');
    localStorage.removeItem('customerId');
    localStorage.removeItem('mechanicId');
    localStorage.removeItem('managerId');
    localStorage.removeItem('username');
    localStorage.removeItem('displayName');
    setSession(null);
  };

  if (!session?.portal) {
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

            <div className="portal-label">{PORTAL_LABELS[session.portal]}</div>

            <button className="logout-btn" onClick={handleLogout}>
              Sign Out
            </button>
          </div>
        </div>

        {session.portal === 'mechanic' && <Mechanic mechanicId={session.mechanicId || 1} />}
        {session.portal === 'customer' && <Customer customerId={session.customerId || 301} />}
        {session.portal === 'manager'  && <Manager />}
      </div>
  );
}

export default App;
