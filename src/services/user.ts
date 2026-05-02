import type { UserDatabase } from '../db/index';
import type {
  User, CreateUserInput, LoginInput, ChangePasswordInput,
} from '../models/user';
import { CreateUserInputSchema, LoginInputSchema, ChangePasswordInputSchema } from '../models/user';
import { config } from '../config';
import { logger } from '../utils/logger';

export const verifyPassword = (
  password: string,
  hash: string,
  hashFn: (input: string) => string,
): boolean => hashFn(password) === hash;

export const createUserService = (db: UserDatabase) => ({
  createUser(input: CreateUserInput): User {
    const validInput = CreateUserInputSchema.parse(input);
    return db.createUser(validInput);
  },

  authenticateUser(input: LoginInput): User | null {
    const validInput = LoginInputSchema.parse(input);
    const user = db.getUserByUsername(validInput.username)
      || db.getUserByEmail(validInput.username);
    if (!user) return null;
    if (!verifyPassword(validInput.password, user.passwordHash, db.getPasswordHash)) {
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

    if (!verifyPassword(validInput.oldPassword, user.passwordHash, db.getPasswordHash)) {
      return false;
    }

    const passwordHash = db.getPasswordHash(validInput.newPassword);
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
    const validPassword = newPassword;
    const user = this.verifyResetToken(token);
    if (!user) return null;

    const passwordHash = db.getPasswordHash(validPassword);
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
      resetUrl: `${config.app.baseUrl}/reset-password/${token}`,
    });
  }

  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    logger.info('Welcome email sent', { email, name });
  }
}

export default createUserService;
