import { useState, useEffect } from 'react';
import './Login.css';

const PORTALS = {
  customer: {
    label: 'Customer Portal',
    title: 'Customer Login',
    subtitle: 'Access your vehicles and service history',
    idLabel: 'Customer ID',
  },
  manager: {
    label: 'Management Portal',
    title: 'Management Login',
    subtitle: 'Oversee operations, jobs, and mechanics',
    idLabel: 'Manager ID',
  },
  mechanic: {
    label: 'Mechanic Portal',
    title: 'Mechanic Login',
    subtitle: 'View assigned jobs and update diagnoses',
    idLabel: 'Mechanic ID',
  },
};

function Login({ onLogin }) {
  const [activePortal, setActivePortal] = useState('customer');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Mechanic selection
  const [mechanics, setMechanics] = useState([]);
  const [selectedMechanicId, setSelectedMechanicId] = useState('');

  // Load mechanics list when mechanic tab is active
  useEffect(() => {
    if (activePortal === 'mechanic') {
      fetch('/api/mechanics')
          .then(r => r.json())
          .then(data => {
            setMechanics(data.mechanics || []);
            if (data.mechanics?.length > 0 && !selectedMechanicId) {
              setSelectedMechanicId(String(data.mechanics[0].mechanicId));
            }
          })
          .catch(() => setError('Could not load mechanics'));
    }
  }, [activePortal, selectedMechanicId]);

  const portal = PORTALS[activePortal];

  const handleTabSwitch = (key) => {
    setActivePortal(key);
    setError('');
    setUsername('');
    setPassword('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!username.trim() || !password.trim()) {
      setError('Please enter your username and password.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          portal: activePortal,
          username: username.trim(),
          password,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok || !data?.session) {
        setError(data?.msg || 'Login failed.');
        return;
      }
      onLogin(data.session.portal, {
        customerId: data.session.customerId ?? null,
        mechanicId: data.session.mechanicId ?? null,
        managerId: data.session.managerId ?? null,
        username: data.session.username ?? username.trim(),
        displayName: data.session.displayName ?? '',
      });
    } catch {
      setError('Could not contact login service.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickCustomerLogin = () => {
    onLogin('customer', {
      customerId: 301,
      username: 'customer-id-demo',
      displayName: 'Customer ID Demo',
    });
  };

  const handleQuickMechanicLogin = () => {
    onLogin('mechanic', {
      mechanicId: selectedMechanicId ? Number(selectedMechanicId) : 1,
      username: 'mechanic-id-demo',
      displayName: 'Mechanic ID Demo',
    });
  };

  const handleQuickManagerLogin = () => {
    onLogin('manager', {
      managerId: 1,
      username: 'manager-id-demo',
      displayName: 'Manager ID Demo',
    });
  };

  return (
      <div className="login-page">
        <header className="login-app-header">
          <div className="brand-section login-brand">
            <span className="brand-text">AutoCare</span>
            <span className="brand-tagline">Professional Auto Service</span>
          </div>
        </header>

        <nav className="login-tabs" role="tablist">
          {Object.entries(PORTALS).map(([key, p]) => (
                  <button
                  key={key}
                  role="tab"
                  aria-selected={activePortal === key}
                  className={`login-tab login-tab--${key} ${activePortal === key ? 'active' : ''}`}
                  onClick={() => handleTabSwitch(key)}
              >
                <span className="login-tab-dot" />
                {p.label}
              </button>
          ))}
        </nav>

        <main className="login-body">
          <div className={`login-card login-card--${activePortal}`}>
            <div className="login-card-header">
              <h1 className="login-card-title">{portal.title}</h1>
              <p className="login-card-subtitle">{portal.subtitle}</p>
            </div>

            <form className="login-form" onSubmit={handleSubmit} noValidate>
              {error && <div className="login-error" role="alert">{error}</div>}

              {/* Mechanic Selector - only shows for mechanic portal */}
              {activePortal === 'mechanic' && mechanics.length > 0 && (
                  <div className="login-field">
                    <label className="login-label" htmlFor="mechanic-select">
                      Active Mechanic Profiles
                    </label>
                    <select
                        id="mechanic-select"
                        className="login-input login-select"
                        value={selectedMechanicId}
                        onChange={(e) => setSelectedMechanicId(e.target.value)}
                    >
                      {mechanics.map(m => (
                          <option key={m.mechanicId} value={m.mechanicId}>
                            {m.name} (ID: {m.mechanicId}) — {m.assignedJobs?.length || 0} active jobs
                          </option>
                      ))}
                    </select>
                  </div>
              )}

              <div className="login-field">
                <label className="login-label" htmlFor="login-username">Username</label>
                <input
                    id="login-username"
                    className="login-input"
                    type="text"
                    placeholder="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                />
              </div>

              <div className="login-field">
                <label className="login-label" htmlFor="login-password">Password</label>
                <input
                    id="login-password"
                    className="login-input"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                />
              </div>

              <div className="login-row">
                <button type="button" className="login-forgot">Forgot password?</button>
              </div>

              <button
                  type="submit"
                  className={`login-submit login-submit--${activePortal}`}
                  disabled={loading}
              >
                {loading ? 'Signing in…' : `Sign in to ${portal.label}`}
              </button>

              {activePortal === 'customer' && (
                <>
                  <div className="login-divider">
                    <span className="login-divider-line" />
                    <span className="login-divider-text">or use customer ID</span>
                    <span className="login-divider-line" />
                  </div>

                  <button
                      type="button"
                      className="login-id-btn"
                      onClick={handleQuickCustomerLogin}
                  >
                    <div className="login-id-text">
                      <span className="login-id-primary">Sign in with Customer ID 301</span>
                      <span className="login-id-secondary">Demo shortcut for class presentation</span>
                    </div>
                  </button>
                </>
              )}

              {activePortal === 'mechanic' && (
                <>
                  <div className="login-divider">
                    <span className="login-divider-line" />
                    <span className="login-divider-text">or use mechanic ID</span>
                    <span className="login-divider-line" />
                  </div>

                  <button
                      type="button"
                      className="login-id-btn"
                      onClick={handleQuickMechanicLogin}
                  >
                    <div className="login-id-text">
                      <span className="login-id-primary">
                        Sign in with Mechanic ID {selectedMechanicId || 1}
                      </span>
                      <span className="login-id-secondary">Demo shortcut for class presentation</span>
                    </div>
                  </button>
                </>
              )}

              {activePortal === 'manager' && (
                <>
                  <div className="login-divider">
                    <span className="login-divider-line" />
                    <span className="login-divider-text">or use manager ID</span>
                    <span className="login-divider-line" />
                  </div>

                  <button
                      type="button"
                      className="login-id-btn"
                      onClick={handleQuickManagerLogin}
                  >
                    <div className="login-id-text">
                      <span className="login-id-primary">Sign in with Manager ID 1</span>
                      <span className="login-id-secondary">Demo shortcut for class presentation</span>
                    </div>
                  </button>
                </>
              )}
            </form>
          </div>
        </main>
      </div>
  );
}

export default Login;
