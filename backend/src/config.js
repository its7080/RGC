import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: Number(process.env.PORT || 4000),
  jwtSecret: process.env.JWT_SECRET || 'dev_jwt_secret',
  refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET || 'dev_refresh_secret',
  accessTokenTtl: process.env.ACCESS_TOKEN_TTL || '15m',
  refreshTokenTtl: process.env.REFRESH_TOKEN_TTL || '7d',
  qrHmacSecret: process.env.QR_HMAC_SECRET || 'dev_qr_hmac_secret',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173'
};
