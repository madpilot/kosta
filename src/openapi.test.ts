import { expect } from 'vitest';
import { openApiSpec, PlantSchema, CreatePlantInputSchema, UpdatePlantInputSchema } from '../openapi';
import type { Plant, CreatePlantInput, UpdatePlantInput } from '../models/plant';

interface OpenAPISpec {
  openapi: string;
  info: {
    title: string;
    description: string;
    version: string;
  };
  servers: Array<{
    url: string;
    description: string;
  }>;
  paths: Record<string, any>;
}

describe('OpenAPI Specification', () => {
  describe('openApiSpec Structure', () => {
    it('should be an object', () => {
      expect(typeof openApiSpec).toBe('object');
    });

    it('should have openapi version', () => {
      expect(openApiSpec.openapi).toBe('3.0.3');
    });

    it('should have info object', () => {
      expect(openApiSpec.info).toBeDefined();
      expect(typeof openApiSpec.info).toBe('object');
    });

    it('should have title', () => {
      expect(openApiSpec.info.title).toBe('Garden Agent API');
    });

    it('should have description', () => {
      expect(openApiSpec.info.description).toBe('API for managing garden plants and scheduling');
    });

    it('should have version', () => {
      expect(openApiSpec.info.version).toBe('1.0.0');
    });

    it('should have servers array', () => {
      expect(Array.isArray(openApiSpec.servers)).toBe(true);
      expect(openApiSpec.servers.length).toBeGreaterThan(0);
    });

    it('should have at least one server URL', () => {
      const serverUrl = openApiSpec.servers['0'].url || openApiSpec.servers[0].url;
      expect(serverUrl).toBe('http://localhost:3000');
    });

    it('should have paths object', () => {
      expect(openApiSpec.paths).toBeDefined();
      expect(typeof openApiSpec.paths).toBe('object');
    });

    it('should have /api/plants path', () => {
      expect(openApiSpec.paths).toHaveProperty('/api/plants');
    });

    it('should have /api/plants/{id} path', () => {
      expect(openApiSpec.paths).toHaveProperty('/api/plants/{id}');
    });

    it('should have GET method for /api/plants', () => {
      const plantsPath = openApiSpec.paths['/api/plants'].get;
      expect(plantsPath).toBeDefined();
      expect(plantsPath.summary).toBe('List all plants');
    });

    it('should have POST method for /api/plants', () => {
      const plantsPath = openApiSpec.paths['/api/plants'].post;
      expect(plantsPath).toBeDefined();
      expect(plantsPath.summary).toBe('Create a new plant');
    });

    it('should have GET, PUT, DELETE methods for /api/plants/{id}', () => {
      const plantsPath = openApiSpec.paths['/api/plants/{id}'];
      expect(plantsPath.get).toBeDefined();
      expect(plantsPath.put).toBeDefined();
      expect(plantsPath.delete).toBeDefined();
    });
  });

  describe('Schema Exports', () => {
    it('should export PlantSchema', () => {
      expect(typeof PlantSchema).toBe('object');
      expect(PlantSchema.safeParse).toBeDefined();
    });

    it('should export CreatePlantInputSchema', () => {
      expect(typeof CreatePlantInputSchema).toBe('object');
      expect(CreatePlantInputSchema.safeParse).toBeDefined();
    });

    it('should export UpdatePlantInputSchema', () => {
      expect(typeof UpdatePlantInputSchema).toBe('object');
      expect(UpdatePlantInputSchema.safeParse).toBeDefined();
    });
  });

  describe('Plant Schema Consistency', () => {
    it('should have consistent PlantSchema with zod', () => {
      const plantData: Plant = {
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
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-20T10:30:00Z',
      };

      const result = PlantSchema.safeParse(plantData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data?.name).toBe('Sunflower');
      }
    });

    it('should have consistent CreatePlantInputSchema', () => {
      const plantData: CreatePlantInput = {
        name: 'Sunflower',
        species: 'Helianthus',
        location: 'Backyard Garden',
      };

      const result = CreatePlantInputSchema.safeParse(plantData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data?.name).toBe('Sunflower');
      }
    });

    it('should have consistent UpdatePlantInputSchema', () => {
      const plantData: UpdatePlantInput = {
        name: 'Sunflower',
        species: 'Helianthus',
      };

      const result = UpdatePlantInputSchema.safeParse(plantData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data?.name).toBe('Sunflower');
      }
    });
  });

  describe('OpenAPI Spec Response Schema', () => {
    it('should include plant schema in responses', () => {
      const plantsPostResponse = openApiSpec.paths['/api/plants'].post.responses['201'];
      expect(plantsPostResponse).toBeDefined();
      expect(plantsPostResponse.content?.['application/json']?.schema).toEqual(PlantSchema);
    });

    it('should include plant schema in get plant response', () => {
      const getPlantResponse = openApiSpec.paths['/api/plants/{id}'].get.responses['200'];
      expect(getPlantResponse).toBeDefined();
      expect(getPlantResponse.content?.['application/json']?.schema).toEqual(PlantSchema);
    });

    it('should include plant schema in update plant response', () => {
      const updatePlantResponse = openApiSpec.paths['/api/plants/{id}'].put.responses['200'];
      expect(updatePlantResponse).toBeDefined();
      expect(updatePlantResponse.content?.['application/json']?.schema).toEqual(PlantSchema);
    });

    it('should include plant schema in list plants response', () => {
      const listPlantsResponse = openApiSpec.paths['/api/plants'].get.responses['200'];
      expect(listPlantsResponse).toBeDefined();
      expect(listPlantsResponse.content?.['application/json']?.schema.items).toEqual(PlantSchema);
    });

    it('should include correct response codes', () => {
      const plantsPath = openApiSpec.paths['/api/plants'];
      expect(Object.keys(plantsPath.post.responses)).toEqual(['201', '400']);
      expect(Object.keys(plantsPath.get.responses)).toEqual(['200']);
    });
  });

  describe('OpenAPI Spec IDs, () => {
    it('should have unique operationId', () => {
      const getOperationId = openApiSpec.paths['/api/plants'].get.operationId;
      const postOperationId = openApiSpec.paths['/api/plants'].post.operationId;
      const updateOperationId = openApiSpec.paths['/api/plants/{id}'].put.operationId;

      expect(getOperationId).toBe('listPlants');
      expect(postOperationId).toBe('createPlant');
      expect(updateOperationId).toBe('updatePlant');
    });

    it('should have correct operationId for delete', () => {
      const deleteOperationId = openApiSpec.paths['/api/plants/{id}'].delete.operationId;
      expect(deleteOperationId).toBe('deletePlant');
    });
  });
});