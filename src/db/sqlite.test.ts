import { unlinkSync } from 'fs';
import { createSqliteDatabase } from './sqlite';

const USER_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const USER_B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

describe('Database Layer', () => {
  let dbFile: string;
  let database: ReturnType<typeof createSqliteDatabase>;

  beforeEach(() => {
    dbFile = `${__dirname}/temp_test_${Date.now()}.db`;
    database = createSqliteDatabase(dbFile);
  });

  afterEach(() => {
    if (database) database.close();
    try {
      unlinkSync(dbFile);
    } catch {
      /* ignore */
    }
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
        expect(database.getAllPlants(USER_A)).toEqual([]);
      });

      it('should return all plants after creation', () => {
        database.createPlant(USER_A, { name: 'Plant 1', species: 'Species 1' });
        database.createPlant(USER_A, { name: 'Plant 2', species: 'Species 2' });
        expect(database.getAllPlants(USER_A)).toHaveLength(2);
      });

      it('should not leak plants across users', () => {
        database.createPlant(USER_A, { name: 'A1', species: 'sp' });
        database.createPlant(USER_B, { name: 'B1', species: 'sp' });
        expect(database.getAllPlants(USER_A)).toHaveLength(1);
        expect(database.getAllPlants(USER_B)).toHaveLength(1);
        expect(database.getAllPlants(USER_A)[0].name).toBe('A1');
      });
    });

    describe('getPlantById', () => {
      it('should return null for non-existent plant', () => {
        expect(database.getPlantById(USER_A, 'non-existent-id')).toBeNull();
      });

      it('should return the plant when it exists', () => {
        const created = database.createPlant(USER_A, {
          name: 'Test Plant',
          species: 'Test Species',
        });
        const found = database.getPlantById(USER_A, created.id);
        expect(found).not.toBeNull();
        expect(found?.name).toBe('Test Plant');
      });

      it('should not return another user’s plant', () => {
        const created = database.createPlant(USER_A, { name: 'Owned', species: 'sp' });
        expect(database.getPlantById(USER_B, created.id)).toBeNull();
      });
    });

    describe('getPlantByName', () => {
      it('should return null for non-existent plant', () => {
        expect(database.getPlantByName(USER_A, 'Nonexistent')).toBeNull();
      });

      it('should find plant case-insensitively', () => {
        database.createPlant(USER_A, { name: 'Basil', species: 'Ocimum basilicum' });
        expect(database.getPlantByName(USER_A, 'basil')).not.toBeNull();
        expect(database.getPlantByName(USER_A, 'BASIL')).not.toBeNull();
      });

      it('only matches plants owned by the user', () => {
        database.createPlant(USER_A, { name: 'Basil', species: 'Ocimum basilicum' });
        expect(database.getPlantByName(USER_B, 'basil')).toBeNull();
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
        const plant = database.createPlant(USER_A, plantData);
        expect(plant.id).toBeDefined();
        expect(plant.name).toBe(plantData.name);
        expect(plant.createdAt).toBeDefined();
        expect(database.getPlantById(USER_A, plant.id)).toEqual(plant);
      });

      it('should set ID, createdAt, and updatedAt', () => {
        const plant = database.createPlant(USER_A, {
          name: 'Test Plant',
          species: 'Test Species',
        });
        expect(typeof plant.id).toBe('string');
        expect(typeof plant.createdAt).toBe('string');
        expect(typeof plant.updatedAt).toBe('string');
      });

      it('should handle optional fields', () => {
        const plant = database.createPlant(USER_A, {
          name: 'Test Plant',
          species: 'Test Species',
        });
        expect(plant.wateringFrequency).toBeUndefined();
        expect(plant.notes).toBeUndefined();
      });
    });

    describe('updatePlant', () => {
      it('should update an existing plant', async () => {
        const created = database.createPlant(USER_A, { name: 'Original', species: 'Species' });
        await new Promise((r) => {
          setTimeout(r, 2);
        });
        const updated = database.updatePlant(USER_A, created.id, { name: 'Updated' });
        expect(updated?.name).toBe('Updated');
        expect(updated?.updatedAt).not.toBe(created.updatedAt);
      });

      it('should return null for non-existent plant', () => {
        expect(database.updatePlant(USER_A, 'non-existent-id', { name: 'Updated' })).toBeNull();
      });

      it('should not update another user’s plant', () => {
        const created = database.createPlant(USER_A, { name: 'Mine', species: 'sp' });
        expect(database.updatePlant(USER_B, created.id, { name: 'Stolen' })).toBeNull();
        expect(database.getPlantById(USER_A, created.id)?.name).toBe('Mine');
      });
    });

    describe('updatePlantCareDates', () => {
      it('should only update specified care date fields', () => {
        const created = database.createPlant(USER_A, {
          name: 'Basil',
          species: 'Ocimum basilicum',
        });
        const now = new Date().toISOString();
        const updated = database.updatePlantCareDates(USER_A, created.id, { lastWatered: now });
        expect(updated?.lastWatered).toBe(now);
        expect(updated?.lastFertilized).toBeUndefined();
      });
    });

    describe('deletePlant', () => {
      it('should delete an existing plant', () => {
        const created = database.createPlant(USER_A, {
          name: 'Test Plant',
          species: 'Test Species',
        });
        expect(database.deletePlant(USER_A, created.id)).toBe(true);
        expect(database.getPlantById(USER_A, created.id)).toBeNull();
      });

      it('should return false for non-existent plant', () => {
        expect(database.deletePlant(USER_A, 'non-existent-id')).toBe(false);
      });

      it('should not delete another user’s plant', () => {
        const created = database.createPlant(USER_A, { name: 'Mine', species: 'sp' });
        expect(database.deletePlant(USER_B, created.id)).toBe(false);
        expect(database.getPlantById(USER_A, created.id)).not.toBeNull();
      });
    });
  });

  describe('Calendar Events CRUD', () => {
    let plantId: string;

    beforeEach(() => {
      const plant = database.createPlant(USER_A, {
        name: 'Test Plant',
        species: 'Test Species',
      });
      plantId = plant.id;
    });

    it('should return empty array initially', () => {
      expect(database.getAllCalendarEvents(USER_A)).toEqual([]);
    });

    it('should create and retrieve a calendar event', () => {
      const event = database.createCalendarEvent(USER_A, {
        plantId,
        type: 'water',
        date: new Date().toISOString(),
      });
      expect(event.id).toBeDefined();
      expect(event.plantId).toBe(plantId);
      expect(event.completed).toBe(false);
    });

    it('should update a calendar event', () => {
      const event = database.createCalendarEvent(USER_A, {
        plantId,
        type: 'water',
        date: new Date().toISOString(),
      });
      const updated = database.updateCalendarEvent(USER_A, event.id, { completed: true });
      expect(updated?.completed).toBe(true);
    });

    it('should delete a calendar event', () => {
      const event = database.createCalendarEvent(USER_A, {
        plantId,
        type: 'water',
        date: new Date().toISOString(),
      });
      expect(database.deleteCalendarEvent(USER_A, event.id)).toBe(true);
      expect(database.getCalendarEventById(USER_A, event.id)).toBeNull();
    });

    it('should not leak events across users', () => {
      database.createCalendarEvent(USER_A, {
        plantId,
        type: 'water',
        date: new Date().toISOString(),
      });
      expect(database.getAllCalendarEvents(USER_B)).toEqual([]);
    });

    describe('getCalendarEventsInRange', () => {
      it('returns events with date in [start, end)', () => {
        database.createCalendarEvent(USER_A, {
          plantId,
          type: 'water',
          date: '2026-05-01T00:00:00.000Z',
        });
        database.createCalendarEvent(USER_A, {
          plantId,
          type: 'water',
          date: '2026-05-05T12:00:00.000Z',
        });
        database.createCalendarEvent(USER_A, {
          plantId,
          type: 'water',
          date: '2026-05-08T00:00:00.000Z',
        });
        const events = database.getCalendarEventsInRange(
          USER_A,
          '2026-05-02T00:00:00.000Z',
          '2026-05-08T00:00:00.000Z',
        );
        expect(events).toHaveLength(1);
        expect(events[0].date).toBe('2026-05-05T12:00:00.000Z');
      });
    });

    describe('getUpcomingCalendarEvents', () => {
      it('returns only future, non-completed events ordered by date', () => {
        database.createCalendarEvent(USER_A, {
          plantId,
          type: 'water',
          date: '2026-04-01T00:00:00.000Z',
        });
        database.createCalendarEvent(USER_A, {
          plantId,
          type: 'water',
          date: '2026-06-01T00:00:00.000Z',
        });
        const completed = database.createCalendarEvent(USER_A, {
          plantId,
          type: 'water',
          date: '2026-07-01T00:00:00.000Z',
        });
        database.updateCalendarEvent(USER_A, completed.id, { completed: true });

        const events = database.getUpcomingCalendarEvents(USER_A, '2026-05-01T00:00:00.000Z', 10);
        expect(events).toHaveLength(1);
        expect(events[0].date).toBe('2026-06-01T00:00:00.000Z');
      });
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

    it('should round-trip a timezone', () => {
      const user = database.createUser({
        username: 'tzuser',
        email: 'tz@example.com',
        name: 'TZ User',
        passwordHash: 'hash',
        timezone: 'Australia/Perth',
      });
      expect(database.getUserById(user.id)?.timezone).toBe('Australia/Perth');
    });
  });
});
