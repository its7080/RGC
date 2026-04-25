import React from 'react';

const gameMeta = {
  horseRace: { icon: '🎠', tag: 'Live Every 5 Min' },
  andarBahar: { icon: '🃏', tag: 'Fast Card Duel' },
  cards52: { icon: '🂡', tag: 'Classic Deck' },
  cards24: { icon: '♠️', tag: 'Quick Picks' },
  cards20: { icon: '♦️', tag: 'Compact Deck' },
  tenKaDum: { icon: '🔟', tag: 'Lucky Numbers' },
  luckySpin: { icon: '🎡', tag: 'Spin & Win' }
};

export function KioskGameSelectScreen({ gameLabels = {}, selectedGame, onSelectGame, onContinue, onBack }) {
  const gameEntries = Object.entries(gameLabels);

  return (
    <section className="kiosk-game-select" aria-label="Kiosk game dashboard">
      <div className="kiosk-bg-pattern" />

      <aside className="kiosk-age-banner" aria-label="Age warning">
        <span className="badge">18+</span>
        <div>
          <div className="headline">STRICTLY FOR AMUSEMENT ONLY</div>
          <div className="subline">You should be 18 years and above to use this site</div>
        </div>
      </aside>

      <div className="game-select-content">
        <header className="game-select-head">
          <h2>KIOSK GAME DASHBOARD</h2>
          <p>Choose a game to continue</p>
        </header>

        <div className="game-card-grid">
          {gameEntries.map(([gameKey, gameLabel]) => {
            const meta = gameMeta[gameKey] || { icon: '🎲', tag: 'Casino Game' };
            const isSelected = selectedGame === gameKey;
            return (
              <button
                key={gameKey}
                type="button"
                className={`game-card ${isSelected ? 'selected' : ''}`}
                onClick={() => onSelectGame(gameKey)}
                aria-pressed={isSelected}
              >
                <span className="game-card-icon" aria-hidden>{meta.icon}</span>
                <span className="game-card-name">{gameLabel.replace(/^[^\w]+\s*/, '')}</span>
                <span className="game-card-tag">{meta.tag}</span>
              </button>
            );
          })}
        </div>

        <div className="row" style={{ justifyContent: 'center', gap: 12 }}>
          {onBack && (
            <button className="play-now-kiosk" type="button" onClick={onBack}>
              BACK
            </button>
          )}
          <button className="play-now-kiosk" type="button" onClick={onContinue}>PLAY {gameLabels[selectedGame] || 'GAME'}</button>
        </div>
      </div>
    </section>
  );
}
