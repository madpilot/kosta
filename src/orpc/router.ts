import { os } from '@orpc/server';
import { z } from 'zod';
import { PlantSchema, CreatePlantInputSchema, UpdatePlantInputSchema } from '../models/plant';
import { CalendarEventSchema, CreateCalendarEventInputSchema, UpdateCalendarEventInputSchema } from '../models/calendar';
import { UserSchema, LoginInputSchema, ChangePasswordInputSchema } from '../models/user';

const PublicUserSchema = UserSchema.omit({ passwordHash: true, resetToken: true, resetTokenExpiry: true });

export const router = {
  plants: {
    list: os
      .route({ method: 'GET', path: '/api/plants', summary: 'List all plants', description: 'Returns a list of all plants in the garden', tags: ['Plants'] })
      .output(z.array(PlantSchema))
      .handler(() => []),

    get: os
      .route({ method: 'GET', path: '/api/plants/{id}', summary: 'Get a plant by ID', description: 'Returns a single plant', tags: ['Plants'] })
      .input(z.object({ id: z.string().uuid() }))
      .output(PlantSchema)
      .handler(async () => { throw new Error('stub'); }),

    create: os
      .route({ method: 'POST', path: '/api/plants', summary: 'Create a new plant', description: 'Add a new plant to the garden', successStatus: 201, tags: ['Plants'] })
      .input(CreatePlantInputSchema)
      .output(PlantSchema)
      .handler(async () => { throw new Error('stub'); }),

    update: os
      .route({ method: 'PUT', path: '/api/plants/{id}', summary: 'Update a plant', description: 'Update an existing plant', tags: ['Plants'] })
      .input(UpdatePlantInputSchema.extend({ id: z.string().uuid() }))
      .output(PlantSchema)
      .handler(async () => { throw new Error('stub'); }),

    delete: os
      .route({ method: 'DELETE', path: '/api/plants/{id}', summary: 'Delete a plant', description: 'Remove a plant from the garden', tags: ['Plants'] })
      .input(z.object({ id: z.string().uuid() }))
      .output(z.object({ success: z.boolean() }))
      .handler(async () => { throw new Error('stub'); }),
  },

  calendar: {
    list: os
      .route({ method: 'GET', path: '/api/calendar', summary: 'List all calendar events', description: 'Returns all calendar events', tags: ['Calendar'] })
      .output(z.array(CalendarEventSchema))
      .handler(() => []),

    today: os
      .route({ method: 'GET', path: '/api/calendar/today', summary: "Get today's events", description: 'Returns all calendar events for today', tags: ['Calendar'] })
      .output(z.array(CalendarEventSchema))
      .handler(() => []),

    week: os
      .route({ method: 'GET', path: '/api/calendar/week', summary: "Get this week's events", description: 'Returns all calendar events for the current week', tags: ['Calendar'] })
      .output(z.array(CalendarEventSchema))
      .handler(() => []),

    month: os
      .route({ method: 'GET', path: '/api/calendar/month', summary: "Get this month's events", description: 'Returns all calendar events for the current month', tags: ['Calendar'] })
      .output(z.array(CalendarEventSchema))
      .handler(() => []),

    upcoming: os
      .route({ method: 'GET', path: '/api/calendar/upcoming', summary: 'Get upcoming events', description: 'Returns upcoming calendar events', tags: ['Calendar'] })
      .input(z.object({ limit: z.number().int().optional().default(7) }))
      .output(z.array(CalendarEventSchema))
      .handler(() => []),

    byPlant: os
      .route({ method: 'GET', path: '/api/calendar/plants/{plantId}', summary: 'Get events by plant', description: 'Returns all calendar events for a specific plant', tags: ['Calendar'] })
      .input(z.object({ plantId: z.string().uuid() }))
      .output(z.array(CalendarEventSchema))
      .handler(() => []),

    byDate: os
      .route({ method: 'GET', path: '/api/calendar/date/{date}', summary: 'Get events by date', description: 'Returns all calendar events for a specific date', tags: ['Calendar'] })
      .input(z.object({ date: z.string() }))
      .output(z.array(CalendarEventSchema))
      .handler(() => []),

    byType: os
      .route({ method: 'GET', path: '/api/calendar/type/{type}', summary: 'Get events by type', description: 'Returns calendar events of a specific type', tags: ['Calendar'] })
      .input(z.object({ type: z.enum(['water', 'fertilize', 'harvest', 'other']) }))
      .output(z.array(CalendarEventSchema))
      .handler(() => []),

    dailySchedule: os
      .route({ method: 'GET', path: '/api/calendar/daily-schedule/{date}', summary: 'Get daily schedule', description: 'Returns a detailed schedule of events for a specific date', tags: ['Calendar'] })
      .input(z.object({ date: z.string() }))
      .output(z.array(z.object({ event: CalendarEventSchema, status: z.enum(['upcoming', 'past']) })))
      .handler(() => []),

    get: os
      .route({ method: 'GET', path: '/api/calendar/{id}', summary: 'Get a calendar event by ID', description: 'Returns a specific calendar event', tags: ['Calendar'] })
      .input(z.object({ id: z.string().uuid() }))
      .output(CalendarEventSchema)
      .handler(async () => { throw new Error('stub'); }),

    create: os
      .route({ method: 'POST', path: '/api/calendar', summary: 'Create a new calendar event', description: 'Add a new calendar event', successStatus: 201, tags: ['Calendar'] })
      .input(CreateCalendarEventInputSchema)
      .output(CalendarEventSchema)
      .handler(async () => { throw new Error('stub'); }),

    update: os
      .route({ method: 'PUT', path: '/api/calendar/{id}', summary: 'Update a calendar event', description: 'Update an existing calendar event', tags: ['Calendar'] })
      .input(UpdateCalendarEventInputSchema.extend({ id: z.string().uuid() }))
      .output(CalendarEventSchema)
      .handler(async () => { throw new Error('stub'); }),

    delete: os
      .route({ method: 'DELETE', path: '/api/calendar/{id}', summary: 'Delete a calendar event', description: 'Remove a calendar event', tags: ['Calendar'] })
      .input(z.object({ id: z.string().uuid() }))
      .output(z.object({ success: z.boolean() }))
      .handler(async () => { throw new Error('stub'); }),

    complete: os
      .route({ method: 'PATCH', path: '/api/calendar/{id}/complete', summary: 'Complete a calendar event', description: 'Mark a calendar event as completed', tags: ['Calendar'] })
      .input(z.object({ id: z.string().uuid() }))
      .output(z.object({ success: z.boolean() }))
      .handler(async () => { throw new Error('stub'); }),
  },

  auth: {
    login: os
      .route({ method: 'POST', path: '/api/auth/login', summary: 'User login', description: 'Authenticate a user with username and password', tags: ['Auth'] })
      .input(LoginInputSchema)
      .output(z.object({ user: PublicUserSchema, token: z.string() }))
      .handler(async () => { throw new Error('stub'); }),

    passwordReset: os
      .route({ method: 'POST', path: '/api/auth/password-reset', summary: 'Initiate password reset', description: 'Send a password reset email to the user', tags: ['Auth'] })
      .input(z.object({ email: z.string().email() }))
      .output(z.object({ success: z.boolean(), message: z.string() }))
      .handler(async () => { throw new Error('stub'); }),

    resetPassword: os
      .route({ method: 'POST', path: '/api/auth/reset-password', summary: 'Reset password with token', description: 'Reset password using a reset token sent via email', tags: ['Auth'] })
      .input(z.object({ token: z.string(), newPassword: z.string().min(8) }))
      .output(z.object({ success: z.boolean(), message: z.string() }))
      .handler(async () => { throw new Error('stub'); }),

    changePassword: os
      .route({ method: 'POST', path: '/api/auth/change-password', summary: 'Change password', description: 'Change current user password', tags: ['Auth'] })
      .input(ChangePasswordInputSchema)
      .output(z.object({ success: z.boolean(), message: z.string() }))
      .handler(async () => { throw new Error('stub'); }),
  },

  user: {
    profile: os
      .route({ method: 'GET', path: '/api/user/profile', summary: 'Get user profile', description: 'Get current authenticated user profile', tags: ['User'] })
      .output(PublicUserSchema)
      .handler(async () => { throw new Error('stub'); }),
  },
};
