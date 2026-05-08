import { z } from 'zod';

export const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255),
  username: z.string().min(3).max(50),
  email: z.string().email(),
  passwordHash: z.string().min(32),
  resetToken: z.string().optional(),
  resetTokenExpiry: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  avatarUrl: z.string().url().optional(),
  timezone: z.string().optional(),
});

export type User = z.infer<typeof UserSchema>;

export const CreateUserInputSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  name: z.string().min(1).max(255).optional(),
  password: z.string().min(8),
});

export type CreateUserInput = z.infer<typeof CreateUserInputSchema>;

export const LoginInputSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export type LoginInput = z.infer<typeof LoginInputSchema>;

export const ChangePasswordInputSchema = z.object({
  oldPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

export type ChangePasswordInput = z.infer<typeof ChangePasswordInputSchema>;
