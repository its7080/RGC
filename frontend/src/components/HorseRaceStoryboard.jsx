import React, { useMemo } from 'react';

const gameMeta = {
  horseRace: { title: 'LUCKY HORSE RACE', count: 12, prefix: 'Horse', boardClass: 'horse-card' },
  andarBahar: { title: 'ANDAR BAHAR', count: 2, prefix: 'Side', boardClass: 'card-item' },
  cards52: { title: '52 CARDS', count: 52, prefix: 'Card', boardClass: 'card-item' },
  cards24: { title: '24 CARDS', count: 24, prefix: 'Card', boardClass: 'card-item' },
  cards20: { title: '20 CARDS', count: 20, prefix: 'Card', boardClass: 'card-item' },
  tenKaDum: { title: '10 KA DUM', count: 10, prefix: 'No', boardClass: 'card-item' },
  luckySpin: { title: 'LUCKY SPIN', count: 12, prefix: 'Slot', boardClass: 'card-item' }
};

function buildItems(gameType) {
  const meta = gameMeta[gameType] || gameMeta.horseRace;
  if (gameType === 'andarBahar') return ['Andar', 'Bahar'];
  return Array.from({ length: meta.count }, (_, i) => `${meta.prefix} ${i + 1}`);
}

function makePack(gameType, leaderboard = []) {
  const items = buildItems(gameType);
  const positions = leaderboard.length ? leaderboard : Array.from({ length: items.length }, (_, i) => i + 1);
  return positions.map((itemNo, idx) => ({
    itemNo,
    label: items[itemNo - 1] || `Option ${itemNo}`,
    x: 16 + (idx % 6) * 11,
    y: 14 + Math.floor(idx / 6) * 16
  }));
}

export function HorseRaceStoryboard({ gameType = 'horseRace', phase, countdown = 5, leaderboard = [], result }) {
  const meta = gameMeta[gameType] || gameMeta.horseRace;
  const items = buildItems(gameType);
  const pack = useMemo(() => makePack(gameType, leaderboard), [gameType, leaderboard]);
  const winnerText = result?.winner || pack[0]?.label;

  if (phase === 'betting_board') {
    return (
      <div className="race-scene betting-board">
        <div className="banner">{meta.title}</div>
        <div className="cards-grid">
          {items.map((name, idx) => (
            <div key={name} className={meta.boardClass}>
              <div className="no">{idx + 1}</div>
              <div>{name}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (phase === 'start_gate') {
    return (
      <div className="race-scene gate-scene">
        <div className="draw-time">Draw Time</div>
        <div className="countdown">{countdown}</div>
        <div className="gate-row" style={{ gridTemplateColumns: `repeat(${Math.min(meta.count, 12)}, 1fr)` }}>
          {Array.from({ length: Math.min(meta.count, 12) }, (_, i) => (
            <div className="gate-slot" key={i}>
              <span>{i + 1}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="race-scene finish-scene">
      <div className="left-leaderboard">
        {pack.slice(0, 12).map((h, i) => (
          <div key={h.itemNo} className={`leader-item ${i === 0 ? 'leader' : ''}`}>
            #{h.itemNo} {h.label}
          </div>
        ))}
      </div>

      <div className="track">
        {pack.slice(0, 24).map((h, i) => (
          <div
            key={h.itemNo}
            className={`horse ${i === 0 ? 'winner' : ''}`}
            style={{ left: `${h.x + (phase === 'finish_zoom' ? 35 : 24)}%`, top: `${h.y}%` }}
          >
            <span>#{h.itemNo}</span>
          </div>
        ))}
        <div className="finish-line">FINISH</div>
      </div>

      {phase === 'finish_zoom' && <div className="zoom-box">Winner: {winnerText}</div>}
    </div>
  );
}
