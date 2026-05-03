import { createPlantService } from './plants';
import type { Plant } from '../models/plant';
import type { DatabaseWrapper } from '../db/index';

type MockDatabase = Pick<DatabaseWrapper,
  'getAllPlants' | 'getPlantById' | 'getPlantByName' | 'createPlant' |
  'updatePlant' | 'updatePlantCareDates' | 'deletePlant' |
  'getAllCalendarEvents' | 'getCalendarEventById' | 'createCalendarEvent' |
  'updateCalendarEvent' | 'deleteCalendarEvent' | 'close'
>;

describe('Plant Service', () => {
  let db: MockDatabase;
  let plantService: ReturnType<typeof createPlantService>;
  let store: Map<string, Plant>;
  let counter: number;

  beforeEach(() => {
    store = new Map();
    counter = 0;
    db = {
      getAllPlants(): Plant[] { return Array.from(store.values()); },
      getPlantById(id: string): Plant | null { return store.get(id) ?? null; },
      getPlantByName(name: string): Plant | null {
        for (const p of store.values()) {
          if (p.name.toLowerCase() === name.toLowerCase()) return p;
        }
        return null;
      },
      createPlant(plant: Omit<Plant, 'id' | 'createdAt' | 'updatedAt'>): Plant {
        counter += 1;
        const id = crypto.randomUUID();
        const ts = new Date(Date.now() + counter).toISOString();
        const created: Plant = {
          ...plant, id, createdAt: ts, updatedAt: ts,
        };
        store.set(id, created);
        return created;
      },
      updatePlant(id: string, plant: Partial<Plant>): Plant | null {
        const existing = (this as MockDatabase).getPlantById(id);
        if (!existing) return null;
        counter += 1;
        const updated: Plant = {
          ...existing,
          ...plant,
          id: existing.id,
          createdAt: existing.createdAt,
          updatedAt: new Date(Date.now() + counter).toISOString(),
        };
        store.set(id, updated);
        return updated;
      },
      updatePlantCareDates(_id: string, _dates: any): Plant | null { return null; },
      deletePlant(id: string): boolean { return store.delete(id); },
      getAllCalendarEvents() { return []; },
      getCalendarEventById(_id: string) { return null; },
      createCalendarEvent(_event: any) { return null as any; },
      updateCalendarEvent(_id: string, _event: any) { return null; },
      deleteCalendarEvent(_id: string): boolean { return false; },
      close() {},
    };
    plantService = createPlantService(db);
  });

  describe('createPlantService', () => {
    it('should create a service with a database', () => {
      expect(plantService).toBeDefined();
      expect(typeof plantService.listPlants).toBe('function');
      expect(typeof plantService.getPlant).toBe('function');
      expect(typeof plantService.createPlant).toBe('function');
      expect(typeof plantService.updatePlant).toBe('function');
      expect(typeof plantService.deletePlant).toBe('function');
    });
  });

  describe('listPlants', () => {
    it('should return empty array when database returns empty', () => {
      const plants = plantService.listPlants();
      expect(plants).toEqual([]);
    });

    it('should return all plants from database', () => {
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
        sunlightRequirement: 'partial-shade',
        lastFertilized: new Date().toISOString(),
        fertilizingFrequency: 60,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      db.getAllPlants = () => [plant1, plant2];

      const plants = plantService.listPlants();
      expect(plants).toHaveLength(2);
      expect(plants[0].name).toBe('Plant 1');
      expect(plants[1].name).toBe('Plant 2');
    });
  });

  describe('getPlant', () => {
    it('should return null for non-existent plant', () => {
      const plant = plantService.getPlant('non-existent-id');
      expect(plant).toBeNull();
    });

    it('should return the plant when it exists', () => {
      const plant: Plant = {
        id: 'test-plant-id',
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
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      db.getPlantById = () => plant;

      const retrieved = plantService.getPlant('test-plant-id');
      expect(retrieved).toEqual(plant);
    });
  });

  describe('createPlant', () => {
    it('should create a plant with valid input', () => {
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
        sunlightRequirement: 'full-sun' as const,
        soilType: 'Sandy',
        harvestDate: new Date().toISOString(),
      };

      const plant = plantService.createPlant(plantData);

      expect(plant).toBeDefined();
      expect(typeof plant.id).toBe('string');
      expect(typeof plant.createdAt).toBe('string');
      expect(typeof plant.updatedAt).toBe('string');
      expect(plant.name).toBe(plantData.name);
      expect(plant.species).toBe(plantData.species);
      expect(plant.location).toBe(plantData.location);
      expect(plant.sunlightRequirement).toBe(plantData.sunlightRequirement);
      expect(plant.soilType).toBe(plantData.soilType);

      const retrieved = db.getPlantById(plant.id);
      expect(retrieved).toEqual(plant);
    });

    it('should validate input against Zod schema', () => {
      const invalidData = {
        name: '',
        species: 'Test Species',
      };

      expect(() => plantService.createPlant(invalidData as any)).toThrow();
    });

    it('should create plant without optional fields', () => {
      const plantData = {
        name: 'Minimal Plant',
        species: 'Minimal Species',
      };

      const plant = plantService.createPlant(plantData);

      expect(plant.id).toBeDefined();
      expect(plant.name).toBe(plantData.name);
      expect(plant.species).toBe(plantData.species);
      expect(plant.createdAt).toBeDefined();
      expect(plant.updatedAt).toBeDefined();
    });

    it('should generate ID and timestamps', () => {
      const plantData = {
        name: 'Test Plant',
        species: 'Test Species',
      };

      const plant1 = plantService.createPlant(plantData);
      const plant2 = plantService.createPlant(plantData);

      expect(plant1.id).not.toBe(plant2.id);
      expect(plant1.createdAt).not.toBe(plant2.createdAt);
      expect(plant1.updatedAt).not.toBe(plant2.updatedAt);
    });
  });

  describe('updatePlant', () => {
    it('should update an existing plant', () => {
      const existingPlant: Plant = {
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

      db.getPlantById = () => existingPlant;

      const updateData = {
        name: 'Updated Name',
        species: 'Updated Species',
      };

      const updated = plantService.updatePlant('1', updateData);

      expect(updated).not.toBeNull();
      expect(updated?.name).toBe('Updated Name');
      expect(updated?.species).toBe('Updated Species');
      expect(updated?.location).toBe('Original Location');
      expect(updated?.updatedAt).not.toBe(existingPlant.updatedAt);
    });

    it('should return null for non-existent plant', () => {
      const updated = plantService.updatePlant('non-existent-id', { name: 'Updated' });
      expect(updated).toBeNull();
    });

    it('should validate input against Zod schema', () => {
      const invalidData = {
        name: '',
      };

      expect(() => plantService.updatePlant('1', invalidData as any)).toThrow();
    });

    it('should keep existing fields unchanged', () => {
      const existingPlant: Plant = {
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

      db.getPlantById = () => existingPlant;

      const updateData = {
        name: 'Updated Name',
        species: 'Updated Species',
      };

      const updated = plantService.updatePlant('1', updateData);

      expect(updated!.name).toBe('Updated Name');
      expect(updated!.species).toBe('Updated Species');
      expect(updated!.location).toBe('Original Location');
    });

    it('should update createdAt on update', () => {
      const existingPlant: Plant = {
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

      db.getPlantById = () => existingPlant;

      const updateData = {
        name: 'Updated',
      };

      const updated = plantService.updatePlant('1', updateData);

      expect(updated!.name).toBe('Updated');
      expect(updated!.updatedAt).not.toBe(existingPlant.updatedAt);
    });
  });

  describe('deletePlant', () => {
    it('should delete an existing plant', () => {
      const existingPlant: Plant = {
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

      db.deletePlant = () => true;

      const deleted = plantService.deletePlant('1');
      expect(deleted).toBe(true);
    });

    it('should return false for non-existent plant', () => {
      db.deletePlant = () => false;

      const deleted = plantService.deletePlant('non-existent-id');
      expect(deleted).toBe(false);
    });
  });
});
