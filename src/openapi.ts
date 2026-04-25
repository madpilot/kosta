import { z } from 'zod';

const PlantSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255),
  species: z.string().min(1).max(255),
  location: z.string().max(255).optional(),
  plantedDate: z.string().datetime().optional(),
  lastWatered: z.string().datetime().optional(),
  wateringFrequency: z.number().int().min(1).optional(),
  lastFertilized: z.string().datetime().optional(),
  fertilizingFrequency: z.number().int().min(1).optional(),
  notes: z.string().optional(),
  sunlightRequirement: z.enum(['full-sun', 'partial-shade', 'shade']).optional(),
  soilType: z.string().max(100).optional(),
  harvestDate: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

const CreatePlantInputSchema = PlantSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).partial({
  plantedDate: true,
  lastWatered: true,
  lastFertilized: true,
  harvestDate: true,
});

const UpdatePlantInputSchema = CreatePlantInputSchema.partial();

export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Garden Agent API',
    description: 'API for managing garden plants and scheduling',
    version: '1.0.0',
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Development server',
    },
  ],
  paths: {
    '/api/plants': {
      get: {
        summary: 'List all plants',
        description: 'Returns a list of all plants in the garden',
        operationId: 'listPlants',
        responses: {
          200: {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: PlantSchema,
                },
              },
            },
          },
        },
      },
      post: {
        summary: 'Create a new plant',
        description: 'Add a new plant to the garden',
        operationId: 'createPlant',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: CreatePlantInputSchema,
            },
          },
        },
        responses: {
          201: {
            description: 'Plant created',
            content: {
              'application/json': {
                schema: PlantSchema,
              },
            },
          },
          400: {
            description: 'Invalid input',
          },
        },
      },
    },
    '/api/plants/{id}': {
      get: {
        summary: 'Get a plant by ID',
        description: 'Returns a single plant',
        operationId: 'getPlant',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: {
              type: 'string',
              format: 'uuid',
            },
          },
        ],
        responses: {
          200: {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: PlantSchema,
              },
            },
          },
          404: {
            description: 'Plant not found',
          },
        },
      },
      put: {
        summary: 'Update a plant',
        description: 'Update an existing plant',
        operationId: 'updatePlant',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: {
              type: 'string',
              format: 'uuid',
            },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: UpdatePlantInputSchema,
            },
          },
        },
        responses: {
          200: {
            description: 'Plant updated',
            content: {
              'application/json': {
                schema: PlantSchema,
              },
            },
          },
          404: {
            description: 'Plant not found',
          },
        },
      },
      delete: {
        summary: 'Delete a plant',
        description: 'Remove a plant from the garden',
        operationId: 'deletePlant',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: {
              type: 'string',
              format: 'uuid',
            },
          },
        ],
        responses: {
          200: {
            description: 'Plant deleted',
          },
          404: {
            description: 'Plant not found',
          },
        },
      },
    },
  },
};

export { PlantSchema, CreatePlantInputSchema, UpdatePlantInputSchema };
