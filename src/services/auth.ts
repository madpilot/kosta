import { randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';
import type { createSqliteDatabase } from '../db/index';

export interface AuthService {
  generateToken(userId: string): string;
  verifyToken(token: string): { userId: string } | null;
}

export const createAuthService = (db: DatabaseWrapper): AuthService => {
  return {
    generateToken(userId: string): string {
      try {
        const token = randomBytes(32).toString('hex');
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);
        const now = new Date().toISOString();

        const stmt = db['database'].prepare(`
          INSERT INTO tokens (user_id, token, expires_at, created_at)
          VALUES (?, ?, ?, ?)
        `);
        stmt.run(userId, token, expiresAt.toISOString(), now);
        return token;
      } catch (error) {
        throw new Error('Failed to generate authentication token');
      }
    },

    verifyToken(token: string): { userId: string } | null {
      try {
        const stmt = db['database'].prepare(`
          SELECT user_id, expires_at
          FROM tokens
          WHERE token = ? AND expires_at > ?
        `);
        const row = stmt.get(token, new Date().toISOString()) as any;

        if (!row || row.expires_at <= new Date().toISOString()) {
          return null;
        }

        return { userId: row.user_id };
      } catch (error) {
        return null;
      }
    },
  };
};