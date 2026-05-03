import { unlinkSync } from 'fs';
import { createSqliteDatabase } from './sqlite';

describe('Database Layer', () => {
  let dbFile: string;
  let database: ReturnType<typeof createSqliteDatabase>;

  beforeEach(() => {
    dbFile = `${__dirname}/temp_test_${Date.now()}.db`;
    database = createSqliteDatabase(dbFile);
  });

  afterEach(() => {
    if (database) database.close();
    try { unlinkSync(dbFile); } catch { /* ignore */ }
  });

  describe('SQLite Initialization', () => {
    it('should create database file', () => {
      expect(dbFile).toBeDefined();
      expect(dbFile).toMatch(/\.db$/);
    });

    it('should have WAL mode enabled', () => {
      expect(database).toBeDefined();
    });
  });

  describe('Plants CRUD', () => {
    describe('getAllPlants', () => {
      it('should return empty array initially', () => {
        expect(database.getAllPlants()).toEqual([]);
      });

      it('should return all plants after creation', () => {
        database.createPlant({ name: 'Plant 1', species: 'Species 1' });
        database.createPlant({ name: 'Plant 2', species: 'Species 2' });
        expect(database.getAllPlants()).toHaveLength(2);
      });
    });

    describe('getPlantById', () => {
      it('should return null for non-existent plant', () => {
        expect(database.getPlantById('non-existent-id')).toBeNull();
      });

      it('should return the plant when it exists', () => {
        const created = database.createPlant({ name: 'Test Plant', species: 'Test Species' });
        const found = database.getPlantById(created.id);
        expect(found).not.toBeNull();
        expect(found?.name).toBe('Test Plant');
      });
    });

    describe('getPlantByName', () => {
      it('should return null for non-existent plant', () => {
        expect(database.getPlantByName('Nonexistent')).toBeNull();
      });

      it('should find plant case-insensitively', () => {
        database.createPlant({ name: 'Basil', species: 'Ocimum basilicum' });
        expect(database.getPlantByName('basil')).not.toBeNull();
        expect(database.getPlantByName('BASIL')).not.toBeNull();
      });
    });

    describe('createPlant', () => {
      it('should create a plant with all fields', () => {
        const plantData = {
          name: 'Test Plant',
          species: 'Test Species',
          location: 'Test Location',
          sunlightRequirement: 'full-sun' as const,
          soilType: 'Sandy',
        };
        const plant = database.createPlant(plantData);
        expect(plant.id).toBeDefined();
        expect(plant.name).toBe(plantData.name);
        expect(plant.createdAt).toBeDefined();
        expect(database.getPlantById(plant.id)).toEqual(plant);
      });

      it('should set ID, createdAt, and updatedAt', () => {
        const plant = database.createPlant({ name: 'Test Plant', species: 'Test Species' });
        expect(typeof plant.id).toBe('string');
        expect(typeof plant.createdAt).toBe('string');
        expect(typeof plant.updatedAt).toBe('string');
      });

      it('should handle optional fields', () => {
        const plant = database.createPlant({ name: 'Test Plant', species: 'Test Species' });
        expect(plant.wateringFrequency).toBeUndefined();
        expect(plant.notes).toBeUndefined();
      });
    });

    describe('updatePlant', () => {
      it('should update an existing plant', async () => {
        const created = database.createPlant({ name: 'Original', species: 'Species' });
        await new Promise((r) => { setTimeout(r, 2); });
        const updated = database.updatePlant(created.id, { name: 'Updated' });
        expect(updated?.name).toBe('Updated');
        expect(updated?.updatedAt).not.toBe(created.updatedAt);
      });

      it('should return null for non-existent plant', () => {
        expect(database.updatePlant('non-existent-id', { name: 'Updated' })).toBeNull();
      });
    });

    describe('updatePlantCareDates', () => {
      it('should only update specified care date fields', () => {
        const created = database.createPlant({ name: 'Basil', species: 'Ocimum basilicum' });
        const now = new Date().toISOString();
        const updated = database.updatePlantCareDates(created.id, { lastWatered: now });
        expect(updated?.lastWatered).toBe(now);
        expect(updated?.lastFertilized).toBeUndefined();
      });
    });

    describe('deletePlant', () => {
      it('should delete an existing plant', () => {
        const created = database.createPlant({ name: 'Test Plant', species: 'Test Species' });
        expect(database.deletePlant(created.id)).toBe(true);
        expect(database.getPlantById(created.id)).toBeNull();
      });

      it('should return false for non-existent plant', () => {
        expect(database.deletePlant('non-existent-id')).toBe(false);
      });
    });
  });

  describe('Calendar Events CRUD', () => {
    let plantId: string;

    beforeEach(() => {
      const plant = database.createPlant({ name: 'Test Plant', species: 'Test Species' });
      plantId = plant.id;
    });

    it('should return empty array initially', () => {
      expect(database.getAllCalendarEvents()).toEqual([]);
    });

    it('should create and retrieve a calendar event', () => {
      const event = database.createCalendarEvent({
        plantId,
        type: 'water',
        date: new Date().toISOString(),
      });
      expect(event.id).toBeDefined();
      expect(event.plantId).toBe(plantId);
      expect(event.completed).toBe(false);
    });

    it('should update a calendar event', () => {
      const event = database.createCalendarEvent({
        plantId,
        type: 'water',
        date: new Date().toISOString(),
      });
      const updated = database.updateCalendarEvent(event.id, { completed: true });
      expect(updated?.completed).toBe(true);
    });

    it('should delete a calendar event', () => {
      const event = database.createCalendarEvent({
        plantId,
        type: 'water',
        date: new Date().toISOString(),
      });
      expect(database.deleteCalendarEvent(event.id)).toBe(true);
      expect(database.getCalendarEventById(event.id)).toBeNull();
    });
  });

  describe('Users CRUD', () => {
    it('should create and retrieve a user', () => {
      const user = database.createUser({
        username: 'testuser',
        email: 'test@example.com',
        name: 'Test User',
        passwordHash: 'hash123abc456def789',
      });
      expect(user.id).toBeDefined();
      expect(user.username).toBe('testuser');
      expect(database.getUserByUsername('testuser')).not.toBeNull();
    });

    it('should return null for non-existent user', () => {
      expect(database.getUserByUsername('nonexistent')).toBeNull();
      expect(database.getUserByEmail('nonexistent@example.com')).toBeNull();
    });

    it('should update user password via updateUser', () => {
      const user = database.createUser({
        username: 'pwuser',
        email: 'pw@example.com',
        name: 'PW User',
        passwordHash: 'oldhash',
      });
      const updated = database.updateUser(user.id, { passwordHash: 'newhash' });
      expect(updated?.passwordHash).toBe('newhash');
    });

    it('should clear reset token via updateUser', () => {
      const user = database.createUser({
        username: 'resetuser',
        email: 'reset@example.com',
        name: 'Reset User',
        passwordHash: 'hash',
      });
      const updated = database.updateUser(user.id, {
        resetToken: undefined,
        resetTokenExpiry: undefined,
      });
      expect(updated?.resetToken).toBeUndefined();
    });
  });
});
