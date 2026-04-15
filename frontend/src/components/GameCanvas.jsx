import React from 'react';
import { HorseRaceStoryboard } from './HorseRaceStoryboard';

export function GameCanvas({ phase, countdown, leaderboard, result }) {
  return (
    <div className="panel">
      <h3>Horse Race Animation Storyboard</h3>
      <p>
        Phase: <strong>{phase || 'betting_board'}</strong>
      </p>
      <HorseRaceStoryboard phase={phase} countdown={countdown} leaderboard={leaderboard} result={result} />
    </div>
  );
}
