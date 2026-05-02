import Database from 'better-sqlite3';
import type { createSqliteDatabase } from './sqlite';
import type { Plant } from '../models/plant';
import type { CalendarEvent } from '../models/calendar';
import type { User } from '../models/user';
import type { ChatSession, ChatMessage, ChatMemory } from '../models/chat';

export type PlantCareDates = Partial<Pick<Plant, 'lastWatered' | 'lastFertilized' | 'plantedDate' | 'harvestDate'>>;

export interface DatabaseWrapper {
  getAllPlants(): Plant[];
  getPlantById(id: string): Plant | null;
  getPlantByName(name: string): Plant | null;
  createPlant(plant: Omit<Plant, 'id' | 'createdAt' | 'updatedAt'>): Plant;
  updatePlant(id: string, plant: Partial<Plant>): Plant | null;
  updatePlantCareDates(id: string, dates: PlantCareDates): Plant | null;
  deletePlant(id: string): boolean;
  getAllCalendarEvents(): CalendarEvent[];
  getCalendarEventById(id: string): CalendarEvent | null;
  createCalendarEvent(event: Omit<CalendarEvent, 'id' | 'completed' | 'createdAt' | 'updatedAt'>): CalendarEvent;
  close(): void;
}

export interface UserDatabase extends DatabaseWrapper {
  getPasswordHash(password: string): string;
  createUser(input: Omit<User, 'id' | 'passwordHash' | 'resetToken' | 'resetTokenExpiry' | 'createdAt' | 'updatedAt' | 'avatarUrl'>): User;
  getUserByUsername(username: string): User | null;
  getUserByEmail(email: string): User | null;
  verifyResetToken(token: string): User | null;
  generateResetToken(): string;
  sendPasswordResetEmail(user: User, emailService: EmailService): void;
  generateResetUrl(user: User, token: string, expiry: Date): string;
  mapRowToUser(row: any): User | null;
}

export interface EmailService {
  sendPasswordReset(email: string, name: string, token: string): Promise<void>;
}

export interface ChatDatabase {
  createChatSession(): ChatSession;
  getChatSession(id: string): ChatSession | null;
  updateChatSession(id: string, updates: Partial<Pick<ChatSession, 'summary'>>): ChatSession | null;
  deleteChatSession(id: string): boolean;
  listChatSessions(): ChatSession[];
  createChatMessage(sessionId: string, role: ChatMessage['role'], content: string, model?: string): ChatMessage;
  getChatMessages(sessionId: string): ChatMessage[];
  createChatMemory(content: string): ChatMemory;
  listChatMemories(): ChatMemory[];
}

export type getDatabase = ReturnType<typeof createSqliteDatabase>;
