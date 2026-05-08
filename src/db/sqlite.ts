import { randomBytes, randomUUID } from 'crypto';
import Database from 'better-sqlite3';
import path from 'path';
import type { Database as AppDatabase, PlantCareDates } from './index';
import type { Plant } from '../models/plant';
import type { CalendarEvent } from '../models/calendar';
import type { User } from '../models/user';
import type { ChatSession, ChatMessage, ChatMemory } from '../models/chat';

let db: Database.Database | null = null;

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

// Row types mirror the on-disk SQLite schema. Casting `stmt.get(...) as
// SomeRow | undefined` happens once at each query site; the mappers below
// then operate on fully-typed values. If a column is added to a table,
// updating its row type forces the mapper to handle it.

type PlantRow = {
  id: string;
  name: string;
  species: string;
  location: string | null;
  plantedDate: string | null;
  lastWatered: string | null;
  wateringFrequency: number | null;
  lastFertilized: string | null;
  fertilizingFrequency: number | null;
  notes: string | null;
  sunlightRequirement: Plant['sunlightRequirement'] | null;
  soilType: string | null;
  harvestDate: string | null;
  createdAt: string;
  updatedAt: string;
};

type CalendarRow = {
  id: string;
  plant_id: string;
  type: CalendarEvent['type'] | null;
  date: string;
  notes: string | null;
  completed: number;
  created_at: string;
  updated_at: string;
};

type UserRow = {
  id: string;
  name: string;
  username: string;
  email: string;
  password_hash: string;
  reset_token: string | null;
  reset_token_expiry: string | null;
  created_at: string;
  updated_at: string;
  avatar_url: string | null;
};

type ChatSessionRow = {
  id: string;
  summary: string | null;
  created_at: string;
  updated_at: string;
};

type ChatMessageRow = {
  id: string;
  session_id: string;
  role: ChatMessage['role'];
  content: string;
  model: string | null;
  created_at: string;
};

type ChatMemoryRow = {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
};

const getDbPath = (): string => {
  const envPath = process.env.DATABASE_URL;
  if (envPath && !envPath.startsWith('postgres://')) {
    return envPath;
  }
  return path.resolve(process.cwd(), 'data/garden.db');
};

export const initSqlite = (dbFile?: string): Database.Database => {
  if (db) return db;
  const filePath = dbFile || getDbPath();
  db = new Database(filePath);
  db.pragma('journal_mode = WAL');
  return db;
};

