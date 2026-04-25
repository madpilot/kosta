import { z } from 'zod';

export const PlantSchema = z.object({
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

export type Plant = z.infer<typeof PlantSchema>;

export const CreatePlantInputSchema = PlantSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).partial({
  plantedDate: true,
  lastWatered: true,
  lastFertilized: true,
  harvestDate: true,
});

export type CreatePlantInput = z.infer<typeof CreatePlantInputSchema>;

export const UpdatePlantInputSchema = CreatePlantInputSchema.partial();

export type UpdatePlantInput = z.infer<typeof UpdatePlantInputSchema>;

export const CalendarEventSchema = z.object({
  id: z.string().uuid(),
  plantId: z.string().uuid(),
  type: z.enum(['water', 'fertilize', 'harvest', 'other']),
  date: z.string().datetime(),
  notes: z.string().max(5000).optional(),
  completed: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type CalendarEvent = z.infer<typeof CalendarEventSchema>;

export const CreateCalendarEventInputSchema = CalendarEventSchema.omit({
  id: true,
  completed: true,
  createdAt: true,
  updatedAt: true,
});

export type CreateCalendarEventInput = z.infer<typeof CreateCalendarEventInputSchema>;

export const UpdateCalendarEventInputSchema = CreateCalendarEventInputSchema.partial();

export type UpdateCalendarEventInput = z.infer<typeof UpdateCalendarEventInputSchema>;

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
    '/api/calendar': {
      get: {
        summary: 'List all calendar events',
        description: 'Returns all calendar events',
        operationId: 'listCalendarEvents',
        responses: {
          200: {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: CalendarEventSchema,
                },
              },
            },
          },
        },
      },
      post: {
        summary: 'Create a new calendar event',
        description: 'Add a new calendar event',
        operationId: 'createCalendarEvent',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: CreateCalendarEventInputSchema,
            },
          },
        },
        responses: {
          201: {
            description: 'Calendar event created',
            content: {
              'application/json': {
                schema: CalendarEventSchema,
              },
            },
          },
          400: {
            description: 'Invalid input',
          },
        },
      },
    },
    '/api/calendar/today': {
      get: {
        summary: 'Get today\'s events',
        description: 'Returns all calendar events for today',
        operationId: 'getTodayEvents',
        responses: {
          200: {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: CalendarEventSchema,
                },
              },
            },
          },
        },
      },
    },
    '/api/calendar/week': {
      get: {
        summary: 'Get this week\'s events',
        description: 'Returns all calendar events for the current week',
        operationId: 'getWeekEvents',
        responses: {
          200: {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: CalendarEventSchema,
                },
              },
            },
          },
        },
      },
    },
    '/api/calendar/month': {
      get: {
        summary: 'Get this month\'s events',
        description: 'Returns all calendar events for the current month',
        operationId: 'getMonthEvents',
        responses: {
          200: {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: CalendarEventSchema,
                },
              },
            },
          },
        },
      },
    },
    '/api/calendar/upcoming': {
      get: {
        summary: 'Get upcoming events',
        description: 'Returns upcoming calendar events',
        operationId: 'getUpcomingEvents',
        parameters: [
          {
            name: 'limit',
            in: 'query',
            required: false,
            schema: {
              type: 'integer',
              default: 7,
            },
          },
        ],
        responses: {
          200: {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: CalendarEventSchema,
                },
              },
            },
          },
        },
      },
    },
    '/api/calendar/plants/:plantId': {
      get: {
        summary: 'Get events by plant',
        description: 'Returns all calendar events for a specific plant',
        operationId: 'getPlantEvents',
        parameters: [
          {
            name: 'plantId',
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
                schema: {
                  type: 'array',
                  items: CalendarEventSchema,
                },
              },
            },
          },
        },
      },
    },
    '/api/calendar/date/:date': {
      get: {
        summary: 'Get events by date',
        description: 'Returns all calendar events for a specific date',
        operationId: 'getDateEvents',
        parameters: [
          {
            name: 'date',
            in: 'path',
            required: true,
            schema: {
              type: 'string',
              format: 'date',
            },
          },
        ],
        responses: {
          200: {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: CalendarEventSchema,
                },
              },
            },
          },
        },
      },
    },
    '/api/calendar/type/:type': {
      get: {
        summary: 'Get events by type',
        description: 'Returns calendar events of a specific type',
        operationId: 'getTypeEvents',
        parameters: [
          {
            name: 'type',
            in: 'path',
            required: true,
            schema: {
              type: 'string',
              enum: ['water', 'fertilize', 'harvest', 'other'],
            },
          },
        ],
        responses: {
          200: {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: CalendarEventSchema,
                },
              },
            },
          },
        },
      },
    },
    '/api/calendar/daily-schedule/:date': {
      get: {
        summary: 'Get daily schedule',
        description: 'Returns a detailed schedule of events for a specific date',
        operationId: 'getDailySchedule',
        parameters: [
          {
            name: 'date',
            in: 'path',
            required: true,
            schema: {
              type: 'string',
              format: 'date',
            },
          },
        ],
        responses: {
          200: {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    event: CalendarEventSchema,
                    type: z.literal('upcoming').or(z.literal('past')),
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/calendar/:id': {
      get: {
        summary: 'Get a calendar event by ID',
        description: 'Returns a specific calendar event',
        operationId: 'getCalendarEvent',
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
                schema: CalendarEventSchema,
              },
            },
          },
          404: {
            description: 'Calendar event not found',
          },
        },
      },
      put: {
        summary: 'Update a calendar event',
        description: 'Update an existing calendar event',
        operationId: 'updateCalendarEvent',
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
              schema: UpdateCalendarEventInputSchema,
            },
          },
        },
        responses: {
          200: {
            description: 'Calendar event updated',
            content: {
              'application/json': {
                schema: CalendarEventSchema,
              },
            },
          },
          404: {
            description: 'Calendar event not found',
          },
        },
      },
      delete: {
        summary: 'Delete a calendar event',
        description: 'Remove a calendar event',
        operationId: 'deleteCalendarEvent',
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
            description: 'Calendar event deleted',
          },
          404: {
            description: 'Calendar event not found',
          },
        },
      },
    },
    '/api/calendar/:id/complete': {
      patch: {
        summary: 'Complete a calendar event',
        description: 'Mark a calendar event as completed',
        operationId: 'completeCalendarEvent',
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
            description: 'Calendar event marked as completed',
          },
          404: {
            description: 'Calendar event not found',
          },
        },
      },
    },
  },
};

export { PlantSchema, CreatePlantInputSchema, UpdatePlantInputSchema, CalendarEventSchema, CreateCalendarEventInputSchema, UpdateCalendarEventInputSchema };