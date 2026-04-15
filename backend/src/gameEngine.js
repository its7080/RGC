import { appendAudit, getRound, upsertRound } from './data/repository.js';

export async function createRound(gameType = 'horseRace') {
  const round = { id: `R-${Date.now()}`, stage: 'bet:open', result: null };
  await upsertRound(gameType, round);
  return round;
}

export async function closeBetWindow(gameType = 'horseRace') {
  const round = await getRound(gameType);
  const next = { ...round, stage: 'bet:close' };
  await upsertRound(gameType, next);
  return next;
}

export async function publishResult(gameType = 'horseRace') {
  const round = await getRound(gameType);
  const result = {
    winner: Math.floor(Math.random() * 8) + 1,
    ranking: Array.from({ length: 8 }, (_, i) => i + 1).sort(() => Math.random() - 0.5)
  };
  const next = { ...round, stage: 'result:publish', result };
  await upsertRound(gameType, next);
  await appendAudit('system', 'result.published', { gameType, roundId: next.id, result });
  return next;
}
