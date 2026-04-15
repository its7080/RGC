import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: Number(process.env.PORT || 4000),
  jwtSecret: process.env.JWT_SECRET || 'dev_jwt_secret',
  qrHmacSecret: process.env.QR_HMAC_SECRET || 'dev_qr_hmac_secret',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173'
};
