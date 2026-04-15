export const store = {
  users: [
    { id: 'kiosk-1', username: 'kiosk', password: 'kiosk123', role: 'kiosk', kioskId: 'K-001' },
    { id: 'admin-1', username: 'admin', password: 'admin123', role: 'admin' },
    { id: 'super-1', username: 'superadmin', password: 'super123', role: 'super-admin' }
  ],
  kiosks: {
    'K-001': { coinBalance: 10000, minBet: 10, maxBet: 500, active: true }
  },
  rounds: {
    horseRace: { id: 'R-INIT', stage: 'bet:open', result: null }
  },
  bets: [],
  auditLogs: [],
  config: {
    maintenanceMode: false,
    roundDurationSeconds: 60,
    gameAvailability: { horseRace: true, luckySpin: true, cardGame: true, numberDraw: true }
  }
};

export function audit(actor, action, details = {}) {
  store.auditLogs.push({ id: crypto.randomUUID(), actor, action, details, at: new Date().toISOString() });
}
