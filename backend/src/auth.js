import jwt from 'jsonwebtoken';
import { config } from './config.js';
import { store } from './store.js';

export function issueToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role, kioskId: user.kioskId || null, username: user.username },
    config.jwtSecret,
    { expiresIn: '12h' }
  );
}

export function requireAuth(req, res, next) {
  const raw = req.headers.authorization || '';
  const token = raw.startsWith('Bearer ') ? raw.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing token' });

  try {
    const payload = jwt.verify(token, config.jwtSecret);
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

export function requireRole(...allowed) {
  return (req, res, next) => {
    if (!req.user || !allowed.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}

export function authenticateCredentials(username, password) {
  return store.users.find((u) => u.username === username && u.password === password) || null;
}
