import React, { useState } from 'react';
import { request } from '../api';

export function AdminPanel() {
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState('');

  const loadDashboard = async () => {
    try {
      setError('');
      const data = await request('/admin/dashboard');
      setDashboard(data);
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="panel">
      <h3>Admin Dashboard</h3>
      <button onClick={loadDashboard}>Refresh Metrics</button>
      {error && <p className="error">{error}</p>}
      {dashboard && <pre>{JSON.stringify(dashboard, null, 2)}</pre>}
    </div>
  );
}
