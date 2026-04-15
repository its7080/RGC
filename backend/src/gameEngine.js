import { store, audit } from './store.js';

export function createRound(gameType = 'horseRace') {
  const roundId = `R-${Date.now()}`;
  store.rounds[gameType] = { id: roundId, stage: 'bet:open', result: null };
  return store.rounds[gameType];
}

export function closeBetWindow(gameType = 'horseRace') {
  const round = store.rounds[gameType];
  round.stage = 'bet:close';
  return round;
}

export function publishResult(gameType = 'horseRace') {
  const round = store.rounds[gameType];
  round.stage = 'result:publish';
  const result = {
    winner: Math.floor(Math.random() * 8) + 1,
    ranking: Array.from({ length: 8 }, (_, i) => i + 1).sort(() => Math.random() - 0.5)
  };
  round.result = result;
  audit('system', 'result.published', { gameType, roundId: round.id, result });
  return round;
}
