import React, { useMemo, useState } from 'react';
import { request } from '../api';

const gameOptionsFactory = {
  horseRace: () => Array.from({ length: 12 }, (_, i) => `horse-${i + 1}`),
  andarBahar: () => ['andar', 'bahar'],
  cards52: () => Array.from({ length: 52 }, (_, i) => `card-${i + 1}`),
  cards24: () => Array.from({ length: 24 }, (_, i) => `card-${i + 1}`),
  cards20: () => Array.from({ length: 20 }, (_, i) => `card-${i + 1}`),
  tenKaDum: () => Array.from({ length: 10 }, (_, i) => `number-${i + 1}`),
  luckySpin: () => Array.from({ length: 12 }, (_, i) => `slot-${i + 1}`)
};

export function KioskPanel({ gameLabels = {} }) {
  const [gameType, setGameType] = useState('horseRace');
  const [option, setOption] = useState('horse-1');
  const [wager, setWager] = useState(50);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const options = useMemo(() => (gameOptionsFactory[gameType] ? gameOptionsFactory[gameType]() : []), [gameType]);

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
        <label>
          Game
          <select
            value={gameType}
            onChange={(e) => {
              const nextGame = e.target.value;
              setGameType(nextGame);
              const firstOption = gameOptionsFactory[nextGame]?.()[0] || '';
              setOption(firstOption);
            }}
          >
            {Object.entries(gameLabels).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </label>
        <label>
          Option
          <select value={option} onChange={(e) => setOption(e.target.value)}>
            {options.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </label>
        <label>
          Wager
          <input type="number" value={wager} onChange={(e) => setWager(e.target.value)} />
        </label>
      </div>
      <button onClick={submitBet}>Place Bet</button>
      {error && <p className="error">{error}</p>}
      {result && <pre>{JSON.stringify({ betId: result.bet.betId, qrToken: result.qrToken }, null, 2)}</pre>}
    </div>
  );
}
