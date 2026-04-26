import { randomBytes } from 'crypto';
import { createHash } from 'crypto';
import { verify } from 'jsonwebtoken';
import Database from 'better-sqlite3';
import path from 'path';
import type { DatabaseWrapper } from './index';
import type { Plant } from '../models/plant';
import type { CalendarEvent } from '../models/calendar';
import type { User } from '../models/user';
import { utcToZonedTime, format } from 'date-fns-tz';

let db: Database.Database | null = null;

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

export const createSqliteDatabase = (dbFile?: string): DatabaseWrapper & { getAllCalendarEvents(): CalendarEvent[]; getCalendarEventById(id: string): CalendarEvent | null; createCalendarEvent(event: Omit<CalendarEvent, 'id' | 'completed' | 'createdAt' | 'updatedAt'>): CalendarEvent; getPasswordHash(password: string): string; verifyPassword(password: string, hash: string): boolean; createUser(input: Omit<User, 'id' | 'passwordHash' | 'resetToken' | 'resetTokenExpiry' | 'createdAt' | 'updatedAt' | 'avatarUrl'>): User; getUserByUsername(username: string): User | null; getUserByEmail(email: string): User | null; authenticateUser(username: string, password: string): User | null; verifyResetToken(token: string): User | null; generateResetToken(): string; sendPasswordResetEmail(user: User, emailService: EmailService): void; } => {
  const database = initSqlite(dbFile);
  createPlantTable(database);
  createCalendarTable(database);
  createUsersTable(database);
  return {
    getAllPlants(): Plant[] {
      const stmt = database.prepare('SELECT * FROM plants ORDER BY createdAt DESC');
      return (stmt.all() as Plant[]) ?? [];
    },
    getPlantById(id: string): Plant | null {
      const stmt = database.prepare('SELECT * FROM plants WHERE id = ?');
      return (stmt.get(id) as Plant) ?? null;
    },
    createPlant(plant: Omit<Plant, 'id' | 'createdAt' | 'updatedAt'>): Plant {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const newPlant: Plant = {
        ...plant,
        id,
        createdAt: now,
        updatedAt: now,
      };
      const stmt = database.prepare(`
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
      `);
      stmt.run(newPlant);
      return newPlant;
    },
    updatePlant(id: string, plant: Partial<Plant>): Plant | null {
      const existing = this.getPlantById(id);
      if (!existing) return null;
      const now = new Date().toISOString();
      const updated: Plant = {
        ...existing,
        ...plant,
        id: existing.id,
        createdAt: existing.createdAt,
        updatedAt: now,
      };
      const stmt = database.prepare(`
        UPDATE plants SET
          name = @name, species = @species, location = @location,
          plantedDate = @plantedDate, lastWatered = @lastWatered,
          wateringFrequency = @wateringFrequency, lastFertilized = @lastFertilized,
          fertilizingFrequency = @fertilizingFrequency, notes = @notes,
          sunlightRequirement = @sunlightRequirement, soilType = @soilType,
          harvestDate = @harvestDate, updatedAt = @updatedAt
        WHERE id = @id
      `);
      stmt.run(updated);
      return updated;
    },
    deletePlant(id: string): boolean {
      const stmt = database.prepare('DELETE FROM plants WHERE id = ?');
      const result = stmt.run(id);
      return result.changes > 0;
    },
    close(): void {
      if (db) {
        db.close();
        db = null;
      }
    },
    getAllCalendarEvents(): CalendarEvent[] {
      const stmt = database.prepare(
        'SELECT * FROM calendar_events ORDER BY date ASC, type ASC'
      );

      const rows = stmt.all() as any[];

      return rows.map((row) => ({
        ...row,
        completed: Boolean(row.completed),
        type: row.type || 'other',
      }));
    },
    getCalendarEventById(id: string): CalendarEvent | null {
      const stmt = database.prepare('SELECT * FROM calendar_events WHERE id = ?');

      const row = stmt.get(id) as any;

      if (!row) {
        return null;
      }

      return {
        ...row,
        completed: Boolean(row.completed),
        type: row.type || 'other',
      };
    },
    createCalendarEvent(event: Omit<CalendarEvent, 'id' | 'completed' | 'createdAt' | 'updatedAt'>): CalendarEvent {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const db = event['getDatabase']();
      const stmt = db.prepare(
        `INSERT INTO calendar_events
         (plant_id, type, date, notes, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      );

      const result = stmt.run(
        event.plantId,
        event.type,
        event.date,
        event.notes,
        now,
        now
      );

      const { getCalendarEventById } = this;

      return getCalendarEventById(result.lastInsertRowid as string) || { ...event, id, completed: false, createdAt: now, updatedAt: now };
    },
    getPasswordHash(password: string): string {
      return createHash('sha256').update(password).digest('hex');
    },
    verifyPassword(password: string, hash: string): boolean {
      const computedHash = this.getPasswordHash(password);
      try {
        return computedHash === hash;
      } catch (error) {
        return false;
      }
    },
    createUser(input: Omit<User, 'id' | 'passwordHash' | 'resetToken' | 'resetTokenExpiry' | 'createdAt' | 'updatedAt' | 'avatarUrl'>): User {
      const id = crypto.randomUUID();
      const passwordHash = this.getPasswordHash(input.password);
      const now = new Date().toISOString();
      const avatarUrl = this.generateGravatarUrl(input.email);

      const stmt = database.prepare(`
        INSERT INTO users (
          id, name, username, email, password_hash, reset_token,
          reset_token_expiry, created_at, updated_at, avatar_url
        ) VALUES (
          @id, @name, @username, @email, @passwordHash, @resetToken,
          @resetTokenExpiry, @createdAt, @updatedAt, @avatarUrl
        )
      `);
      stmt.run({
        id,
        name: input.name || '',
        username: input.username,
        email: input.email,
        passwordHash,
        resetToken: null,
        resetTokenExpiry: null,
        createdAt: now,
        updatedAt: now,
        avatarUrl,
      });
      return {
        id,
        name: input.name || '',
        username: input.username,
        email: input.email,
        passwordHash,
        resetToken: null,
        resetTokenExpiry: null,
        createdAt: now,
        updatedAt: now,
        avatarUrl,
      };
    },
    getUserByUsername(username: string): User | null {
      const stmt = database.prepare('SELECT * FROM users WHERE username = ?');
      const row = stmt.get(username) as any;
      return this.mapRowToUser(row);
    },
    getUserByEmail(email: string): User | null {
      const stmt = database.prepare('SELECT * FROM users WHERE email = ?');
      const row = stmt.get(email) as any;
      return this.mapRowToUser(row);
    },
    authenticateUser(username: string, password: string): User | null {
      const user = this.getUserByUsername(username) || this.getUserByEmail(username);
      if (!user || !this.verifyPassword(password, user.passwordHash)) {
        return null;
      }
      return user;
    },
    verifyResetToken(token: string): User | null {
      const stmt = database.prepare(
        'SELECT * FROM users WHERE reset_token = ? AND reset_token_expiry > ?'
      );
      const row = stmt.get(token, new Date().toISOString()) as any;
      return this.mapRowToUser(row);
    },
    generateResetToken(): string {
      return randomBytes(32).toString('hex') + '_' + Date.now().toString();
    },
    sendPasswordResetEmail(user: User, emailService: EmailService): void {
      const token = this.generateResetToken();
      const expiry = new Date(Date.now() + 3600000).toISOString();

      const stmt = database.prepare(`
        UPDATE users
        SET reset_token = ?, reset_token_expiry = ?
        WHERE id = ?
      `);
      stmt.run(token, expiry, user.id);

      this.generateResetUrl(user, token, expiry);
      emailService.sendPasswordReset(user.email, user.name, token);
    },
    generateResetUrl(user: User, token: string, expiry: Date): string {
      return `http://localhost:3000/reset-password/${token}`;
    },
    mapRowToUser(row: any): User | null {
      if (!row) return null;
      return {
        id: row.id,
        name: row.name,
        username: row.username,
        email: row.email,
        passwordHash: row.password_hash,
        resetToken: row.reset_token,
        resetTokenExpiry: row.reset_token_expiry,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        avatarUrl: row.avatar_url,
      };
    },
  };
};

export const getDatabase = (): DatabaseWrapper => createSqliteDatabase();
