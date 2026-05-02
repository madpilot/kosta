import { createHash } from 'crypto';
import type { UserDatabase } from '../db/index';
import type {
  User, CreateUserInput, LoginInput, ChangePasswordInput,
} from '../models/user';
import { CreateUserInputSchema, LoginInputSchema, ChangePasswordInputSchema } from '../models/user';
import { config } from '../config';
import { logger } from '../utils/logger';

export const hashPassword = (password: string): string => (
  createHash('sha256').update(password).digest('hex')
);

export const verifyPassword = (password: string, hash: string): boolean => (
  hashPassword(password) === hash
);

export const generateResetUrl = (token: string): string => (
  `${config.app.baseUrl}/reset-password/${token}`
);

export const createUserService = (db: UserDatabase) => ({
  createUser(input: CreateUserInput): User {
    const validInput = CreateUserInputSchema.parse(input);
    return db.createUser({
      username: validInput.username,
      email: validInput.email,
      name: validInput.name || '',
      passwordHash: hashPassword(validInput.password),
    });
  },

  authenticateUser(input: LoginInput): User | null {
    const validInput = LoginInputSchema.parse(input);
    const user = db.getUserByUsername(validInput.username)
      || db.getUserByEmail(validInput.username);
    if (!user) return null;
    if (!verifyPassword(validInput.password, user.passwordHash)) {
      return null;
    }
    return user;
  },

  getUserById(id: string): User | null {
    const user = db.getUserByUsername(id) || db.getUserByEmail(id);
    return user || null;
  },

  changePassword(userId: string, input: ChangePasswordInput): boolean {
    const validInput = ChangePasswordInputSchema.parse(input);
    const user = this.getUserById(userId);
    if (!user) return false;

    if (!verifyPassword(validInput.oldPassword, user.passwordHash)) {
      return false;
    }

    const passwordHash = hashPassword(validInput.newPassword);
    const now = new Date().toISOString();
    const stmt = db.database.prepare(`
      UPDATE users SET password_hash = ?, updated_at = ?
      WHERE id = ?
    `);
    stmt.run(passwordHash, now, userId);
    return true;
  },

  initiatePasswordReset(email: string): User | null {
    const user = db.getUserByEmail(email);
    if (!user) return null;
    db.sendPasswordResetEmail(user, createEmailService());
    return user;
  },

  verifyResetToken(token: string): User | null {
    return db.verifyResetToken(token);
  },

  resetPassword(token: string, newPassword: string): User | null {
    const user = this.verifyResetToken(token);
    if (!user) return null;

    const passwordHash = hashPassword(newPassword);
    const now = new Date().toISOString();

    const stmt = db.database.prepare(`
      UPDATE users SET password_hash = ?, reset_token = ?, reset_token_expiry = ?, updated_at = ?
      WHERE id = ?
    `);
    stmt.run(passwordHash, null, null, now, user.id);
    return user;
  },
});

export const createEmailService = () => new SimpleEmailService();

class SimpleEmailService {
  async sendPasswordReset(email: string, name: string, token: string): Promise<void> {
    logger.info('Password reset email sent', {
      email,
      resetUrl: generateResetUrl(token),
    });
  }

  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    logger.info('Welcome email sent', { email, name });
  }
}

export default createUserService;
