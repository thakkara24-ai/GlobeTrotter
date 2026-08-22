import dotenv from 'dotenv';
import path from 'path';

// Load .env if present
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/globetrotter',
  jwtSecret: process.env.JWT_SECRET || 'globetrotter_super_secure_jwt_secret_key_2026',
  jwtExpiresIn: '7d',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
  },
  aiApiKey: process.env.AI_API_KEY || '',
  isProduction: process.env.NODE_ENV === 'production',
};
