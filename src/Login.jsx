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
  const [email, setEmail] = useState('');
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
  }, [activePortal]);

  const portal = PORTALS[activePortal];

  const handleTabSwitch = (key) => {
    setActivePortal(key);
    setError('');
    setEmail('');
    setPassword('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // For mechanic login, require mechanic selection
    if (activePortal === 'mechanic' && !selectedMechanicId) {
      setError('Please select your mechanic profile.');
      return;
    }

    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }

    setError('');
    setLoading(true);
    await new Promise((r) => setTimeout(r, 700));
    setLoading(false);

    // Pass mechanic ID if it's a mechanic login
    if (activePortal === 'mechanic') {
      onLogin(activePortal, { mechanicId: Number(selectedMechanicId) });
    } else {
      onLogin(activePortal);
    }
  };

  const handleQuickLogin = () => {
    if (activePortal === 'mechanic' && !selectedMechanicId) {
      setError('Please select your mechanic profile.');
      return;
    }

    if (activePortal === 'mechanic') {
      onLogin(activePortal, { mechanicId: Number(selectedMechanicId) });
    } else {
      onLogin(activePortal);
    }
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
                      Select Mechanic
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
                <label className="login-label" htmlFor="login-email">Email address</label>
                <input
                    id="login-email"
                    className="login-input"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
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

              <div className="login-divider">
                <span className="login-divider-line" />
                <span className="login-divider-text">or use portal ID</span>
                <span className="login-divider-line" />
              </div>

              <button
                  type="button"
                  className="login-id-btn"
                  onClick={handleQuickLogin}
              >
                <div className="login-id-text">
                <span className="login-id-primary">
                  {activePortal === 'mechanic' && selectedMechanicId
                      ? `Sign in as ${mechanics.find(m => m.mechanicId === Number(selectedMechanicId))?.name || 'Mechanic'}`
                      : `Sign in with ${portal.idLabel}`
                  }
                </span>
                  <span className="login-id-secondary">Use your assigned ID number</span>
                </div>
              </button>
            </form>
          </div>
        </main>
      </div>
  );
}

export default Login;