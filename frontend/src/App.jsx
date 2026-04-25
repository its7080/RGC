import React, { useEffect, useMemo, useState } from 'react';
import { login } from './api';
import { socket } from './socket';
import { GameCanvas } from './components/GameCanvas';
import { KioskPanel } from './components/KioskPanel';
import { KioskLandingScreen } from './components/KioskLandingScreen';
import { KioskTermsScreen } from './components/KioskTermsScreen';
import { AdminPanel } from './components/AdminPanel';
import { SuperAdminPanel } from './components/SuperAdminPanel';

const credentialsByRole = {
  kiosk: { username: 'kiosk', password: 'kiosk123' },
  admin: { username: 'admin', password: 'admin123' },
  'super-admin': { username: 'superadmin', password: 'super123' }
};

const gameLabels = {
  horseRace: '🎠 Lucky Horse Race',
  andarBahar: '🃏 Andar Bahar',
  cards52: '🃏 52 Cards',
  cards24: '♠️ 24 Cards',
  cards20: '♦️ 20 Cards',
  tenKaDum: '🔟 10 Ka Dum',
  luckySpin: '🎡 Lucky Spin'
};

const defaultGameState = {
  phase: 'betting_board',
  countdown: 5,
  leaderboard: [],
  result: null
};

export function App() {
  const [role, setRole] = useState('kiosk');
  const [activeGame, setActiveGame] = useState('horseRace');
  const [gameStates, setGameStates] = useState({ horseRace: defaultGameState });
  const [events, setEvents] = useState([]);
  const [authMsg, setAuthMsg] = useState('Not authenticated');
  const [kioskStep, setKioskStep] = useState('intro');

  useEffect(() => {
    const patchState = (gameType, patch) => {
      setGameStates((prev) => ({
        ...prev,
        [gameType]: { ...(prev[gameType] || defaultGameState), ...patch }
      }));
    };

    const handlers = {
      'round:start': (payload) => {
        const gameType = payload.gameType || 'horseRace';
        patchState(gameType, { phase: 'betting_board', result: null, leaderboard: [] });
        pushEvent('round:start', payload);
      },
      'bet:open': (payload) => pushEvent('bet:open', payload),
      'bet:close': (payload) => pushEvent('bet:close', payload),
      'game:animate': (payload) => {
        const gameType = payload.gameType || 'horseRace';
        patchState(gameType, {
          phase: payload.phase || 'race_pack',
          ...(payload.countdown != null ? { countdown: payload.countdown } : {}),
          ...(payload.leaderboard ? { leaderboard: payload.leaderboard } : {})
        });
        pushEvent('game:animate', payload);
      },
      'result:publish': (payload) => {
        const gameType = payload.gameType || 'horseRace';
        patchState(gameType, {
          phase: 'finish_zoom',
          result: payload.result,
          leaderboard: payload.result?.ranking || []
        });
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


  useEffect(() => {
    if (role === 'kiosk') setKioskStep('intro');
  }, [role]);
  const activePanel = useMemo(() => {
    if (role === 'kiosk') {
      if (kioskStep === 'intro') {
        return <KioskLandingScreen onPlayNow={() => setKioskStep('terms')} />;
      }
      if (kioskStep === 'terms') {
        return <KioskTermsScreen onAgree={() => setKioskStep('betting')} />;
      }
      return <KioskPanel gameLabels={gameLabels} />;
    }
    if (role === 'admin') return <AdminPanel />;
    return <SuperAdminPanel />;
  }, [role, kioskStep]);

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

  const currentGameState = gameStates[activeGame] || defaultGameState;

  return (
    <main className="layout">
      <header className="panel" style={{ display: role === 'kiosk' && kioskStep !== 'betting' ? 'none' : 'block' }}>
        <h1>Royal Gold Casino — Entertainment Platform</h1>
        <p>All enabled games auto-execute every 300 seconds (5 min). Bets are accepted before next round starts.</p>
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
          <select value={activeGame} onChange={(e) => setActiveGame(e.target.value)}>
            {Object.entries(gameLabels).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <button onClick={() => socket.emit('round:next', { gameType: activeGame })}>Start Round</button>
          <button onClick={() => socket.emit('round:close', { gameType: activeGame })}>Close Bets + Animate</button>
          <button onClick={() => socket.emit('round:publish', { gameType: activeGame })}>Publish Result</button>
        </div>
      </header>

      <section className={role === 'kiosk' && kioskStep !== 'betting' ? 'grid-one' : 'grid-two'}>
        {!(role === 'kiosk' && kioskStep !== 'betting') && (
          <GameCanvas
            gameType={activeGame}
            gameLabel={gameLabels[activeGame]}
            phase={currentGameState.phase}
            countdown={currentGameState.countdown}
            leaderboard={currentGameState.leaderboard}
            result={currentGameState.result}
          />
        )}
        {activePanel}
      </section>

      {!(role === 'kiosk' && kioskStep !== 'betting') && (
        <section className="panel">
          <h3>Live Event Feed</h3>
          <pre>{JSON.stringify(events, null, 2)}</pre>
        </section>
      )}
    </main>
  );
}
