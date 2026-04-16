import crypto from 'crypto';
import { promisify } from 'util';

const scrypt = promisify(crypto.scrypt);
const KEY_LENGTH = 64;
const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const HASH_PREFIX = 'scrypt';

function isScryptHash(value) {
  return typeof value === 'string' && value.startsWith(`${HASH_PREFIX}$`);
}

export async function hashPassword(plainTextPassword) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = await scrypt(plainTextPassword, salt, KEY_LENGTH, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P
  });
  const hash = Buffer.from(derivedKey).toString('hex');
  return `${HASH_PREFIX}$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${salt}$${hash}`;
}

export async function verifyPassword(plainTextPassword, storedPassword) {
  if (isScryptHash(storedPassword)) {
    const [, nText, rText, pText, salt, expectedHex] = storedPassword.split('$');
    const derivedKey = await scrypt(plainTextPassword, salt, KEY_LENGTH, {
      N: Number(nText),
      r: Number(rText),
      p: Number(pText)
    });
    const expected = Buffer.from(expectedHex, 'hex');
    const actual = Buffer.from(derivedKey);
    return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
  }

  // Backward compatibility for legacy seeded/demo users.
  return plainTextPassword === storedPassword;
}
