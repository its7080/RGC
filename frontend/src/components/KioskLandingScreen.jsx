import React from 'react';

const suitSymbols = ['♠', '♥', '♦', '♣'];

function buildRingItems(total = 28, radius = 40) {
  return Array.from({ length: total }, (_, i) => {
    const angle = (i / total) * Math.PI * 2 - Math.PI / 2;
    const x = 50 + radius * Math.cos(angle);
    const y = 50 + radius * Math.sin(angle);
    return {
      id: i,
      symbol: suitSymbols[i % suitSymbols.length],
      x,
      y,
      delay: `${(i % 7) * 0.25}s`,
      size: i % 5 === 0 ? 'lg' : i % 3 === 0 ? 'md' : 'sm'
    };
  });
}

const ringItems = buildRingItems();

export function KioskLandingScreen({ onPlayNow }) {
  return (
    <section className="kiosk-landing" aria-label="Kiosk landing screen">
      <div className="kiosk-bg-pattern" />

      <aside className="kiosk-age-banner" aria-label="Age warning">
        <span className="badge">18+</span>
        <div>
          <div className="headline">STRICTLY FOR AMUSEMENT ONLY</div>
          <div className="subline">You should be 18 years and above to use this site</div>
        </div>
      </aside>

      <div className="kiosk-center-stage">
        <div className="suit-ring" aria-hidden>
          {ringItems.map((item) => (
            <span
              key={item.id}
              className={`suit-chip ${item.size}`}
              style={{ left: `${item.x}%`, top: `${item.y}%`, animationDelay: item.delay }}
            >
              {item.symbol}
            </span>
          ))}
        </div>

        <div className="royal-sign" role="img" aria-label="Royal Casino">
          <span>Royal</span>
          <span>Casino</span>
        </div>
      </div>

      <button className="play-now-kiosk" onClick={onPlayNow}>PLAY NOW</button>
    </section>
  );
}
