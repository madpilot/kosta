import { SignJWT, jwtVerify } from 'jose';
import { logger } from '../utils/logger';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'garden-app-secret-key-change-in-production',
);

export interface AuthService {
  generateToken(userId: string): Promise<string>;
  verifyToken(token: string): Promise<{ userId: string } | null>;
}

export const createAuthService = (): AuthService => ({
  async generateToken(userId: string): Promise<string> {
    return new SignJWT({ userId })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(JWT_SECRET);
  },

  async verifyToken(token: string): Promise<{ userId: string } | null> {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      const { userId } = payload as { userId?: string };
      if (!userId) return null;
      return { userId };
    } catch (error) {
      logger.warn('Token verification failed', { error });
      return null;
    }
  },
});
