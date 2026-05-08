import type { createSqliteDatabase } from './sqlite';
import type { Plant } from '../models/plant';
import type { CalendarEvent } from '../models/calendar';
import type { User } from '../models/user';
import type { ChatSession, ChatMessage, ChatMemory } from '../models/chat';

export type PlantCareDates = Partial<
  Pick<Plant, 'lastWatered' | 'lastFertilized' | 'plantedDate' | 'harvestDate'>
>;

export type CalendarEventType = CalendarEvent['type'];

export interface DatabaseWrapper {
  getAllPlants(userId: string): Plant[];
  getPlantById(userId: string, id: string): Plant | null;
  getPlantByName(userId: string, name: string): Plant | null;
  createPlant(userId: string, plant: Omit<Plant, 'id' | 'createdAt' | 'updatedAt'>): Plant;
  updatePlant(userId: string, id: string, plant: Partial<Plant>): Plant | null;
  updatePlantCareDates(userId: string, id: string, dates: PlantCareDates): Plant | null;
  deletePlant(userId: string, id: string): boolean;
  getAllCalendarEvents(userId: string): CalendarEvent[];
  getCalendarEventById(userId: string, id: string): CalendarEvent | null;
  getCalendarEventsInRange(userId: string, startUtc: string, endUtc: string): CalendarEvent[];
  getCalendarEventsByDatePrefix(userId: string, datePrefix: string): CalendarEvent[];
  getCalendarEventsByPlant(userId: string, plantId: string): CalendarEvent[];
  getCalendarEventsByType(userId: string, type: CalendarEventType): CalendarEvent[];
  getUpcomingCalendarEvents(userId: string, nowIso: string, limit: number): CalendarEvent[];
  createCalendarEvent(
    userId: string,
    event: Omit<CalendarEvent, 'id' | 'completed' | 'createdAt' | 'updatedAt'>,
  ): CalendarEvent;
  updateCalendarEvent(
    userId: string,
    id: string,
    event: Partial<Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>>,
  ): CalendarEvent | null;
  deleteCalendarEvent(userId: string, id: string): boolean;
  close(): void;
}

export interface UserDatabase {
  createUser(
    input: Omit<User, 'id' | 'resetToken' | 'resetTokenExpiry' | 'createdAt' | 'updatedAt'>,
  ): User;
  getUserById(id: string): User | null;
  getUserByUsername(username: string): User | null;
  getUserByEmail(email: string): User | null;
  verifyResetToken(token: string): User | null;
  issueResetToken(userId: string): string;
  updateUser(
    id: string,
    updates: Partial<Pick<User, 'passwordHash' | 'resetToken' | 'resetTokenExpiry' | 'timezone'>>,
  ): User | null;
}

export interface ChatDatabase {
  createChatSession(userId: string): ChatSession;
  getChatSession(userId: string, id: string): ChatSession | null;
  updateChatSession(
    userId: string,
    id: string,
    updates: Partial<Pick<ChatSession, 'summary'>>,
  ): ChatSession | null;
  deleteChatSession(userId: string, id: string): boolean;
  listChatSessions(userId: string): ChatSession[];
  createChatMessage(
    userId: string,
    sessionId: string,
    role: ChatMessage['role'],
    content: string,
    model?: string,
  ): ChatMessage;
  getChatMessages(userId: string, sessionId: string): ChatMessage[];
  createChatMemory(userId: string, content: string): ChatMemory;
  listChatMemories(userId: string): ChatMemory[];
}

export type Database = DatabaseWrapper & UserDatabase & ChatDatabase;

export type getDatabase = ReturnType<typeof createSqliteDatabase>;
