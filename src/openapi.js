"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdatePlantInputSchema = exports.CreatePlantInputSchema = exports.PlantSchema = exports.openApiSpec = void 0;
const zod_1 = require("zod");
const PlantSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    name: zod_1.z.string().min(1).max(255),
    species: zod_1.z.string().min(1).max(255),
    location: zod_1.z.string().max(255).optional(),
    plantedDate: zod_1.z.string().datetime().optional(),
    lastWatered: zod_1.z.string().datetime().optional(),
    wateringFrequency: zod_1.z.number().int().min(1).optional(),
    lastFertilized: zod_1.z.string().datetime().optional(),
    fertilizingFrequency: zod_1.z.number().int().min(1).optional(),
    notes: zod_1.z.string().optional(),
    sunlightRequirement: zod_1.z.enum(['full-sun', 'partial-shade', 'shade']).optional(),
    soilType: zod_1.z.string().max(100).optional(),
    harvestDate: zod_1.z.string().datetime().optional(),
    createdAt: zod_1.z.string().datetime(),
    updatedAt: zod_1.z.string().datetime(),
});
exports.PlantSchema = PlantSchema;
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
exports.CreatePlantInputSchema = CreatePlantInputSchema;
const UpdatePlantInputSchema = CreatePlantInputSchema.partial();
exports.UpdatePlantInputSchema = UpdatePlantInputSchema;
exports.openApiSpec = {
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
//# sourceMappingURL=openapi.js.map