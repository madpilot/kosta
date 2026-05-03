import { z } from 'zod';
import type { CalendarEvent, CreateCalendarEventInput, UpdateCalendarEventInput } from '../models/calendar';
import type { CalendarDatabase } from '../models/calendar-db';

const CreateCalendarEventSchema = z.object({
  plantId: z.string().uuid(),
  type: z.enum(['water', 'fertilize', 'harvest', 'other']),
  date: z.string().datetime(),
  notes: z.string().max(5000).optional(),
});

const UpdateCalendarEventSchema = CreateCalendarEventSchema.partial();

export interface CalendarService {
  getAllEvents(): CalendarEvent[];
  getEventById(id: string): CalendarEvent | null;
  getEventsForToday(): CalendarEvent[];
  getEventsForWeek(): CalendarEvent[];
  getEventsForMonth(): CalendarEvent[];
  getUpcomingEvents(limit?: number): CalendarEvent[];
  getEventsByPlant(plantId: string): CalendarEvent[];
  getEventsByDate(date: string): CalendarEvent[];
  getEventsByType(type: 'water' | 'fertilize' | 'harvest' | 'other'): CalendarEvent[];
  createEvent(event: CreateCalendarEventInput): CalendarEvent;
  updateEvent(id: string, event: UpdateCalendarEventInput): CalendarEvent | null;
  deleteEvent(id: string): boolean;
  completeEvent(id: string): boolean;
  getDailySchedule(date: string): Array<{
    event: CalendarEvent;
    type: 'upcoming' | 'past';
  }>;
}

export function createCalendarService(db: CalendarDatabase): CalendarService {
  const service: CalendarService = {
    getAllEvents(): CalendarEvent[] {
      return db.getAllCalendarEvents();
    },

    getEventById(id: string): CalendarEvent | null {
      return db.getCalendarEventById(id);
    },

    getEventsForToday(): CalendarEvent[] {
      const today = new Date().toISOString().split('T')[0];
      return this.getEventsByDate(today);
    },

    getEventsForWeek(): CalendarEvent[] {
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 7);

      const start = startOfWeek.toISOString();
      const end = endOfWeek.toISOString();

      return this.getAllEvents().filter((event) => {
        if (!event.date) return false;
        const eventDate = new Date(event.date);
        return eventDate >= new Date(start) && eventDate <= new Date(end);
      });
    },

    getEventsForMonth(): CalendarEvent[] {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const start = startOfMonth.toISOString();
      const end = endOfMonth.toISOString();

      return this.getAllEvents().filter((event) => {
        if (!event.date) return false;
        const eventDate = new Date(event.date);
        return eventDate >= new Date(start) && eventDate <= new Date(end);
      });
    },

    getUpcomingEvents(limit = 7): CalendarEvent[] {
      return this.getAllEvents()
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, limit)
        .filter((event) => !event.completed);
    },

    getEventsByPlant(plantId: string): CalendarEvent[] {
      return this.getAllEvents().filter((event) => event.plantId === plantId);
    },

    getEventsByDate(date: string): CalendarEvent[] {
      return this.getAllEvents().filter((event) => {
        if (!event.date) return false;
        return event.date.startsWith(date);
      });
    },

    getEventsByType(type: 'water' | 'fertilize' | 'harvest' | 'other'): CalendarEvent[] {
      return this.getAllEvents().filter((event) => event.type === type);
    },

    createEvent(event: CreateCalendarEventInput): CalendarEvent {
      const result = CreateCalendarEventSchema.safeParse(event);
      if (!result.success) {
        throw new Error('Invalid calendar event data');
      }
      return db.createCalendarEvent(result.data);
    },

    updateEvent(id: string, event: UpdateCalendarEventInput): CalendarEvent | null {
      const result = UpdateCalendarEventSchema.safeParse(event);
      if (!result.success) {
        throw new Error('Invalid calendar event data');
      }
      return db.updateCalendarEvent(id, result.data);
    },

    deleteEvent(id: string): boolean {
      return db.deleteCalendarEvent(id);
    },

    completeEvent(id: string): boolean {
      const event = this.getEventById(id);
      if (!event) return false;
      return db.updateCalendarEvent(id, { completed: true }) !== null;
    },

    getDailySchedule(date: string) {
      const events = this.getEventsByDate(date);
      const today = new Date().toISOString();

      const schedule: Array<{
        event: CalendarEvent;
        type: 'upcoming' | 'past';
      }> = [];

      for (const event of events) {
        const eventType = event.date >= today ? 'upcoming' : 'past';
        schedule.push({ event, type: eventType });
      }

      return schedule.sort((a, b) => {
        if (a.type === b.type) {
          return new Date(a.event.date).getTime() - new Date(b.event.date).getTime();
        }
        return a.type === 'upcoming' ? -1 : 1;
      });
    },
  };

  return service;
}
