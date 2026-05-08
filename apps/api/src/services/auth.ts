import { SignJWT, jwtVerify } from 'jose';
import { logger } from '../utils/logger';

const DEV_FALLBACK_SECRET = 'garden-app-secret-key-change-in-production';

const resolveSecret = (): Uint8Array => {
  const fromEnv = process.env.JWT_SECRET;
  if (fromEnv && fromEnv.length > 0) return new TextEncoder().encode(fromEnv);
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET environment variable must be set in production');
  }
  logger.warn('JWT_SECRET not set — using development fallback. Do not use in production.');
  return new TextEncoder().encode(DEV_FALLBACK_SECRET);
};

export interface AuthService {
  generateToken(userId: string): Promise<string>;
  verifyToken(token: string): Promise<{ userId: string } | null>;
}

export const createAuthService = (): AuthService => {
  const secret = resolveSecret();
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
