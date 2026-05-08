import type {
  CalendarEvent,
  CreateCalendarEventInput,
  UpdateCalendarEventInput,
} from '../models/calendar';
import { CreateCalendarEventInputSchema, UpdateCalendarEventInputSchema } from '../models/calendar';
import type { CalendarDatabase } from '../models/calendar-db';
import type { UserDatabase } from '../db/index';
import { config } from '../config';
import {
  dayBoundariesUtc,
  getZonedDateString,
  monthBoundariesUtc,
  weekBoundariesUtc,
} from '../utils/timezone';

export interface CalendarService {
  getAllEvents(userId: string): CalendarEvent[];
  getEventById(userId: string, id: string): CalendarEvent | null;
  getEventsForToday(userId: string): CalendarEvent[];
  getEventsForWeek(userId: string): CalendarEvent[];
  getEventsForMonth(userId: string): CalendarEvent[];
  getUpcomingEvents(userId: string, limit?: number): CalendarEvent[];
  getEventsByPlant(userId: string, plantId: string): CalendarEvent[];
  getEventsByDate(userId: string, date: string): CalendarEvent[];
  getEventsByType(
    userId: string,
    type: 'water' | 'fertilize' | 'harvest' | 'other',
  ): CalendarEvent[];
  createEvent(userId: string, event: CreateCalendarEventInput): CalendarEvent;
  updateEvent(
    userId: string,
    id: string,
    event: UpdateCalendarEventInput,
  ): CalendarEvent | null;
  deleteEvent(userId: string, id: string): boolean;
  completeEvent(userId: string, id: string): boolean;
  getDailySchedule(
    userId: string,
    date: string,
  ): Array<{
    event: CalendarEvent;
    type: 'upcoming' | 'past';
  }>;
}

export type CalendarServiceDb = CalendarDatabase & Pick<UserDatabase, 'getUserById'>;

const userTimezone = (db: CalendarServiceDb, userId: string): string => {
  const user = db.getUserById(userId);
  return user?.timezone || config.user.timezone || 'UTC';
};

export function createCalendarService(db: CalendarServiceDb): CalendarService {
  const service: CalendarService = {
    getAllEvents(userId: string): CalendarEvent[] {
      return db.getAllCalendarEvents(userId);
    },

    getEventById(userId: string, id: string): CalendarEvent | null {
      return db.getCalendarEventById(userId, id);
    },

    getEventsForToday(userId: string): CalendarEvent[] {
      const tz = userTimezone(db, userId);
      const today = getZonedDateString(new Date(), tz);
      const { start, end } = dayBoundariesUtc(today, tz);
      return db.getCalendarEventsInRange(userId, start, end);
    },

    getEventsForWeek(userId: string): CalendarEvent[] {
      const tz = userTimezone(db, userId);
      const { start, end } = weekBoundariesUtc(new Date(), tz);
      return db.getCalendarEventsInRange(userId, start, end);
    },

    getEventsForMonth(userId: string): CalendarEvent[] {
      const tz = userTimezone(db, userId);
      const { start, end } = monthBoundariesUtc(new Date(), tz);
      return db.getCalendarEventsInRange(userId, start, end);
    },

    getUpcomingEvents(userId: string, limit = 7): CalendarEvent[] {
      return db.getUpcomingCalendarEvents(userId, new Date().toISOString(), limit);
    },

    getEventsByPlant(userId: string, plantId: string): CalendarEvent[] {
      return db.getCalendarEventsByPlant(userId, plantId);
    },

    getEventsByDate(userId: string, date: string): CalendarEvent[] {
      // `date` is treated as a literal prefix on the event's stored ISO string,
      // matching the legacy behaviour for callers that pass YYYY-MM-DD.
      return db.getCalendarEventsByDatePrefix(userId, date);
    },

    getEventsByType(
      userId: string,
      type: 'water' | 'fertilize' | 'harvest' | 'other',
    ): CalendarEvent[] {
      return db.getCalendarEventsByType(userId, type);
    },

    createEvent(userId: string, event: CreateCalendarEventInput): CalendarEvent {
      const validated = CreateCalendarEventInputSchema.parse(event);
      return db.createCalendarEvent(userId, validated);
    },

    updateEvent(
      userId: string,
      id: string,
      event: UpdateCalendarEventInput,
    ): CalendarEvent | null {
      const validated = UpdateCalendarEventInputSchema.parse(event);
      return db.updateCalendarEvent(userId, id, validated);
    },

    deleteEvent(userId: string, id: string): boolean {
      return db.deleteCalendarEvent(userId, id);
    },

    completeEvent(userId: string, id: string): boolean {
      return service.updateEvent(userId, id, { completed: true }) !== null;
    },

    getDailySchedule(userId: string, date: string) {
      const events = service.getEventsByDate(userId, date);
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
