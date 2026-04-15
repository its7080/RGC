import React, { useState } from 'react';
import { request } from '../api';

export function SuperAdminPanel() {
  const [username, setUsername] = useState('newadmin');
  const [password, setPassword] = useState('changeme123');
  const [response, setResponse] = useState(null);
  const [error, setError] = useState('');

  const createAdmin = async () => {
    try {
      setError('');
      const data = await request('/super/admins', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      });
      setResponse(data);
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="panel">
      <h3>Super Admin Controls</h3>
      <div className="form-grid">
        <label>Username
          <input value={username} onChange={(e) => setUsername(e.target.value)} />
        </label>
        <label>Password
          <input value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
      </div>
      <button onClick={createAdmin}>Create Admin</button>
      {error && <p className="error">{error}</p>}
      {response && <pre>{JSON.stringify(response, null, 2)}</pre>}
    </div>
  );
}