const mapCalendarRow = (row: CalendarRow): CalendarEvent => ({
  id: row.id,
  plantId: row.plant_id,
  type: row.type ?? 'other',
  date: row.date,
  notes: row.notes ?? undefined,
  completed: Boolean(row.completed),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapPlantRow = (row: PlantRow): Plant => ({
  id: row.id,
  name: row.name,
  species: row.species,
  location: row.location ?? undefined,
  plantedDate: row.plantedDate ?? undefined,
  lastWatered: row.lastWatered ?? undefined,
  wateringFrequency: row.wateringFrequency ?? undefined,
  lastFertilized: row.lastFertilized ?? undefined,
  fertilizingFrequency: row.fertilizingFrequency ?? undefined,
  notes: row.notes ?? undefined,
  sunlightRequirement: row.sunlightRequirement ?? undefined,
  soilType: row.soilType ?? undefined,
  harvestDate: row.harvestDate ?? undefined,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

const mapUserRow = (row: UserRow | undefined): User | null => {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    username: row.username,
    email: row.email,
    passwordHash: row.password_hash,
    resetToken: row.reset_token ?? undefined,
    resetTokenExpiry: row.reset_token_expiry ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    avatarUrl: row.avatar_url ?? undefined,
  };
};

const mapChatSessionRow = (row: ChatSessionRow): ChatSession => ({
  id: row.id,
  summary: row.summary,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapChatMessageRow = (row: ChatMessageRow): ChatMessage => ({
  id: row.id,
  sessionId: row.session_id,
  role: row.role,
  content: row.content,
  model: row.model,
  createdAt: row.created_at,
});

const mapChatMemoryRow = (row: ChatMemoryRow): ChatMemory => ({
  id: row.id,
  content: row.content,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const createPlantTable = (database: Database.Database): void => {
  database.exec(`
    CREATE TABLE IF NOT EXISTS plants (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      species TEXT NOT NULL,
      location TEXT,
      plantedDate TEXT,
      lastWatered TEXT,
      wateringFrequency INTEGER,
      lastFertilized TEXT,
      fertilizingFrequency INTEGER,
      notes TEXT,
      sunlightRequirement TEXT,
      soilType TEXT,
      harvestDate TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `);
};

export const createCalendarTable = (database: Database.Database): void => {
  database.exec(`
    CREATE TABLE IF NOT EXISTS calendar_events (
      id TEXT PRIMARY KEY,
      plant_id TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'other',
      date TEXT NOT NULL,
      notes TEXT,
      completed INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (plant_id) REFERENCES plants(id) ON DELETE CASCADE
    )
  `);
};

export const createUsersTable = (database: Database.Database): void => {
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      reset_token TEXT,
      reset_token_expiry TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      avatar_url TEXT
    )
  `);
};

export const createChatTables = (database: Database.Database): void => {
  database.exec(`
    CREATE TABLE IF NOT EXISTS chat_sessions (
      id TEXT PRIMARY KEY,
      summary TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'system')),
      content TEXT NOT NULL,
      model TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS chat_memories (
      id TEXT PRIMARY KEY,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
};

export const createSqliteDatabase = (dbFile?: string): AppDatabase => {
  const database = initSqlite(dbFile);
  createPlantTable(database);
  createCalendarTable(database);
  createUsersTable(database);
  createChatTables(database);

  const wrapper: AppDatabase = {
    getAllPlants(): Plant[] {
      const rows = database
        .prepare('SELECT * FROM plants ORDER BY createdAt DESC')
        .all() as PlantRow[];
      return rows.map(mapPlantRow);
    },
    getPlantById(id: string): Plant | null {
      const row = database.prepare('SELECT * FROM plants WHERE id = ?').get(id) as
        | PlantRow
        | undefined;
      return row ? mapPlantRow(row) : null;
    },
    getPlantByName(name: string): Plant | null {
      const row = database
        .prepare('SELECT * FROM plants WHERE LOWER(name) = LOWER(?) LIMIT 1')
        .get(name) as PlantRow | undefined;
      return row ? mapPlantRow(row) : null;
    },
    createPlant(plant: Omit<Plant, 'id' | 'createdAt' | 'updatedAt'>): Plant {
      const id = randomUUID();
      const now = new Date().toISOString();
      const newPlant: Plant = { ...plant, id, createdAt: now, updatedAt: now };
      database
        .prepare(
          `
        INSERT INTO plants (
          id, name, species, location, plantedDate, lastWatered,
          wateringFrequency, lastFertilized, fertilizingFrequency,
          notes, sunlightRequirement, soilType, harvestDate,
          createdAt, updatedAt
        ) VALUES (
          @id, @name, @species, @location, @plantedDate, @lastWatered,
          @wateringFrequency, @lastFertilized, @fertilizingFrequency,
          @notes, @sunlightRequirement, @soilType, @harvestDate,
          @createdAt, @updatedAt
        )
      `,
        )
        .run({
          id: newPlant.id,
          name: newPlant.name,
          species: newPlant.species,
          location: newPlant.location ?? null,
          plantedDate: newPlant.plantedDate ?? null,
          lastWatered: newPlant.lastWatered ?? null,
          wateringFrequency: newPlant.wateringFrequency ?? null,
          lastFertilized: newPlant.lastFertilized ?? null,
          fertilizingFrequency: newPlant.fertilizingFrequency ?? null,
          notes: newPlant.notes ?? null,
          sunlightRequirement: newPlant.sunlightRequirement ?? null,
          soilType: newPlant.soilType ?? null,
          harvestDate: newPlant.harvestDate ?? null,
          createdAt: newPlant.createdAt,
          updatedAt: newPlant.updatedAt,
        });
      return newPlant;
    },
    updatePlantCareDates(id: string, dates: PlantCareDates): Plant | null {
      return wrapper.updatePlant(id, dates);
    },
    updatePlant(id: string, plant: Partial<Plant>): Plant | null {
      const existing = wrapper.getPlantById(id);
      if (!existing) return null;
      const now = new Date().toISOString();
      const updated: Plant = {
        ...existing,
        ...plant,
        id: existing.id,
        createdAt: existing.createdAt,
        updatedAt: now,
      };
      database
        .prepare(
          `
        UPDATE plants SET
          name = @name, species = @species, location = @location,
          plantedDate = @plantedDate, lastWatered = @lastWatered,
          wateringFrequency = @wateringFrequency, lastFertilized = @lastFertilized,
          fertilizingFrequency = @fertilizingFrequency, notes = @notes,
          sunlightRequirement = @sunlightRequirement, soilType = @soilType,
          harvestDate = @harvestDate, updatedAt = @updatedAt
        WHERE id = @id
      `,
        )
        .run({
          id: updated.id,
          name: updated.name,
          species: updated.species,
          location: updated.location ?? null,
          plantedDate: updated.plantedDate ?? null,
          lastWatered: updated.lastWatered ?? null,
          wateringFrequency: updated.wateringFrequency ?? null,
          lastFertilized: updated.lastFertilized ?? null,
          fertilizingFrequency: updated.fertilizingFrequency ?? null,
          notes: updated.notes ?? null,
          sunlightRequirement: updated.sunlightRequirement ?? null,
          soilType: updated.soilType ?? null,
          harvestDate: updated.harvestDate ?? null,
          updatedAt: updated.updatedAt,
        });
      return updated;
    },
    deletePlant(id: string): boolean {
      const result = database.prepare('DELETE FROM plants WHERE id = ?').run(id);
      return result.changes > 0;
    },
    close(): void {
      if (db) {
        db.close();
        db = null;
      }
    },
    getAllCalendarEvents(): CalendarEvent[] {
      const rows = database
        .prepare('SELECT * FROM calendar_events ORDER BY date ASC, type ASC')
        .all() as CalendarRow[];
      return rows.map(mapCalendarRow);
    },
    getCalendarEventById(id: string): CalendarEvent | null {
      const row = database.prepare('SELECT * FROM calendar_events WHERE id = ?').get(id) as
        | CalendarRow
        | undefined;
      return row ? mapCalendarRow(row) : null;
    },
    getCalendarEventsBetween(startInclusive: string, endExclusive: string): CalendarEvent[] {
      const rows = database
        .prepare(
          'SELECT * FROM calendar_events WHERE date >= ? AND date < ? ORDER BY date ASC, type ASC',
        )
        .all(startInclusive, endExclusive) as CalendarRow[];
      return rows.map(mapCalendarRow);
    },
    createCalendarEvent(
      event: Omit<CalendarEvent, 'id' | 'completed' | 'createdAt' | 'updatedAt'>,
    ): CalendarEvent {
      const id = randomUUID();
      const now = new Date().toISOString();
      database
        .prepare(
          `INSERT INTO calendar_events
           (id, plant_id, type, date, notes, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(id, event.plantId, event.type, event.date, event.notes ?? null, now, now);

      return (
        wrapper.getCalendarEventById(id) ?? {
          ...event,
          id,
          completed: false,
          createdAt: now,
          updatedAt: now,
        }
      );
    },
    updateCalendarEvent(
      id: string,
      event: Partial<Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>>,
    ): CalendarEvent | null {
      const existing = wrapper.getCalendarEventById(id);
      if (!existing) return null;
      const now = new Date().toISOString();
      const updated = { ...existing, ...event };
      database
        .prepare(
          `UPDATE calendar_events
           SET plant_id = ?, type = ?, date = ?, notes = ?, completed = ?, updated_at = ?
           WHERE id = ?`,
        )
        .run(
          updated.plantId,
          updated.type,
          updated.date,
          updated.notes ?? null,
          updated.completed ? 1 : 0,
          now,
          id,
        );
      return { ...updated, updatedAt: now };
    },
    deleteCalendarEvent(id: string): boolean {
      const result = database.prepare('DELETE FROM calendar_events WHERE id = ?').run(id);
      return result.changes > 0;
    },
    createUser(
      input: Omit<User, 'id' | 'resetToken' | 'resetTokenExpiry' | 'createdAt' | 'updatedAt'>,
    ): User {
      const id = randomUUID();
      const now = new Date().toISOString();
      database
        .prepare(
          `
        INSERT INTO users (
          id, name, username, email, password_hash, reset_token,
          reset_token_expiry, created_at, updated_at, avatar_url
        ) VALUES (
          @id, @name, @username, @email, @passwordHash, @resetToken,
          @resetTokenExpiry, @createdAt, @updatedAt, @avatarUrl
        )
      `,
        )
        .run({
          id,
          name: input.name || '',
          username: input.username,
          email: input.email,
          passwordHash: input.passwordHash,
          resetToken: null,
          resetTokenExpiry: null,
          createdAt: now,
          updatedAt: now,
          avatarUrl: input.avatarUrl ?? null,
        });
      return {
        id,
        name: input.name || '',
        username: input.username,
        email: input.email,
        passwordHash: input.passwordHash,
        resetToken: undefined,
        resetTokenExpiry: undefined,
        createdAt: now,
        updatedAt: now,
        avatarUrl: input.avatarUrl,
      };
    },
    getUserById(id: string): User | null {
      const row = database.prepare('SELECT * FROM users WHERE id = ?').get(id) as
        | UserRow
        | undefined;
      return mapUserRow(row);
    },
    getUserByUsername(username: string): User | null {
      const row = database.prepare('SELECT * FROM users WHERE username = ?').get(username) as
        | UserRow
        | undefined;
      return mapUserRow(row);
    },
    getUserByEmail(email: string): User | null {
      const row = database.prepare('SELECT * FROM users WHERE email = ?').get(email) as
        | UserRow
        | undefined;
      return mapUserRow(row);
    },
    verifyResetToken(token: string): User | null {
      const row = database
        .prepare('SELECT * FROM users WHERE reset_token = ? AND reset_token_expiry > ?')
        .get(token, new Date().toISOString()) as UserRow | undefined;
      return mapUserRow(row);
    },
    issueResetToken(userId: string): string {
      const token = `${randomBytes(32).toString('hex')}_${Date.now().toString()}`;
      const expiry = new Date(Date.now() + RESET_TOKEN_TTL_MS).toISOString();
      database
        .prepare('UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE id = ?')
        .run(token, expiry, userId);
      return token;
    },
    updateUser(
      id: string,
      updates: Partial<Pick<User, 'passwordHash' | 'resetToken' | 'resetTokenExpiry'>>,
    ): User | null {
      const row = database.prepare('SELECT * FROM users WHERE id = ?').get(id) as
        | UserRow
        | undefined;
      if (!row) return null;
      const now = new Date().toISOString();
      const passwordHash = updates.passwordHash ?? row.password_hash;
      const resetToken = 'resetToken' in updates ? (updates.resetToken ?? null) : row.reset_token;
      const resetTokenExpiry =
        'resetTokenExpiry' in updates ? (updates.resetTokenExpiry ?? null) : row.reset_token_expiry;
      database
        .prepare(
          'UPDATE users SET password_hash = ?, reset_token = ?, reset_token_expiry = ?, updated_at = ? WHERE id = ?',
        )
        .run(passwordHash, resetToken, resetTokenExpiry, now, id);
      const updated = database.prepare('SELECT * FROM users WHERE id = ?').get(id) as
        | UserRow
        | undefined;
      return mapUserRow(updated);
    },

    // --- Chat ---

    createChatSession(): ChatSession {
      const id = randomUUID();
      const now = new Date().toISOString();
      database
        .prepare(
          'INSERT INTO chat_sessions (id, summary, created_at, updated_at) VALUES (?, NULL, ?, ?)',
        )
        .run(id, now, now);
      return { id, summary: null, createdAt: now, updatedAt: now };
    },

    getChatSession(id: string): ChatSession | null {
      const row = database.prepare('SELECT * FROM chat_sessions WHERE id = ?').get(id) as
        | ChatSessionRow
        | undefined;
      return row ? mapChatSessionRow(row) : null;
    },

    updateChatSession(
      id: string,
      updates: Partial<Pick<ChatSession, 'summary'>>,
    ): ChatSession | null {
      const now = new Date().toISOString();
      database
        .prepare('UPDATE chat_sessions SET summary = ?, updated_at = ? WHERE id = ?')
        .run(updates.summary ?? null, now, id);
      return wrapper.getChatSession(id);
    },

    deleteChatSession(id: string): boolean {
      const result = database.prepare('DELETE FROM chat_sessions WHERE id = ?').run(id);
      return result.changes > 0;
    },

    listChatSessions(): ChatSession[] {
      const rows = database
        .prepare('SELECT * FROM chat_sessions ORDER BY created_at DESC')
        .all() as ChatSessionRow[];
      return rows.map(mapChatSessionRow);
    },

    createChatMessage(
      sessionId: string,
      role: ChatMessage['role'],
      content: string,
      model?: string,
    ): ChatMessage {
      const id = randomUUID();
      const now = new Date().toISOString();
      database
        .prepare(
          'INSERT INTO chat_messages (id, session_id, role, content, model, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        )
        .run(id, sessionId, role, content, model ?? null, now);
      return { id, sessionId, role, content, model: model ?? null, createdAt: now };
    },

    getChatMessages(sessionId: string): ChatMessage[] {
      const rows = database
        .prepare('SELECT * FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC')
        .all(sessionId) as ChatMessageRow[];
      return rows.map(mapChatMessageRow);
    },

    createChatMemory(content: string): ChatMemory {
      const id = randomUUID();
      const now = new Date().toISOString();
      database
        .prepare(
          'INSERT INTO chat_memories (id, content, created_at, updated_at) VALUES (?, ?, ?, ?)',
        )
        .run(id, content, now, now);
      return { id, content, createdAt: now, updatedAt: now };
    },

    listChatMemories(): ChatMemory[] {
      const rows = database
        .prepare('SELECT * FROM chat_memories ORDER BY created_at DESC')
        .all() as ChatMemoryRow[];
      return rows.map(mapChatMemoryRow);
    },
  };

  return wrapper;
};

export const getDatabase = (): AppDatabase => createSqliteDatabase();
