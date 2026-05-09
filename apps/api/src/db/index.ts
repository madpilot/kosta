import type { Plant } from '@sprout/shared/schemas/plant';
import type { CalendarEvent } from '@sprout/shared/schemas/calendar';
import type { User } from '@sprout/shared/schemas/user';
import type { ChatSession, ChatMessage, ChatMemory } from '@sprout/shared/schemas/chat';
import type { Settings } from '@sprout/shared/schemas/settings';
import type { createSqliteDatabase } from './sqlite';

export type PlantCareDates = Partial<
  Pick<Plant, 'lastWatered' | 'lastFertilized' | 'plantedDate' | 'harvestDate'>
>;

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
  getCalendarEventsBetween(startInclusive: string, endExclusive: string): CalendarEvent[];
  createCalendarEvent(
    event: Omit<CalendarEvent, 'id' | 'completed' | 'createdAt' | 'updatedAt'>,
  ): CalendarEvent;
  updateCalendarEvent(
    id: string,
    event: Partial<Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>>,
  ): CalendarEvent | null;
  deleteCalendarEvent(id: string): boolean;
  close(): void;
}

export interface UserDatabase extends DatabaseWrapper {
  createUser(
    input: Omit<User, 'id' | 'resetToken' | 'resetTokenExpiry' | 'createdAt' | 'updatedAt'>,
  ): User;
  getUserById(id: string): User | null;
  getUserByUsername(username: string): User | null;
  getUserByEmail(email: string): User | null;
  countUsers(): number;
  verifyResetToken(token: string): User | null;
  issueResetToken(userId: string): string;
  updateUser(
    id: string,
    updates: Partial<Pick<User, 'passwordHash' | 'resetToken' | 'resetTokenExpiry'>>,
  ): User | null;
}

export interface SettingsDatabase {
  getSettings(): Settings | null;
  saveSettings(settings: Settings): Settings;
}

export interface ChatDatabase {
  createChatSession(): ChatSession;
  getChatSession(id: string): ChatSession | null;
  updateChatSession(id: string, updates: Partial<Pick<ChatSession, 'summary'>>): ChatSession | null;
  deleteChatSession(id: string): boolean;
  listChatSessions(): ChatSession[];
  createChatMessage(
    sessionId: string,
    role: ChatMessage['role'],
    content: string,
    model?: string,
  ): ChatMessage;
  getChatMessages(sessionId: string): ChatMessage[];
  createChatMemory(content: string): ChatMemory;
  listChatMemories(): ChatMemory[];
}

export type Database = DatabaseWrapper & UserDatabase & ChatDatabase & SettingsDatabase;

export type getDatabase = ReturnType<typeof createSqliteDatabase>;
