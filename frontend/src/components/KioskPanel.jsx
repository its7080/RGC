import React, { useState } from 'react';
import { request } from '../api';

export function KioskPanel() {
  const [gameType, setGameType] = useState('horseRace');
  const [option, setOption] = useState('horse-1');
  const [wager, setWager] = useState(50);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const submitBet = async () => {
    try {
      setError('');
      const data = await request('/bets', {
        method: 'POST',
        body: JSON.stringify({ gameType, option, wager: Number(wager) })
      });
      setResult(data);
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="panel">
      <h3>Kiosk Bet Placement</h3>
      <div className="form-grid">
        <label>Game
          <input value={gameType} onChange={(e) => setGameType(e.target.value)} />
        </label>
        <label>Option
          <input value={option} onChange={(e) => setOption(e.target.value)} />
        </label>
        <label>Wager
          <input type="number" value={wager} onChange={(e) => setWager(e.target.value)} />
        </label>
      </div>
      <button onClick={submitBet}>Place Bet</button>
      {error && <p className="error">{error}</p>}
      {result && (
        <pre>{JSON.stringify({ betId: result.bet.betId, qrToken: result.qrToken }, null, 2)}</pre>
      )}
    </div>
  );
}
