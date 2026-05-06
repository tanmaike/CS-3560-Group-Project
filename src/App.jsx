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
    if (!portal) return null;
    return {
      portal,
      mechanicId: mechanicId ? Number(mechanicId) : null,
    };
  });

  useEffect(() => {
    if (session?.portal) {
      localStorage.setItem('loggedInAs', session.portal);
      if (session.mechanicId != null) {
        localStorage.setItem('mechanicId', String(session.mechanicId));
      } else {
        localStorage.removeItem('mechanicId');
      }
    }
  }, [session]);

  const handleLogin = (portalKey, loginData = {}) => {
    setSession({
      portal: portalKey,
      mechanicId: loginData.mechanicId ?? null,
    });
  };
  const handleLogout = () => {
    localStorage.removeItem('loggedInAs');
    localStorage.removeItem('mechanicId');
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
        {session.portal === 'customer' && <Customer />}
        {session.portal === 'manager'  && <Manager />}
      </div>
  );
}

export default App;
