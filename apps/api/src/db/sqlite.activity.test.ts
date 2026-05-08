import { unlinkSync } from 'fs';
import path from 'path';
import { createSqliteDatabase } from './sqlite';

describe('sqlite — activity-log methods', () => {
  let dbFile: string;
  let database: ReturnType<typeof createSqliteDatabase>;

  beforeEach(() => {
    dbFile = path.join(
      __dirname,
      `activity_${Date.now()}_${Math.random().toString(36).slice(2)}.db`,
    );
    database = createSqliteDatabase(dbFile);
  });

  afterEach(() => {
    database.close();
    try {
      unlinkSync(dbFile);
    } catch {
      /* ignore */
    }
    try {
      unlinkSync(`${dbFile}-wal`);
    } catch {
      /* ignore */
    }
    try {
      unlinkSync(`${dbFile}-shm`);
    } catch {
      /* ignore */
    }
  });

  describe('getPlantByName', () => {
    it('returns null when no plant with that name exists', () => {
      expect(database.getPlantByName('basil')).toBeNull();
    });

    it('returns the matching plant', () => {
      const created = database.createPlant({ name: 'Basil', species: 'Ocimum basilicum' });
      expect(database.getPlantByName('Basil')?.id).toBe(created.id);
    });

    it('matches case-insensitively', () => {
      const created = database.createPlant({ name: 'Basil', species: 'Ocimum basilicum' });
      expect(database.getPlantByName('basil')?.id).toBe(created.id);
      expect(database.getPlantByName('BASIL')?.id).toBe(created.id);
    });

    it('returns the first plant when multiple share a name', () => {
      const first = database.createPlant({ name: 'Basil', species: 'Ocimum basilicum' });
      database.createPlant({ name: 'basil', species: 'Ocimum basilicum' });
      const found = database.getPlantByName('Basil');
      expect(found).not.toBeNull();
      expect([first.id]).toContain(found?.id);
    });
  });

  describe('updatePlantCareDates', () => {
    it('returns null for an unknown plant id', () => {
      expect(
        database.updatePlantCareDates('does-not-exist', { lastWatered: new Date().toISOString() }),
      ).toBeNull();
    });

    it('updates only the supplied fields and bumps updatedAt', async () => {
      const plantedDate = new Date('2026-04-01T00:00:00.000Z').toISOString();
      const original = database.createPlant({
        name: 'Tomato',
        species: 'Solanum lycopersicum',
        plantedDate,
        notes: 'cherry variety',
      });

      await new Promise((resolve) => {
        setTimeout(resolve, 5);
      });

      const watered = new Date('2026-05-01T08:00:00.000Z').toISOString();
      const updated = database.updatePlantCareDates(original.id, { lastWatered: watered });

      expect(updated).not.toBeNull();
      expect(updated!.lastWatered).toBe(watered);
      expect(updated!.plantedDate).toBe(plantedDate);
      expect(updated!.notes).toBe('cherry variety');
      expect(updated!.updatedAt).not.toBe(original.updatedAt);
    });

    it('can update multiple care dates in one call', () => {
      const plant = database.createPlant({ name: 'Rose', species: 'Rosa' });
      const lastWatered = new Date('2026-05-01T00:00:00.000Z').toISOString();
      const lastFertilized = new Date('2026-04-15T00:00:00.000Z').toISOString();

      const updated = database.updatePlantCareDates(plant.id, { lastWatered, lastFertilized });

      expect(updated!.lastWatered).toBe(lastWatered);
      expect(updated!.lastFertilized).toBe(lastFertilized);
    });
  });
});
