import type { CalendarEvent } from './calendar';

type CalendarEventType = CalendarEvent['type'];

export interface CalendarDatabase {
  getAllCalendarEvents(userId: string): CalendarEvent[];
  getCalendarEventById(userId: string, id: string): CalendarEvent | null;
  getCalendarEventsInRange(userId: string, startUtc: string, endUtc: string): CalendarEvent[];
  getCalendarEventsByDatePrefix(userId: string, datePrefix: string): CalendarEvent[];
  getCalendarEventsByPlant(userId: string, plantId: string): CalendarEvent[];
  getCalendarEventsByType(userId: string, type: CalendarEventType): CalendarEvent[];
  getUpcomingCalendarEvents(userId: string, nowIso: string, limit: number): CalendarEvent[];
  createCalendarEvent(
    userId: string,
    event: Omit<CalendarEvent, 'id' | 'completed' | 'createdAt' | 'updatedAt'>,
  ): CalendarEvent;
  updateCalendarEvent(
    userId: string,
    id: string,
    event: Partial<Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>>,
  ): CalendarEvent | null;
  deleteCalendarEvent(userId: string, id: string): boolean;
}
