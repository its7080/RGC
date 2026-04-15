import crypto from 'crypto';
import { config } from './config.js';

export function signPayload(payloadObj) {
  const data = JSON.stringify(payloadObj);
  const sig = crypto.createHmac('sha256', config.qrHmacSecret).update(data).digest('hex');
  return Buffer.from(JSON.stringify({ data, sig })).toString('base64url');
}

export function verifyPayload(token) {
  const parsed = JSON.parse(Buffer.from(token, 'base64url').toString('utf8'));
  const expected = crypto.createHmac('sha256', config.qrHmacSecret).update(parsed.data).digest('hex');
  if (expected !== parsed.sig) return { ok: false, reason: 'Invalid signature' };
  return { ok: true, data: JSON.parse(parsed.data) };
}
