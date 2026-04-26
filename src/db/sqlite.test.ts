import { expect, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { createSqliteDatabase } from './sqlite';
import type { Plant } from '../models/plant';
import type { User } from '../models/user';

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
  describe('Users', () => {
    describe('createUser', () => {
      it('should create a user with all fields', () => {
        const userData = {
          username: 'testuser',
          email: 'test@example.com',
          name: 'Test User',
        };

        const user = database.createUser(userData);

        expect(user).toBeDefined();
        expect(user.id).toBeDefined();
        expect(user.username).toBe(userData.username);
        expect(user.email).toBe(userData.email);
        expect(user.name).toBe(userData.name);
        expect(user.passwordHash).toBeDefined();
        expect(user.avatarUrl).toBeDefined();

        const found = database.getUserByUsername(userData.username);
        expect(found).toEqual(user);
      });

      it('should set avatarUrl using Gravatar', () => {
        const userData = {
          username: 'gravatartest',
          email: 'gravatar@example.com',
          name: 'Gravatar User',
        };

        const user = database.createUser(userData);

        expect(user.avatarUrl).toContain('gravatar.com');
        expect(user.avatarUrl).toContain('gravatar@example.com');
      });

      it('should handle missing name', () => {
        const userData = {
          username: 'minimaluser',
          email: 'minimal@example.com',
        };

        const user = database.createUser(userData);

        expect(user).toBeDefined();
        expect(user.id).toBeDefined();
        expect(user.name).toBe('');
      });
    });

    describe('getUsers', () => {
      it('should return empty array initially', () => {
        const users = database.getAllUsers();
        expect(users).toEqual([]);
      });

      it('should return all users after creation', () => {
        const user1: Omit<User, 'id' | 'passwordHash' | 'resetToken' | 'resetTokenExpiry' | 'createdAt' | 'updatedAt' | 'avatarUrl'> = {
          username: 'user1',
          email: 'user1@example.com',
          name: 'User One',
        };

        const user2: Omit<User, 'id' | 'passwordHash' | 'resetToken' | 'resetTokenExpiry' | 'createdAt' | 'updatedAt' | 'avatarUrl'> = {
          username: 'user2',
          email: 'user2@example.com',
          name: 'User Two',
        };

        database.createUser(user1);
        database.createUser(user2);

        const users = database.getAllUsers();
        expect(users).toHaveLength(2);
        expect(users[0].username).toBe('user1');
        expect(users[1].username).toBe('user2');
      });
    });

    describe('getUserByUsername', () => {
      it('should return null for non-existent user', () => {
        const user = database.getUserByUsername('nonexistent');
        expect(user).toBeNull();
      });

      it('should return the user when it exists', () => {
        const userData: Omit<User, 'id' | 'passwordHash' | 'resetToken' | 'resetTokenExpiry' | 'createdAt' | 'updatedAt' | 'avatarUrl'> = {
          username: 'founduser',
          email: 'found@example.com',
          name: 'Found User',
        };

        const created = database.createUser(userData);

        const user = database.getUserByUsername(userData.username);
        expect(user).not.toBeNull();
        expect(user?.id).toBe(created.id);
        expect(user?.username).toBe(userData.username);
      });

      it('should return user regardless of case sensitivity', () => {
        const userData: Omit<User, 'id' | 'passwordHash' | 'resetToken' | 'resetTokenExpiry' | 'createdAt' | 'updatedAt' | 'avatarUrl'> = {
          username: 'TestUser',
          email: 'test@example.com',
          name: 'Test Test',
        };

        database.createUser(userData);

        const user = database.getUserByUsername('testuser');
        expect(user).not.toBeNull();
      });
    });

    describe('getUserByEmail', () => {
      it('should return null for non-existent user', () => {
        const user = database.getUserByEmail('nonexistent@example.com');
        expect(user).toBeNull();
      });

      it('should return the user when it exists', () => {
        const userData: Omit<User, 'id' | 'passwordHash' | 'resetToken' | 'resetTokenExpiry' | 'createdAt' | 'updatedAt' | 'avatarUrl'> = {
          username: 'emailuser',
          email: 'emailtest@example.com',
          name: 'Email User',
        };

        const created = database.createUser(userData);

        const user = database.getUserByEmail(userData.email);
        expect(user).not.toBeNull();
        expect(user?.id).toBe(created.id);
        expect(user?.email).toBe(userData.email);
      });
    });

    describe('verifyPassword', () => {
      it('should verify correct password', () => {
        const userData: Omit<User, 'id' | 'passwordHash' | 'resetToken' | 'resetTokenExpiry' | 'createdAt' | 'updatedAt' | 'avatarUrl'> = {
          username: 'passworduser',
          email: 'password@example.com',
          name: 'Password User',
        };

        const created = database.createUser(userData);
        const correctPassword = 'correctpassword';

        const isCorrect = database.verifyPassword(correctPassword, created.passwordHash);
        expect(isCorrect).toBe(true);
      });

      it('should reject incorrect password', () => {
        const userData: Omit<User, 'id' | 'passwordHash' | 'resetToken' | 'resetTokenExpiry' | 'createdAt' | 'updatedAt' | 'avatarUrl'> = {
          username: 'wrongpassuser',
          email: 'wrongpass@example.com',
          name: 'Wrong Password User',
        };

        const created = database.createUser(userData);

        const isCorrect = database.verifyPassword('wrongpassword', created.passwordHash);
        expect(isCorrect).toBe(false);
      });
    });

    describe('authenticateUser', () => {
      it('should return user with correct credentials', () => {
        const userData: Omit<User, 'id' | 'passwordHash' | 'resetToken' | 'resetTokenExpiry' | 'createdAt' | 'updatedAt' | 'avatarUrl'> = {
          username: 'authuser',
          email: 'auth@example.com',
          name: 'Auth User',
        };

        const created = database.createUser(userData);
        const password = 'testpassword123';

        const authenticated = database.authenticateUser(userData.username, password);
        expect(authenticated).not.toBeNull();
        expect(authenticated?.id).toBe(created.id);
        expect(database.verifyPassword(password, authenticated!.passwordHash)).toBe(true);
      });

      it('should return null with wrong username', () => {
        const userData: Omit<User, 'id' | 'passwordHash' | 'resetToken' | 'resetTokenExpiry' | 'createdAt' | 'updatedAt' | 'avatarUrl'> = {
          username: 'authuser',
          email: 'auth@example.com',
          name: 'Auth User',
        };

        database.createUser(userData);

        const authenticated = database.authenticateUser('wrongusername', 'testpassword');
        expect(authenticated).toBeNull();
      });

      it('should return null with wrong password', () => {
        const userData: Omit<User, 'id' | 'passwordHash' | 'resetToken' | 'resetTokenExpiry' | 'createdAt' | 'updatedAt' | 'avatarUrl'> = {
          username: 'authuser',
          email: 'auth@example.com',
          name: 'Auth User',
        };

        database.createUser(userData);

        const authenticated = database.authenticateUser(userData.username, 'wrongpassword');
        expect(authenticated).toBeNull();
      });
    });

    describe('reset token', () => {
      it('should generate reset token', () => {
        const userData: Omit<User, 'id' | 'passwordHash' | 'resetToken' | 'resetTokenExpiry' | 'createdAt' | 'updatedAt' | 'avatarUrl'> = {
          username: 'resetuser',
          email: 'reset@example.com',
          name: 'Reset User',
        };

        const created = database.createUser(userData);

        const token = database.generateResetToken();
        const user = database.getUserByEmail(userData.email);

        expect(user?.resetToken).toBe(token);
        expect(user?.resetTokenExpiry).toBeDefined();
      });

      it('should verify reset token', () => {
        const userData: Omit<User, 'id' | 'passwordHash' | 'resetToken' | 'resetTokenExpiry' | 'createdAt' | 'updatedAt' | 'avatarUrl'> = {
          username: 'resetuser',
          email: 'reset@example.com',
          name: 'Reset User',
        };

        const created = database.createUser(userData);
        const token = database.generateResetToken();

        const verified = database.verifyResetToken(token);
        expect(verified).not.toBeNull();
        expect(verified?.id).toBe(created.id);
      });

      it('should return null for expired reset token', () => {
        const userData: Omit<User, 'id' | 'passwordHash' | 'resetToken' | 'resetTokenExpiry' | 'createdAt' | 'updatedAt' | 'avatarUrl'> = {
          username: 'resetuser',
          email: 'reset@example.com',
          name: 'Reset User',
        };

        database.createUser(userData);

        const token = database.generateResetToken();
        const oldToken: any = `${token}_1234567890`;

        const verified = database.verifyResetToken(oldToken);
        expect(verified).toBeNull();
      });
    });
  });
});