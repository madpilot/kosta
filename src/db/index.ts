import Database from 'better-sqlite3';
import type { createSqliteDatabase } from './sqlite';

export interface DatabaseWrapper {
  getAllPlants(): import('../models/plant').Plant[];
  getPlantById(id: string): import('../models/plant').Plant | null;
  createPlant(plant: Omit<import('../models/plant').Plant, 'id' | 'createdAt' | 'updatedAt'>): import('../models/plant').Plant;
  updatePlant(id: string, plant: Partial<import('../models/plant').Plant>): import('../models/plant').Plant | null;
  deletePlant(id: string): boolean;
  getAllCalendarEvents(): import('../models/calendar').CalendarEvent[];
  getCalendarEventById(id: string): import('../models/calendar').CalendarEvent | null;
  createCalendarEvent(event: Omit<import('../models/calendar').CalendarEvent, 'id' | 'completed' | 'createdAt' | 'updatedAt'>): import('../models/calendar').CalendarEvent;
  close(): void;
}

export interface UserDatabase extends DatabaseWrapper {
  getPasswordHash(password: string): string;
  verifyPassword(password: string, hash: string): boolean;
  createUser(input: Omit<import('../models/user').User, 'id' | 'passwordHash' | 'resetToken' | 'resetTokenExpiry' | 'createdAt' | 'updatedAt' | 'avatarUrl'>): import('../models/user').User;
  getUserByUsername(username: string): import('../models/user').User | null;
  getUserByEmail(email: string): import('../models/user').User | null;
  authenticateUser(username: string, password: string): import('../models/user').User | null;
  verifyResetToken(token: string): import('../models/user').User | null;
  generateResetToken(): string;
  sendPasswordResetEmail(user: import('../models/user').User, emailService: EmailService): void;
  generateResetUrl(user: import('../models/user').User, token: string, expiry: Date): string;
  mapRowToUser(row: any): import('../models/user').User | null;
}

export interface EmailService {
  sendPasswordReset(email: string, name: string, token: string): Promise<void>;
}

export type getDatabase = ReturnType<typeof createSqliteDatabase>;