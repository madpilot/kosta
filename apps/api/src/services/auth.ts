import { randomBytes } from 'crypto';
import { SignJWT, jwtVerify } from 'jose';
import type { SystemStateDatabase } from '../db/index';
import { logger } from '../utils/logger';

const JWT_SECRET_KEY = 'jwt_secret';

const resolveSecret = (db: SystemStateDatabase): Uint8Array => {
  const stored = db.getSystemState(JWT_SECRET_KEY);
  if (stored && stored.length > 0) return new TextEncoder().encode(stored);
  const generated = randomBytes(48).toString('hex');
  db.setSystemState(JWT_SECRET_KEY, generated);
  logger.info('Generated and persisted a new JWT secret');
  return new TextEncoder().encode(generated);
};

export interface AuthService {
  generateToken(userId: string): Promise<string>;
  verifyToken(token: string): Promise<{ userId: string } | null>;
}

export const createAuthService = (db: SystemStateDatabase): AuthService => {
  const secret = resolveSecret(db);
  return {
    async generateToken(userId: string): Promise<string> {
      return new SignJWT({ userId })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('24h')
        .sign(secret);
    },

    async verifyToken(token: string): Promise<{ userId: string } | null> {
      try {
        const { payload } = await jwtVerify(token, secret);
        const { userId } = payload as { userId?: string };
        if (!userId) return null;
        return { userId };
      } catch (error) {
        logger.warn('Token verification failed', { error });
        return null;
      }
    },
  };
};
