import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from './config.js';
import {
  findRefreshTokenByHash,
  findUserById,
  findUserByUsername,
  isAccessTokenRevoked,
  revokeAccessToken,
  revokeRefreshToken,
  revokeRefreshTokenFamily,
  storeRefreshToken
} from './data/repository.js';
import { hashPassword, verifyPassword } from './security/password.js';

function hashRefreshToken(rawToken) {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

function parseExpiryDate(token) {
  const payload = jwt.decode(token);
  return new Date((payload.exp || 0) * 1000).toISOString();
}

export function issueAccessToken(user) {
  return jwt.sign({ jti: crypto.randomUUID(), sub: user.id, role: user.role, kioskId: user.kioskId || null, username: user.username }, config.jwtSecret, {
    expiresIn: config.accessTokenTtl
  });
}

async function issueRefreshToken(user, familyId = crypto.randomUUID()) {
  const refreshTokenId = crypto.randomUUID();
  const rawToken = jwt.sign({ jti: refreshTokenId, sub: user.id, familyId }, config.refreshTokenSecret, {
    expiresIn: config.refreshTokenTtl
  });

  await storeRefreshToken({
    id: refreshTokenId,
    userId: user.id,
    tokenHash: hashRefreshToken(rawToken),
    familyId,
    expiresAt: parseExpiryDate(rawToken)
  });

  return rawToken;
}

export async function issueAuthTokens(user) {
  return {
    accessToken: issueAccessToken(user),
    refreshToken: await issueRefreshToken(user)
  };
}

export async function rotateRefreshToken(refreshToken) {
  let decoded;
  try {
    decoded = jwt.verify(refreshToken, config.refreshTokenSecret);
  } catch {
    return null;
  }

  const tokenHash = hashRefreshToken(refreshToken);
  const stored = await findRefreshTokenByHash(tokenHash);
  if (!stored || stored.userId !== decoded.sub) return null;
  if (stored.revokedAt || new Date(stored.expiresAt) < new Date()) {
    await revokeRefreshTokenFamily(stored.familyId);
    return null;
  }

  const user = await findUserById(decoded.sub);
  if (!user) return null;

  const replacementId = crypto.randomUUID();
  const nextRefreshToken = jwt.sign(
    { jti: replacementId, sub: user.id, familyId: stored.familyId },
    config.refreshTokenSecret,
    { expiresIn: config.refreshTokenTtl }
  );

  await revokeRefreshToken(stored.id, replacementId);
  await storeRefreshToken({
    id: replacementId,
    userId: user.id,
    tokenHash: hashRefreshToken(nextRefreshToken),
    familyId: stored.familyId,
    expiresAt: parseExpiryDate(nextRefreshToken)
  });

  return {
    accessToken: issueAccessToken(user),
    refreshToken: nextRefreshToken,
    user
  };
}

export async function revokeSessionTokens({ refreshToken, accessToken }) {
  if (refreshToken) {
    const stored = await findRefreshTokenByHash(hashRefreshToken(refreshToken));
    if (stored) await revokeRefreshTokenFamily(stored.familyId);
  }

  if (accessToken) {
    const decoded = jwt.decode(accessToken);
    if (decoded?.jti && decoded?.exp) {
      await revokeAccessToken(decoded.jti, new Date(decoded.exp * 1000).toISOString());
    }
  }
}

export async function requireAuth(req, res, next) {
  const raw = req.headers.authorization || '';
  const token = raw.startsWith('Bearer ') ? raw.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing token' });

  try {
    const payload = jwt.verify(token, config.jwtSecret);
    if (payload?.jti && (await isAccessTokenRevoked(payload.jti))) {
      return res.status(401).json({ error: 'Token revoked' });
    }
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

export async function authenticateCredentials(username, password) {
  const user = await findUserByUsername(username);
  if (!user) return null;

  const ok = await verifyPassword(password, user.password);
  if (!ok) return null;

  return user;
}

export { hashPassword };
