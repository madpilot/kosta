"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDatabase = exports.createSqliteDatabase = exports.createPlantTable = exports.initSqlite = void 0;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const path_1 = __importDefault(require("path"));
let db = null;
const getDbPath = () => {
    const envPath = process.env.DATABASE_URL;
    if (envPath && !envPath.startsWith('postgres://')) {
        return envPath;
    }
    return path_1.default.resolve(process.cwd(), 'data/garden.db');
};
const initSqlite = (dbFile) => {
    if (db)
        return db;
    const filePath = dbFile || getDbPath();
    db = new better_sqlite3_1.default(filePath);
    db.pragma('journal_mode = WAL');
    return db;
};
exports.initSqlite = initSqlite;
const createPlantTable = (database) => {
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
exports.createPlantTable = createPlantTable;
const createSqliteDatabase = (dbFile) => {
    const database = (0, exports.initSqlite)(dbFile);
    (0, exports.createPlantTable)(database);
    return {
        getAllPlants() {
            const stmt = database.prepare('SELECT * FROM plants ORDER BY createdAt DESC');
            return stmt.all() ?? [];
        },
        getPlantById(id) {
            const stmt = database.prepare('SELECT * FROM plants WHERE id = ?');
            return stmt.get(id) ?? null;
        },
        createPlant(plant) {
            const id = crypto.randomUUID();
            const now = new Date().toISOString();
            const newPlant = {
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
        updatePlant(id, plant) {
            const existing = this.getPlantById(id);
            if (!existing)
                return null;
            const now = new Date().toISOString();
            const updated = {
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
        deletePlant(id) {
            const stmt = database.prepare('DELETE FROM plants WHERE id = ?');
            const result = stmt.run(id);
            return result.changes > 0;
        },
        close() {
            if (db) {
                db.close();
                db = null;
            }
        },
    };
};
exports.createSqliteDatabase = createSqliteDatabase;
const getDatabase = () => (0, exports.createSqliteDatabase)();
exports.getDatabase = getDatabase;
//# sourceMappingURL=sqlite.js.map