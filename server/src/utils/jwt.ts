import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { Types } from 'mongoose';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export const generateToken = (userId: Types.ObjectId | string, email: string, role: string): string => {
  return jwt.sign(
    { userId: userId.toString(), email, role },
    config.jwtSecret,
    { expiresIn: '7d' }
  );
};

export const verifyToken = (token: string): TokenPayload => {
  return jwt.verify(token, config.jwtSecret) as TokenPayload;
};
