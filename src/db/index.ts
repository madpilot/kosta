import Database from 'better-sqlite3';
import type { createSqliteDatabase } from './sqlite';
import type { Plant } from '../models/plant';
import type { CalendarEvent } from '../models/calendar';
import type { User } from '../models/user';

export interface DatabaseWrapper {
  getAllPlants(): Plant[];
  getPlantById(id: string): Plant | null;
  createPlant(plant: Omit<Plant, 'id' | 'createdAt' | 'updatedAt'>): Plant;
  updatePlant(id: string, plant: Partial<Plant>): Plant | null;
  deletePlant(id: string): boolean;
  getAllCalendarEvents(): CalendarEvent[];
  getCalendarEventById(id: string): CalendarEvent | null;
  createCalendarEvent(event: Omit<CalendarEvent, 'id' | 'completed' | 'createdAt' | 'updatedAt'>): CalendarEvent;
  close(): void;
}

export interface UserDatabase extends DatabaseWrapper {
  getPasswordHash(password: string): string;
  verifyPassword(password: string, hash: string): boolean;
  createUser(input: Omit<User, 'id' | 'passwordHash' | 'resetToken' | 'resetTokenExpiry' | 'createdAt' | 'updatedAt' | 'avatarUrl'>): User;
  getUserByUsername(username: string): User | null;
  getUserByEmail(email: string): User | null;
  authenticateUser(username: string, password: string): User | null;
  verifyResetToken(token: string): User | null;
  generateResetToken(): string;
  sendPasswordResetEmail(user: User, emailService: EmailService): void;
  generateResetUrl(user: User, token: string, expiry: Date): string;
  mapRowToUser(row: any): User | null;
}

export interface EmailService {
  sendPasswordReset(email: string, name: string, token: string): Promise<void>;
}

export type getDatabase = ReturnType<typeof createSqliteDatabase>;