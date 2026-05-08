import type { CalendarEvent } from './calendar';

export interface CalendarDatabase {
  getAllCalendarEvents(): CalendarEvent[];
  getCalendarEventById(id: string): CalendarEvent | null;
  getCalendarEventsBetween(startInclusive: string, endExclusive: string): CalendarEvent[];
  createCalendarEvent(
    event: Omit<CalendarEvent, 'id' | 'completed' | 'createdAt' | 'updatedAt'>,
  ): CalendarEvent;
  updateCalendarEvent(
    id: string,
    event: Partial<Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>>,
  ): CalendarEvent | null;
  deleteCalendarEvent(id: string): boolean;
}
