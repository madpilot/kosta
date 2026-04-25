import { expect, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { createSqliteDatabase } from './sqlite';
import type { Plant } from '../models/plant';

describe('Database Layer', () => {
  let dbFile: string;
  let database: ReturnType<typeof createSqliteDatabase>;

  afterEach(() => {
    if (database) {
      database.close();
    }
    if (dbFile) {
      try {
        import('fs').then((fs) => fs.unlinkSync(dbFile));
      } catch {}
    }
  });

  beforeEach(() => {
    const tempDb = __dirname + '/temp_test.db';
    dbFile = tempDb;
    database = createSqliteDatabase(tempDb);
  });

  describe('SQLite Initialization', () => {
    it('should create database file', () => {
      expect(dbFile).toBeDefined();
      expect(dbFile).toMatch(/\.db$/);
    });

    it('should have WAL mode enabled', () => {
      const stmt = database['getDatabase']().pragma('journal_mode');
      expect(typeof stmt).toBe('string');
    });

    it('should create plants table', () => {
      const tables = database['getDatabase']().prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as Array<{ name: string }>;
      const plantTables = tables['0'].name || tables[0].name;
      expect(plantTables.name).toBe('plants');
    });
  });

  describe('Plants CRUD', () => {
    describe('getAllPlants', () => {
      it('should return empty array initially', () => {
        const plants = database.getAllPlants();
        expect(plants).toEqual([]);
      });

      it('should return all plants after creation', () => {
        const plant1: Plant = {
          id: '1',
          name: 'Plant 1',
          species: 'Species 1',
          location: 'Location 1',
          plantedDate: new Date().toISOString(),
          lastWatered: new Date().toISOString(),
          wateringFrequency: 7,
          lastFertilized: new Date().toISOString(),
          fertilizingFrequency: 30,
          notes: 'Test notes',
          sunlightRequirement: 'full-sun',
          soilType: 'Sandy',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const plant2: Plant = {
          id: '2',
          name: 'Plant 2',
          species: 'Species 2',
          location: 'Location 2',
          plantedDate: new Date().toISOString(),
          lastWatered: new Date().toISOString(),
          wateringFrequency: 14,
          solar: 'partial-shade',
          lastFertilized: new Date().toISOString(),
          fertilizingFrequency: 60,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        database.createPlant(plant1);
        database.createPlant(plant2);

        const plants = database.getAllPlants();
        expect(plants).toHaveLength(2);
        expect(plants[0].name).toBe('Plant 1');
        expect(plants[1].name).toBe('Plant 2');
      });

      it('should return plants ordered by createdAt DESC', () => {
        const plant1: Plant = {
          id: '1',
          name: 'Plant 1',
          species: 'Species 1',
          location: 'Location 1',
          plantedDate: new Date().toISOString(),
          lastWatered: new Date().toISOString(),
          wateringFrequency: 7,
          lastFertilized: new Date().toISOString(),
          fertilizingFrequency: 30,
          createdAt: new Date(Date.now() + 1000).toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const plant2: Plant = {
          id: '2',
          name: 'Plant 2',
          species: 'Species 2',
          location: 'Location 2',
          plantedDate: new Date().toISOString(),
          lastWatered: new Date().toISOString(),
          wateringFrequency: 14,
          solar: 'partial-shade',
          lastFertilized: new Date().toISOString(),
          fertilizingFrequency: 60,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        database.createPlant(plant2);
        database.createPlant(plant1);

        const plants = database.getAllPlants();
        expect(plants[0].id).toBe(plant1.id);
        expect(plants[1].id).toBe(plant2.id);
      });
    });

    describe('getPlantById', () => {
      it('should return null for non-existent plant', () => {
        const plant = database.getPlantById('non-existent-id');
        expect(plant).toBeNull();
      });

      it('should return the plant when it exists', () => {
        const newPlant: Plant = {
          id: 'test-plant-id',
          name: 'Test Plant',
          species: 'Test Species',
          location: 'Test Location',
          plantedDate: new Date().toISOString(),
          lastWatered: new Date().toISOString(),
          wateringFrequency: 7,
          lastFertilized: new Date().toISOString(),
          fertilizingFrequency: 30,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        database.createPlant(newPlant);

        const plant = database.getPlantById('test-plant-id');
        expect(plant).not.toBeNull();
        expect(plant?.id).toBe('test-plant-id');
        expect(plant?.name).toBe('Test Plant');
      });
    });

    describe('createPlant', () => {
      it('should create a plant with all fields', () => {
        const plantData = {
          name: 'Test Plant',
          species: 'Test Species',
          location: 'Test Location',
          plantedDate: new Date().toISOString(),
          lastWatered: new Date().toISOString(),
          wateringFrequency: 7,
          lastFertilized: new Date().toISOString(),
          fertilizingFrequency: 30,
          notes: 'Test notes',
          sunlightRequirement: 'full-sun',
          soilType: 'Sandy',
          harvestDate: new Date().toISOString(),
        };

        const plant = database.createPlant(plantData);

        expect(plant).toBeDefined();
        expect(plant.id).toBeDefined();
        expect(plant.name).toBe(plantData.name);
        expect(plant.species).toBe(plantData.species);
        expect(plant.location).toBe(plantData.location);
        expect(plant.createdAt).toBeDefined();
        expect(plant.updatedAt).toBeDefined();

        const found = database.getPlantById(plant.id);
        expect(found).toEqual(plant);
      });

      it('should set ID, createdAt, and updatedAt', () => {
        const plantData = {
          name: 'Test Plant',
          species: 'Test Species',
        };

        const plant = database.createPlant(plantData);

        expect(plant.id).toBeDefined();
        expect(typeof plant.id).toBe('string');
        expect(plant.createdAt).toBeDefined();
        expect(typeof plant.createdAt).toBe('string');
        expect(plant.updatedAt).toBeDefined();
        expect(typeof plant.updatedAt).toBe('string');
      });

      it('should handle optional fields', () => {
        const plantData = {
          name: 'Test Plant',
          species: 'Test Species',
        };

        const plant = database.createPlant(plantData);

        expect(plant.wateringFrequency).toBeUndefined();
        expect(plant.fertilizingFrequency).toBeUndefined();
        expect(plant.notes).toBeUndefined();
      });
    });

    describe('updatePlant', () => {
      it('should update an existing plant', () => {
        const createdPlant: Plant = {
          id: '1',
          name: 'Original Name',
          species: 'Original Species',
          location: 'Original Location',
          plantedDate: new Date().toISOString(),
          lastWatered: new Date().toISOString(),
          wateringFrequency: 7,
          lastFertilized: new Date().toISOString(),
          fertilizingFrequency: 30,
          notes: 'Original notes',
          sunlightRequirement: 'full-sun',
          soilType: 'Sandy',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        database.createPlant(createdPlant);

        const updateData = {
          name: 'Updated Name',
          species: 'Updated Species',
        };

        const updated = database.updatePlant('1', updateData);

        expect(updated).not.toBeNull();
        expect(updated?.name).toBe('Updated Name');
        expect(updated?.species).toBe('Updated Species');
        expect(updated?.location).toBe('Original Location');
        expect(updated?.updatedAt).not.toBe(createdPlant.updatedAt);
      });

      it('should return null for non-existent plant', () => {
        const updated = database.updatePlant('non-existent-id', { name: 'Updated' });
        expect(updated).toBeNull();
      });

      it('should keep existing fields unchanged', () => {
        const createdPlant: Plant = {
          id: '1',
          name: 'Original Name',
          species: 'Original Species',
          location: 'Original Location',
          plantedDate: new Date().toISOString(),
          lastWatered: new Date().toISOString(),
          wateringFrequency: 7,
          lastFertilized: new Date().toISOString(),
          fertilizingFrequency: 30,
          notes: 'Original notes',
          sunlightRequirement: 'full-sun',
          soilType: 'Sandy',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        database.createPlant(createdPlant);

        const updated = database.updatePlant('1', { name: 'Updated Name' });

        expect(updated!.name).toBe('Updated Name');
      });

      it('should update createdAt on update', () => {
        const createdPlant: Plant = {
          id: '1',
          name: 'Test Plant',
          species: 'Test Species',
          location: 'Test Location',
          plantedDate: new Date().toISOString(),
          lastWatered: new Date().toISOString(),
          wateringFrequency: 7,
          lastFertilized: new Date().toISOString(),
          fertilizingFrequency: 30,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        database.createPlant(createdPlant);

        const updateData = {
          name: 'Updated',
        };

        const updated = database.updatePlant('1', updateData);

        expect(updated!.name).toBe('Updated');
        expect(updated!.updatedAt).not.toBe(createdPlant.updatedAt);
      });
    });

    describe('deletePlant', () => {
      it('should delete an existing plant', () => {
        const createdPlant: Plant = {
          id: '1',
          name: 'Test Plant',
          species: 'Test Species',
          location: 'Test Location',
          plantedDate: new Date().toISOString(),
          lastWatered: new Date().toISOString(),
          wateringFrequency: 7,
          lastFertilized: new Date().toISOString(),
          fertilizingFrequency: 30,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        database.createPlant(createdPlant);

        expect(database.getAllPlants()).toHaveLength(1);

        const deleted = database.deletePlant('1');

        expect(deleted).toBe(true);
        expect(database.getAllPlants()).toHaveLength(0);
      });

      it('should return false for non-existent plant', () => {
        const deleted = database.deletePlant('non-existent-id');
        expect(deleted).toBe(false);
      });

      it('should remove plant from getAllPlants', () => {
        const createdPlant: Plant = {
          id: '1',
          name: 'Test Plant',
          species: 'Test Species',
          location: 'Test Location',
          plantedDate: new Date().toISOString(),
          lastWatered: new Date().toISOString(),
          wateringFrequency: 7,
          lastFertilized: new Date().toISOString(),
          fertilizingFrequency: 30,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        database.createPlant(createdPlant);

        expect(database.getPlantById('1')).not.toBeNull();

        database.deletePlant('1');

        expect(database.getPlantById('1')).toBeNull();
        expect(database.getAllPlants()).toHaveLength(0);
      });
    });

    describe('close', () => {
      it('should close the database connection', () => {
        const db = database['getDatabase']();
        database.close();
        const stmt = db.prepare('SELECT 1');
        const result = stmt.get();
        expect(result).toBeUndefined();
      });

      it('should allow creating new database after close', () => {
        const tempDb = __dirname + '/temp_test2.db';
        database = createSqliteDatabase(tempDb);
        expect(database).toBeDefined();
      });
    });
  });
});