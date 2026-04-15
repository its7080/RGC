import React, { useEffect, useMemo, useState } from 'react';
import { login } from './api';
import { socket } from './socket';
import { GameCanvas } from './components/GameCanvas';
import { KioskPanel } from './components/KioskPanel';
import { AdminPanel } from './components/AdminPanel';
import { SuperAdminPanel } from './components/SuperAdminPanel';

const credentialsByRole = {
  kiosk: { username: 'kiosk', password: 'kiosk123' },
  admin: { username: 'admin', password: 'admin123' },
  'super-admin': { username: 'superadmin', password: 'super123' }
};

export function App() {
  const [role, setRole] = useState('kiosk');
  const [phase, setPhase] = useState('betting_board');
  const [countdown, setCountdown] = useState(5);
  const [leaderboard, setLeaderboard] = useState([]);
  const [result, setResult] = useState(null);
  const [events, setEvents] = useState([]);
  const [authMsg, setAuthMsg] = useState('Not authenticated');

  useEffect(() => {
    const handlers = {
      'round:start': (payload) => {
        setPhase('betting_board');
        setResult(null);
        pushEvent('round:start', payload);
      },
      'bet:open': (payload) => pushEvent('bet:open', payload),
      'bet:close': (payload) => pushEvent('bet:close', payload),
      'game:animate': (payload) => {
        setPhase(payload.phase || 'race_pack');
        if (payload.countdown != null) setCountdown(payload.countdown);
        if (payload.leaderboard) setLeaderboard(payload.leaderboard);
        pushEvent('game:animate', payload);
      },
      'result:publish': (payload) => {
        setResult(payload.result);
        setLeaderboard(payload.result?.ranking || []);
        setPhase('finish_zoom');
        pushEvent('result:publish', payload);
      },
      'bet:placed': (payload) => pushEvent('bet:placed', payload)
    };

    Object.entries(handlers).forEach(([event, handler]) => socket.on(event, handler));
    return () => Object.entries(handlers).forEach(([event, handler]) => socket.off(event, handler));
  }, []);

  const pushEvent = (event, payload) => {
    setEvents((prev) => [{ event, payload, at: new Date().toISOString() }, ...prev].slice(0, 30));
  };

  const activePanel = useMemo(() => {
    if (role === 'kiosk') return <KioskPanel />;
    if (role === 'admin') return <AdminPanel />;
    return <SuperAdminPanel />;
  }, [role]);

  const quickLogin = async () => {
    const creds = credentialsByRole[role];
    try {
      const data = await login(creds.username, creds.password);
      localStorage.setItem('rgc_token', data.token);
      setAuthMsg(`Logged in as ${role}`);
    } catch (e) {
      setAuthMsg(`Login failed: ${e.message}`);
    }
  };

  return (
    <main className="layout">
      <header className="panel">
        <h1>Royal Gold Casino — Entertainment Platform</h1>
        <p>Storyboard mirrors your screenshots: board → start gate → race pack → finish zoom.</p>
        <div className="row">
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="kiosk">Kiosk Operator</option>
            <option value="admin">Admin</option>
            <option value="super-admin">Super Admin</option>
          </select>
          <button onClick={quickLogin}>Login as Selected Role</button>
          <span>{authMsg}</span>
        </div>
        <div className="row">
          <button onClick={() => socket.emit('round:next', { gameType: 'horseRace' })}>Start Round</button>
          <button onClick={() => socket.emit('round:close', { gameType: 'horseRace' })}>Close Bets + Animate</button>
          <button onClick={() => socket.emit('round:publish', { gameType: 'horseRace' })}>Publish Result</button>
        </div>
      </header>

      <section className="grid-two">
        <GameCanvas phase={phase} countdown={countdown} leaderboard={leaderboard} result={result} />
        {activePanel}
      </section>

      <section className="panel">
        <h3>Live Event Feed</h3>
        <pre>{JSON.stringify(events, null, 2)}</pre>
      </section>
    </main>
  );
}
