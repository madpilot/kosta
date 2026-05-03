import { z } from 'zod';

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
