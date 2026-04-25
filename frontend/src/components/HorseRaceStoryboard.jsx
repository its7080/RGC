import React, { useMemo } from 'react';
import { HorseRaceThreeScene } from './HorseRaceThreeScene';

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

const horseNames = [
  'CHETAK',
  'LUCKY',
  'BAAZIGAR',
  'JEET',
  'TIGER',
  'ROCKY',
  'TOOFAN',
  'RANGEELA',
  'ARJUN',
  'ROYAL',
  'TARZAN',
  'STAR'
];

function normalizeRanking(leaderboard = [], result) {
  const fromResult = result?.ranking?.map((n) => Number(n)).filter((n) => Number.isInteger(n) && n >= 1 && n <= 12) || [];
  const fromFeed = leaderboard.map((n) => Number(n)).filter((n) => Number.isInteger(n) && n >= 1 && n <= 12);
  const base = (fromResult.length ? fromResult : fromFeed).slice(0, 12);
  const missing = Array.from({ length: 12 }, (_, i) => i + 1).filter((n) => !base.includes(n));
  return [...base, ...missing];
}

export function HorseRaceStoryboard({ gameType = 'horseRace', phase, countdown = 5, leaderboard = [], result }) {
  const meta = gameMeta[gameType] || gameMeta.horseRace;
  const items = buildItems(gameType);
  const pack = useMemo(() => makePack(gameType, leaderboard), [gameType, leaderboard]);
  const ranking = useMemo(() => normalizeRanking(leaderboard, result), [leaderboard, result]);
  const winnerNo = ranking[0] || 1;
  const winnerText = horseNames[winnerNo - 1] || result?.winner || pack[0]?.label;
  const showHorseRaceUi = gameType === 'horseRace';

  if (showHorseRaceUi && phase === 'betting_board') {
    return (
      <div className="race-scene horse-betting-board">
        <div className="horse-topbar">
          <div>ROYAL CASINO</div>
          <div>FOR AMUSEMENT ONLY</div>
          <div>WELCOME</div>
          <div>DRAW: 05:19 PM</div>
          <div>BALANCE 430</div>
        </div>

        <div className="horse-board-main">
          <aside className="chips-column">
            {[10, 20, 50, 100, 500, 1000].map((chip) => (
              <button key={chip} type="button" className="chip-pill">{chip}</button>
            ))}
          </aside>

          <section className="horse-cards-wrap">
            <header className="horse-banner">
              <h2>Lucky Horse Race</h2>
              <div className="winner-banner">
                <span className="winner-no">{winnerNo}</span>
                <span>{winnerText}</span>
              </div>
              <div className="count-ring">{Math.max(0, Number(countdown) || 0)}</div>
            </header>

            <div className="horse-cards-grid">
              {horseNames.map((name, idx) => (
                <article key={name} className="horse-card-new">
                  <div className="horse-no-tag">{idx + 1}</div>
                  <div className="horse-title">{name}</div>
                  <div className="horse-art">{idx % 2 === 0 ? '🐎' : '🏇'}</div>
                  <div className={`horse-color ${idx % 2 ? 'black' : 'red'}`} />
                </article>
              ))}
            </div>
            <footer className="horse-bet-footer">
              <button type="button">INFO</button>
              <button type="button">CLEAR</button>
              <button type="button">REPEAT</button>
              <button type="button">DOUBLE</button>
              <button type="button" className="bet-btn">BET</button>
            </footer>
          </section>

          <aside className="result-column">
            <h3>Today’s Game Result</h3>
            <div className="result-list">
              {ranking.slice(0, 8).map((horseNo, idx) => (
                <div key={`${horseNo}-${idx}`} className="result-row">
                  <span>{`05:${(16 - idx * 3).toString().padStart(2, '0')} PM`}</span>
                  <strong>{horseNo}</strong>
                  <span>{horseNames[horseNo - 1]}</span>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>
    );
  }

  if (!showHorseRaceUi && phase === 'betting_board') {
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
      <div className={`race-scene ${showHorseRaceUi ? 'horse-start-scene' : 'gate-scene'}`}>
        <div className="draw-time">Draw Time: 05:22 PM</div>
        <div className="countdown">{countdown}</div>
        {showHorseRaceUi ? (
          <>
            <div className="start-title-board">Lucky Horse Race</div>
            <div className="horse-gate-row" style={{ gridTemplateColumns: `repeat(${Math.min(meta.count, 12)}, 1fr)` }}>
              {Array.from({ length: Math.min(meta.count, 12) }, (_, i) => (
                <div className="horse-gate-slot" key={i}>
                  <div className={`pin ${i % 2 ? 'blk' : 'red'}`}>{i + 1}</div>
                  <span role="img" aria-label="rider">🏇</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="gate-row" style={{ gridTemplateColumns: `repeat(${Math.min(meta.count, 12)}, 1fr)` }}>
            {Array.from({ length: Math.min(meta.count, 12) }, (_, i) => (
              <div className="gate-slot" key={i}>
                <span>{i + 1}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (showHorseRaceUi) {
    return (
      <div className={`race-scene horse-run-scene ${phase === 'finish_zoom' ? 'finish' : 'running'}`}>
        <div className="draw-time">Draw Time: 05:22 PM</div>
        <aside className="run-leaderboard">
          {ranking.map((horseNo, idx) => (
            <div key={`${horseNo}-${idx}`} className={`run-leader-item ${idx === 0 ? 'leader' : ''}`}>
              <strong>{horseNo}</strong>
              <span>{horseNames[horseNo - 1]}</span>
            </div>
          ))}
        </aside>

        <div className="run-track">
          <HorseRaceThreeScene ranking={ranking} phase={phase} />
          <div className="finish-line-v2" />
          {ranking.map((horseNo, idx) => {
            const rankPosition = ranking.indexOf(horseNo);
            const liveTarget = 56 + (11 - rankPosition) * 2.8;
            const finishTarget = 28 + (11 - rankPosition) * 2.2;
            return (
              <div
                key={horseNo}
                className={`horse-runner ${phase === 'finish_zoom' ? 'done' : 'live'} ${idx === 0 ? 'winner' : ''}`}
                style={{
                  top: `${8 + idx * 6.9}%`,
                  '--run-target': `${phase === 'finish_zoom' ? finishTarget : liveTarget}%`
                }}
              >
                <span className="runner-label">{horseNo}</span>
                <span className="runner-emoji">🏇</span>
              </div>
            );
          })}
        </div>

        {phase === 'finish_zoom' && (
          <div className="zoom-box">
            <div className="zoom-title">Finish Zoom</div>
            <div className="zoom-winner">Winner #{winnerNo} - {winnerText}</div>
          </div>
        )}
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
