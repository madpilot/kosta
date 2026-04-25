import { expect } from 'vitest';
import { PlantSchema, CreatePlantInputSchema, UpdatePlantInputSchema } from '../models/plant';

describe('Plant Model', () => {
  describe('PlantSchema', () => {
    it('should validate plant with all fields', () => {
      const validPlant = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Sunflower',
        species: 'Helianthus',
        location: 'Backyard Garden',
        plantedDate: '2024-01-15T10:30:00Z',
        lastWatered: '2024-01-20T10:30:00Z',
        wateringFrequency: 7,
        lastFertilized: '2024-01-15T10:30:00Z',
        fertilizingFrequency: 30,
        notes: 'Needs regular watering',
        sunlightRequirement: 'full-sun',
        soilType: 'Sandy',
        harvestDate: '2024-07-15T10:30:00Z',
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-20T10:30:00Z',
      };

      const result = PlantSchema.safeParse(validPlant);
      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('Sunflower');
    });

    it('should reject plant with invalid ID', () => {
      const invalidPlant = {
        id: 'not-a-uuid',
        name: 'Invalid ID Plant',
        species: 'Species',
        plantedDate: '2024-01-15T10:30:00Z',
        lastWatered: '2024-01-20T10:30:00Z',
        wateringFrequency: 7,
        lastFertilized: '2024-01-15T10:30:00Z',
        fertilizingFrequency: 30,
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-20T10:30:00Z',
      };

      const result = PlantSchema.safeParse(invalidPlant);
      expect(result.success).toBe(false);
    });

    it('should reject plant with empty name', () => {
      const invalidPlant = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: '',
        species: 'Species',
        plantedDate: '2024-01-15T10:30:00Z',
        lastWatered: '2024-01-20T10:30:00Z',
        wateringFrequency: 7,
        lastFertilized: '2024-01-15T10:30:00Z',
        fertilizingFrequency: 30,
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-20T10:30:00Z',
      };

      const result = PlantSchema.safeParse(invalidPlant);
      expect(result.success).toBe(false);
    });

    it('should reject plant with name exceeding 255 characters', () => {
      const invalidPlant = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'A'.repeat(256),
        species: 'Species',
        plantedDate: '2024-01-15T10:30:00Z',
        lastWatered: '2024-01-20T10:30:00Z',
        wateringFrequency: 7,
        lastFertilized: '2024-01-15T10:30:00Z',
        fertilizingFrequency: 30,
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-20T10:30:00Z',
      };

      const result = PlantSchema.safeParse(invalidPlant);
      expect(result.success).toBe(false);
    });

    it('should reject plant with species exceeding 255 characters', () => {
      const invalidPlant = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Normal Name',
        species: 'A'.repeat(256),
        plantedDate: '2024-01-15T10:30:00Z',
        lastWatered: '2024-01-20T10:30:00Z',
        wateringFrequency: 7,
        lastFertilized: '2024-01-15T10:30:00Z',
        fertilizingFrequency: 30,
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-20T10:30:00Z',
      };

      const result = PlantSchema.safeParse(invalidPlant);
      expect(result.success).toBe(false);
    });

    it('should reject plant with location exceeding 255 characters', () => {
      const invalidPlant = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Normal Name',
        species: 'Species',
        location: 'A'.repeat(256),
        plantedDate: '2024-01-15T10:30:00Z',
        lastWatered: '2024-01-20T10:30:00Z',
        wateringFrequency: 7,
        lastFertilized: '2024-01-15T10:30:00Z',
        fertilizingFrequency: 30,
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-20T10:30:00Z',
      };

      const result = PlantSchema.safeParse(invalidPlant);
      expect(result.success).toBe(false);
    });

    it('should reject plant with notes exceeding 50000 characters', () => {
      const invalidPlant = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Normal Name',
        species: 'Species',
        location: 'Normal Location',
        plantedDate: '2024-01-15T10:30:00Z',
        lastWatered: '2024-01-20T10:30:00Z',
        wateringFrequency: 7,
        lastFertilized: '2024-01-15T10:30:00Z',
        fertilizingFrequency: 30,
        notes: 'A'.repeat(50001),
        sunlightRequirement: 'full-sun',
        soilType: 'Sandy',
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-20T10:30:00Z',
      };

      const result = PlantSchema.safeParse(invalidPlant);
      expect(result.success).toBe(false);
    });

    it('should reject plant with invalid sunlightRequirement', () => {
      const invalidPlant = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Normal Name',
        species: 'Species',
        location: 'Normal Location',
        plantedDate: '2024-01-15T10:30:00Z',
        lastWatered: '2024-01-20T10:30:00Z',
        wateringFrequency: 7,
        lastFertilized: '2024-01-15T10:30:00Z',
        fertilizingFrequency: 30,
        notes: 'Test notes',
        sunlightRequirement: 'invalid-value',
        soilType: 'Sandy',
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-20T10:30:00Z',
      };

      const result = PlantSchema.safeParse(invalidPlant);
      expect(result.success).toBe(false);
    });

    it('should require id, name, species, and createdAt, updatedAt', () => {
      const invalidPlant = {
        name: 'Sunflower',
        species: 'Helianthus',
        location: 'Backyard Garden',
        plantedDate: '2024-01-15T10:30:00Z',
        lastWatered: '2024-01-20T10:30:00Z',
        wateringFrequency: 7,
        lastFertilized: '2024-01-15T10:30:00Z',
        fertilizingFrequency: 30,
        notes: 'Needs regular watering',
        sunlightRequirement: 'full-sun',
        soilType: 'Sandy',
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-20T10:30:00Z',
      };

      const result = PlantSchema.safeParse(invalidPlant);
      expect(result.success).toBe(false);
    });
  });

  describe('CreatePlantInputSchema', () => {
    it('should allow all required fields', () => {
      const validInput = {
        name: 'Sunflower',
        species: 'Helianthus',
        location: undefined,
        plantedDate: undefined,
        lastWatered: undefined,
        wateringFrequency: undefined,
        lastFertilized: undefined,
        fertilizingFrequency: undefined,
        notes: undefined,
        sunlightRequirement: undefined,
        soilType: undefined,
        harvestDate: undefined,
      };

      const result = CreatePlantInputSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('should not allow id, createdAt, or updatedAt', () => {
      const invalidInput = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Sunflower',
        species: 'Helianthus',
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-20T10:30:00Z',
      };

      const result = CreatePlantInputSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it('should only allow partial placement of optional datetime fields', () => {
      const validInput = {
        name: 'Sunflower',
        species: 'Helianthus',
        plantedDate: '2024-01-15T10:30:00Z',
        lastWatered: undefined,
        lastFertilized: undefined,
        harvestDate: undefined,
      };

      const result = CreatePlantInputSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('should reject id, createdAt, or updatedAt as any field', () => {
      const invalidInput = {
        name: 'Sunflower',
        species: 'Helianthus',
        id: '123e4567-e89b-12d3-a456-426614174000',
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-20T10:30:00Z',
      };

      const result = CreatePlantInputSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });
  });

  describe('UpdatePlantInputSchema', () => {
    it('should allow any optional field including all datetime fields', () => {
      const validInput = {
        name: 'Sunflower',
        species: undefined,
        location: undefined,
        plantedDate: '2024-01-15T10:30:00Z',
        lastWatered: '2024-01-20T10:30:00Z',
        wateringFrequency: 7,
        lastFertilized: '2024-01-15T10:30:00Z',
        fertilizingFrequency: 30,
        notes: undefined,
        sunlightRequirement: undefined,
        soilType: undefined,
        harvestDate: undefined,
      };

      const result = UpdatePlantInputSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('should allow empty object', () => {
      const validInput = {};

      const result = UpdatePlantInputSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('should allow all individual optional fields', () => {
      const validInput = {
        name: 'Sunflower',
        species: 'Helianthus',
        location: 'Backyard Garden',
        plantedDate: '2024-01-15T10:30:00Z',
        lastWatered: '2024-01-20T10:30:00Z',
        wateringFrequency: 7,
        lastFertilized: '2024-01-15T10:30:00Z',
        fertilizingFrequency: 30,
        notes: 'Needs regular watering',
        sunlightRequirement: 'full-sun',
        soilType: 'Sandy',
        harvestDate: '2024-07-15T10:30:00Z',
      };

      const result = UpdatePlantInputSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });
  });

  describe('Type inference', () => {
    it('should infer Plant type from PlantSchema', () => {
      const plant = PlantSchema.parse({
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Test Plant',
        species: 'Species',
        location: 'Location',
        plantedDate: '2024-01-15T10:30:00Z',
        lastWatered: '2024-01-20T10:30:00Z',
        wateringFrequency: 7,
        lastFertilized: '2024-01-15T10:30:00Z',
        fertilizingFrequency: 30,
        notes: 'Test notes',
        sunlightRequirement: 'full-sun',
        soilType: 'Sandy',
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-20T10:30:00Z',
      });

      expect(typeof plant.id).toBe('string');
      expect(typeof plant.name).toBe('string');
      expect(typeof plant.species).toBe('string');
      expect(typeof plant.location).toBe('string' || 'undefined');
      expect(typeof plant.createdAt).toBe('string');
      expect(typeof plant.updatedAt).toBe('string');
    });

    it('should infer CreatePlantInput type from CreatePlantInputSchema', () => {
      const plant = CreatePlantInputSchema.parse({
        name: 'Test Plant',
        species: 'Species',
      });

      expect((plant as any).id).toBeUndefined();
      expect((plant as any).createdAt).toBeUndefined();
      expect((plant as any).updatedAt).toBeUndefined();
    });

    it('should infer UpdatePlantInput type from UpdatePlantInputSchema', () => {
      const plant = UpdatePlantInputSchema.parse({
        name: 'Test Plant',
        species: 'Species',
      });

      expect(typeof plant.name).toBe('string' || 'undefined');
      expect(typeof plant.species).toBe('string' || 'undefined');
    });
  });
});