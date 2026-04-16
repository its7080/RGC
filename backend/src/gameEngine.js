import { appendAudit, getRound, upsertRound } from './data/repository.js';

export const GAME_RULES = {
  horseRace: { optionCount: 12, labels: Array.from({ length: 12 }, (_, i) => `horse-${i + 1}`) },
  andarBahar: { optionCount: 2, labels: ['andar', 'bahar'] },
  cards52: { optionCount: 52, labels: Array.from({ length: 52 }, (_, i) => `card-${i + 1}`) },
  cards24: { optionCount: 24, labels: Array.from({ length: 24 }, (_, i) => `card-${i + 1}`) },
  cards20: { optionCount: 20, labels: Array.from({ length: 20 }, (_, i) => `card-${i + 1}`) },
  tenKaDum: { optionCount: 10, labels: Array.from({ length: 10 }, (_, i) => `number-${i + 1}`) },
  luckySpin: { optionCount: 12, labels: Array.from({ length: 12 }, (_, i) => `slot-${i + 1}`) }
};

function getRule(gameType) {
  return GAME_RULES[gameType] || GAME_RULES.horseRace;
}

function shuffledRange(size) {
  return Array.from({ length: size }, (_, i) => i + 1).sort(() => Math.random() - 0.5);
}

export async function createRound(gameType = 'horseRace') {
  const round = { id: `${gameType}-R-${Date.now()}`, stage: 'bet:open', result: null };
  await upsertRound(gameType, round);
  return round;
}

export async function ensureRound(gameType = 'horseRace') {
  const existing = await getRound(gameType);
  if (existing) return existing;
  return createRound(gameType);
}

export async function closeBetWindow(gameType = 'horseRace') {
  const round = await ensureRound(gameType);
  const next = { ...round, stage: 'bet:close' };
  await upsertRound(gameType, next);
  return next;
}

export async function publishResult(gameType = 'horseRace') {
  const round = await ensureRound(gameType);
  const rule = getRule(gameType);
  const ranking = shuffledRange(rule.optionCount);
  const winnerIndex = ranking[0];

  const result = {
    winner: rule.labels[winnerIndex - 1] || `${winnerIndex}`,
    winnerIndex,
    ranking
  };

  const next = { ...round, stage: 'result:publish', result };
  await upsertRound(gameType, next);
  await appendAudit('system', 'result.published', { gameType, roundId: next.id, result });
  return next;
}
