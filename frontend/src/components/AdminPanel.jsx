import React, { useState } from 'react';
import { request } from '../api';

export function AdminPanel() {
  const [dashboard, setDashboard] = useState(null);
  const [coinKioskId, setCoinKioskId] = useState('K-001');
  const [coinDelta, setCoinDelta] = useState(100);
  const [adjustResult, setAdjustResult] = useState(null);
  const [error, setError] = useState('');
  const [actionMsg, setActionMsg] = useState('');

  const loadDashboard = async () => {
    try {
      setError('');
      setActionMsg('');
      const data = await request('/admin/dashboard');
      setDashboard(data);
    } catch (e) {
      setError(e.message);
    }
  };

  const adjustCoins = async () => {
    try {
      setError('');
      setActionMsg('');
      setAdjustResult(null);
      const data = await request(`/admin/kiosks/${encodeURIComponent(coinKioskId)}/coins`, {
        method: 'POST',
        body: JSON.stringify({ delta: Number(coinDelta) })
      });
      setAdjustResult(data);
      setActionMsg(`Updated ${coinKioskId} balance by ${Number(coinDelta)} coins.`);
      await loadDashboard();
    } catch (e) {
      setError(e.message);
    }
  };

  const rounds = dashboard?.rounds || [];
  const kioskStatuses = dashboard?.kioskStatus ? Object.values(dashboard.kioskStatus) : [];

  return (
    <div className="panel">
      <h3>Admin Operations Console</h3>
      <div className="row">
        <button onClick={loadDashboard}>Refresh Metrics</button>
      </div>
      {error && <p className="error">{error}</p>}
      {actionMsg && <p className="success">{actionMsg}</p>}

      {dashboard && (
        <>
          <div className="admin-metric-grid">
            <article className="metric-card">
              <h4>Active Bets</h4>
              <p>{dashboard.activeBets}</p>
            </article>
            <article className="metric-card">
              <h4>Total Coins In Play</h4>
              <p>{dashboard.totalCoinsInPlay}</p>
            </article>
            <article className="metric-card">
              <h4>Tracked Kiosks</h4>
              <p>{kioskStatuses.length}</p>
            </article>
            <article className="metric-card">
              <h4>Open Rounds</h4>
              <p>{rounds.filter((r) => r.stage === 'bet:open').length}</p>
            </article>
          </div>

          <section className="admin-section">
            <h4>Kiosk Coin Controls</h4>
            <div className="form-grid">
              <label>Kiosk ID
                <input value={coinKioskId} onChange={(e) => setCoinKioskId(e.target.value)} />
              </label>
              <label>Coin Delta
                <input type="number" value={coinDelta} onChange={(e) => setCoinDelta(e.target.value)} />
              </label>
            </div>
            <button onClick={adjustCoins}>Apply Balance Adjustment</button>
            {adjustResult && <pre>{JSON.stringify(adjustResult, null, 2)}</pre>}
          </section>

          <section className="admin-section">
            <h4>Round Status</h4>
            <div className="table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Game</th>
                    <th>Round ID</th>
                    <th>Stage</th>
                    <th>Result</th>
                  </tr>
                </thead>
                <tbody>
                  {rounds.map((round) => (
                    <tr key={`${round.gameType}-${round.id}`}>
                      <td>{round.gameType}</td>
                      <td>{round.id}</td>
                      <td>{round.stage}</td>
                      <td>{round.result?.winner || 'Pending'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
