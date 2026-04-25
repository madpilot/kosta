import Database from 'better-sqlite3';
import path from 'path';
import type { DatabaseWrapper } from './index';
import type { Plant } from '../models/plant';
import type { CalendarEvent } from '../models/calendar';

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

export const createSqliteDatabase = (dbFile?: string): DatabaseWrapper & { getAllCalendarEvents(): CalendarEvent[]; getCalendarEventById(id: string): CalendarEvent | null; createCalendarEvent(event: Omit<CalendarEvent, 'id' | 'completed' | 'createdAt' | 'updatedAt'>): CalendarEvent; } => {
  const database = initSqlite(dbFile);
  createPlantTable(database);
  createCalendarTable(database);
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
  };
};

export const getDatabase = (): DatabaseWrapper => createSqliteDatabase();
