import { useState } from 'react';
import Mechanic from './classes/Mechanic';
import Customer from './classes/Customer';
import './App.css';

function App() {
  const [view, setView] = useState('mechanic');

  return (
    <div>
      {/* Simple Toggle Buttons */}
      <div style={{ padding: '10px', textAlign: 'center' }}>
        <button onClick={() => setView('mechanic')}>
          Mechanic Portal
        </button>
        <button onClick={() => setView('customer')} style={{ marginLeft: '10px' }}>
          Customer Portal
        </button>
        <button onClick={() => setView('manager')} style={{ marginLeft: '10px' }}>
          Manager Portal
        </button>
      </div>

      {/* Render Selected View */}
      {view === 'mechanic' && <Mechanic />}
      {view === 'customer' && <Customer />}
      {view === 'manager' && <Manager />}
    </div>
  );
}

export default App;