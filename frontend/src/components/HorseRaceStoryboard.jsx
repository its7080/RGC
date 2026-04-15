import React, { useMemo } from 'react';

const horseNames = [
  'CHETAK', 'LUCKY', 'BAAZIGAR', 'JEET', 'TIGER', 'ROCKY', 'TOOFAN', 'RANGEELA', 'ARJUN', 'ROYAL', 'TARZAN', 'STAR'
];

function makePack(leaderboard = []) {
  const positions = leaderboard.length ? leaderboard : Array.from({ length: 12 }, (_, i) => i + 1);
  return positions.map((horseNo, idx) => ({
    horseNo,
    name: horseNames[horseNo - 1],
    x: 15 + idx * 2.5,
    y: 14 + (idx % 4) * 18
  }));
}

export function HorseRaceStoryboard({ phase, countdown = 5, leaderboard = [], result }) {
  const pack = useMemo(() => makePack(leaderboard), [leaderboard]);
  const winner = result?.winner || leaderboard?.[0] || 2;

  if (phase === 'betting_board') {
    return (
      <div className="race-scene betting-board">
        <div className="banner">LUCKY HORSE RACE</div>
        <div className="cards-grid">
          {horseNames.map((name, idx) => (
            <div key={name} className="horse-card">
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
        <div className="gate-row">
          {Array.from({ length: 12 }, (_, i) => (
            <div className="gate-slot" key={i}>
              <span>{i + 1}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (phase === 'finish_zoom') {
    return (
      <div className="race-scene finish-scene">
        <div className="left-leaderboard">
          {pack.slice(0, 12).map((h, i) => (
            <div key={h.horseNo} className={`leader-item ${i === 0 ? 'leader' : ''}`}>
              #{h.horseNo} {h.name}
            </div>
          ))}
        </div>

        <div className="track">
          {pack.map((h, i) => (
            <div
              key={h.horseNo}
              className={`horse ${i === 0 ? 'winner' : ''}`}
              style={{ left: `${h.x + (i === 0 ? 55 : 30)}%`, top: `${h.y}%` }}
            >
              <span>#{h.horseNo}</span>
            </div>
          ))}
          <div className="finish-line">FINISH</div>
        </div>

        <div className="zoom-box">Photo Finish: Horse #{winner}</div>
      </div>
    );
  }

  return (
    <div className="race-scene race-pack">
      <div className="left-leaderboard">
        {pack.map((h, i) => (
          <div key={h.horseNo} className={`leader-item ${i === 0 ? 'leader' : ''}`}>
            #{h.horseNo} {h.name}
          </div>
        ))}
      </div>

      <div className="track">
        {pack.map((h, i) => (
          <div key={h.horseNo} className={`horse ${i === 0 ? 'winner' : ''}`} style={{ left: `${h.x + 25}%`, top: `${h.y}%` }}>
            <span>#{h.horseNo}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
