import {
  PlantSchema,
  CreatePlantInputSchema,
  UpdatePlantInputSchema,
} from '@sprout/shared/schemas/plant';

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
      const result = PlantSchema.safeParse({
        id: 'not-a-uuid',
        name: 'Invalid ID Plant',
        species: 'Species',
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-20T10:30:00Z',
      });
      expect(result.success).toBe(false);
    });

    it('should reject plant with empty name', () => {
      const result = PlantSchema.safeParse({
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: '',
        species: 'Species',
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-20T10:30:00Z',
      });
      expect(result.success).toBe(false);
    });

    it('should reject plant with name exceeding 255 characters', () => {
      const result = PlantSchema.safeParse({
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'A'.repeat(256),
        species: 'Species',
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-20T10:30:00Z',
      });
      expect(result.success).toBe(false);
    });

    it('should reject plant with notes exceeding 50000 characters', () => {
      const result = PlantSchema.safeParse({
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Normal',
        species: 'Species',
        notes: 'A'.repeat(50001),
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-20T10:30:00Z',
      });
      expect(result.success).toBe(false);
    });

    it('should reject plant with invalid sunlightRequirement', () => {
      const result = PlantSchema.safeParse({
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Normal',
        species: 'Species',
        sunlightRequirement: 'invalid-value',
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-20T10:30:00Z',
      });
      expect(result.success).toBe(false);
    });

    it('should require id and timestamps', () => {
      const result = PlantSchema.safeParse({
        name: 'Sunflower',
        species: 'Helianthus',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('CreatePlantInputSchema', () => {
    it('should accept all required fields', () => {
      const result = CreatePlantInputSchema.safeParse({
        name: 'Sunflower',
        species: 'Helianthus',
      });
      expect(result.success).toBe(true);
    });

    it('should reject id, createdAt, or updatedAt', () => {
      const result = CreatePlantInputSchema.safeParse({
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Sunflower',
        species: 'Helianthus',
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-20T10:30:00Z',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('UpdatePlantInputSchema', () => {
    it('should allow empty object', () => {
      const result = UpdatePlantInputSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should allow individual fields', () => {
      const result = UpdatePlantInputSchema.safeParse({
        name: 'Sunflower',
        species: 'Helianthus',
      });
      expect(result.success).toBe(true);
    });
  });
});
