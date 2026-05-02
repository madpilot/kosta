import type { DatabaseWrapper } from '../db/index';
import type {
  User, CreateUserInput, LoginInput, ChangePasswordInput,
} from '../models/user';
import { CreateUserInputSchema, LoginInputSchema, ChangePasswordInputSchema } from '../models/user';
import { logger } from '../utils/logger';

export const createUserService = (db: DatabaseWrapper) => ({
  createUser(input: CreateUserInput): User {
    const validInput = CreateUserInputSchema.parse(input);
    return db.createUser(validInput);
  },

  authenticateUser(input: LoginInput): User | null {
    const validInput = LoginInputSchema.parse(input);
    return db.authenticateUser(validInput.username, validInput.password);
  },

  getUserById(id: string): User | null {
    const user = db.getUserByUsername(id) || db.getUserByEmail(id);
    return user || null;
  },

  changePassword(userId: string, input: ChangePasswordInput): boolean {
    const validInput = ChangePasswordInputSchema.parse(input);
    const user = this.getUserById(userId);
    if (!user) return false;

    if (!db.verifyPassword(validInput.oldPassword, user.passwordHash)) {
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
      resetUrl: `http://localhost:3000/reset-password/${token}`,
    });
  }

  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    logger.info('Welcome email sent', { email, name });
  }
}

export default createUserService;
