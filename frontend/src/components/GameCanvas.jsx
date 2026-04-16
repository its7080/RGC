import React from 'react';
import { HorseRaceStoryboard } from './HorseRaceStoryboard';

export function GameCanvas({ gameType, gameLabel, phase, countdown, leaderboard, result }) {
  return (
    <div className="panel">
      <h3>{gameLabel} - full animation</h3>
      <p>
        Game: <strong>{gameType}</strong> | Phase: <strong>{phase || 'betting_board'}</strong>
      </p>
      <HorseRaceStoryboard
        gameType={gameType}
        phase={phase}
        countdown={countdown}
        leaderboard={leaderboard}
        result={result}
      />
    </div>
  );
}
