import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import type { UserDatabase } from '../db/index';
import type { User, CreateUserInput, LoginInput, ChangePasswordInput } from '../models/user';
import { CreateUserInputSchema, LoginInputSchema, ChangePasswordInputSchema } from '../models/user';
import { config } from '../config';
import { logger } from '../utils/logger';

const SCRYPT_KEY_LEN = 64;
const SCRYPT_PARAMS = { N: 16384, r: 8, p: 1 };

export const hashPassword = (password: string): string => {
  const salt = randomBytes(16);
  const derived = scryptSync(password, salt, SCRYPT_KEY_LEN, SCRYPT_PARAMS);
  return `scrypt$${SCRYPT_PARAMS.N}$${SCRYPT_PARAMS.r}$${SCRYPT_PARAMS.p}$${salt.toString('hex')}$${derived.toString('hex')}`;
};

export const verifyPassword = (password: string, stored: string): boolean => {
  const parts = stored.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
  const [, nStr, rStr, pStr, saltHex, hashHex] = parts;
  const salt = Buffer.from(saltHex, 'hex');
  const expected = Buffer.from(hashHex, 'hex');
  const actual = scryptSync(password, salt, expected.length, {
    N: Number(nStr),
    r: Number(rStr),
    p: Number(pStr),
  });
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
};

export const generateResetUrl = (token: string): string =>
  `${config.app.baseUrl}/reset-password/${token}`;

export const generateGravatarUrl = (email: string): string => {
  const hash = createHash('sha256').update(email.toLowerCase().trim()).digest('hex');
  return `https://www.gravatar.com/avatar/${hash}?d=identicon`;
};

export interface EmailService {
  sendPasswordReset(email: string, name: string, token: string): Promise<void>;
  sendWelcomeEmail(email: string, name: string): Promise<void>;
}

export const createEmailService = (): EmailService => ({
  sendPasswordReset: async (email: string, name: string, _token: string): Promise<void> => {
    // The token is a credential — never log it.
    logger.info('Password reset email queued', { email, name });
  },
  sendWelcomeEmail: async (email: string, name: string): Promise<void> => {
    logger.info('Welcome email queued', { email, name });
  },
});

export const createUserService = (
  db: UserDatabase,
  emailService: EmailService = createEmailService(),
) => ({
  createUser(input: CreateUserInput): User {
    const validInput = CreateUserInputSchema.parse(input);
    const user = db.createUser({
      username: validInput.username,
      email: validInput.email,
      name: validInput.name || '',
      passwordHash: hashPassword(validInput.password),
      avatarUrl: generateGravatarUrl(validInput.email),
    });
    emailService.sendWelcomeEmail(user.email, user.name).catch(() => undefined);
    return user;
  },

  authenticateUser(input: LoginInput): User | null {
    const validInput = LoginInputSchema.parse(input);
    const user =
      db.getUserByUsername(validInput.username) || db.getUserByEmail(validInput.username);
    if (!user) return null;
    if (!verifyPassword(validInput.password, user.passwordHash)) {
      return null;
    }
    return user;
  },

  getUserById(id: string): User | null {
    return db.getUserById(id);
  },

  changePassword(userId: string, input: ChangePasswordInput): boolean {
    const validInput = ChangePasswordInputSchema.parse(input);
    const user = this.getUserById(userId);
    if (!user) return false;

    if (!verifyPassword(validInput.oldPassword, user.passwordHash)) {
      return false;
    }

    const passwordHash = hashPassword(validInput.newPassword);
    return db.updateUser(userId, { passwordHash }) !== null;
  },

  initiatePasswordReset(email: string): void {
    const user = db.getUserByEmail(email);
    if (!user) return;
    const token = db.issueResetToken(user.id);
    emailService.sendPasswordReset(user.email, user.name, token).catch(() => undefined);
  },

  verifyResetToken(token: string): User | null {
    return db.verifyResetToken(token);
  },

  resetPassword(token: string, newPassword: string): User | null {
    const user = this.verifyResetToken(token);
    if (!user) return null;

    const passwordHash = hashPassword(newPassword);
    return db.updateUser(user.id, {
      passwordHash,
      resetToken: undefined,
      resetTokenExpiry: undefined,
    });
  },
});

export default createUserService;
