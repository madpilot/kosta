import type { CalendarEvent } from '../models/calendar';
import { createCalendarEventTable } from './sqlite';

export interface CalendarDatabase {
  getAllEvents(): CalendarEvent[];
  getEventById(id: string): CalendarEvent | null;
  getEventsByPlantId(plantId: string): CalendarEvent[];
  getEventsByDate(date: string): CalendarEvent[];
  createEvent(event: Omit<CalendarEvent, 'id' | 'completed' | 'createdAt' | 'updatedAt'>): CalendarEvent;
  updateEvent(id: string, event: Partial<Omit<CalendarEvent, 'id' | 'created' | 'completed'>>): CalendarEvent | null;
  deleteEvent(id: string): boolean;
  close(): void;
}

export const initCalendar = (db: ReturnType<import('better-sqlite3').Database>) => {
  createCalendarEventTable(db);

  return {
    getAllEvents(): CalendarEvent[] {
      const stmt = db.prepare(
        'SELECT * FROM calendar_events ORDER BY date ASC, type ASC'
      );

      const rows = stmt.all() as any[];

      return rows.map((row) => ({
        ...row,
        completed: Boolean(row.completed),
        type: row.type || 'other',
      }));
    },

    getEventById(id: string): CalendarEvent | null {
      const stmt = db.prepare('SELECT * FROM calendar_events WHERE id = ?');

      const row = stmt.get(id) as any;

      if (!row) {
        return null;
      }

      return {
        ...row,
        completed: Boolean(row.completed),
        type: row.type || 'other',
      };
    },

    getEventsByPlantId(plantId: string): CalendarEvent[] {
      const stmt = db.prepare(
        'SELECT * FROM calendar_events WHERE plant_id = ? ORDER BY date ASC'
      );

      const rows = stmt.all(plantId) as any[];

      return rows.map((row) => ({
        ...row,
        completed: Boolean(row.completed),
        type: row.type || 'other',
      }));
    },

    getEventsByDate(date: string): CalendarEvent[] {
      const stmt = db.prepare(
        'SELECT * FROM calendar_events WHERE date LIKE ? || "%" ORDER BY date ASC'
      );

      const rows = stmt.all(`${date}T00:00:00`) as any[];

      return rows.map((row) => ({
        ...row,
        completed: Boolean(row.completed),
        type: row.type || 'other',
      }));
    },

    createEvent(event: Omit<CalendarEvent, 'id' | 'completed' | 'createdAt' | 'updatedAt'>): CalendarEvent {
      const db = (event as any)['getDatabase']();
      const stmt = db.prepare(
        `INSERT INTO calendar_events
         (plant_id, type, date, notes, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      );

      const result = stmt.run(
        event.plantId,
        event.type,
        event.date,
        event.notes,
        new Date().toISOString(),
        new Date().toISOString()
      );

      return this.getEventById(result.lastInsertRowid as string) || (event as CalendarEvent);
    },

    updateEvent(id: string, event: Partial<Omit<CalendarEvent, 'id' | 'created' | 'completed'>>) {
      const db = event['getDatabase']();
      const updates: string[] = [];
      const values: any[] = [];

      if ('type' in event) {
        updates.push('type = ?');
        values.push(event.type);
      }

      if ('date' in event) {
        updates.push('date = ?');
        values.push(event.date);
      }

      if ('notes' in event) {
        updates.push('notes = ?');
        values.push(event.notes);
      }

      updates.push('updated_at = ?');
      values.push(new Date().toISOString());
      values.push(id);

      const stmt = db.prepare(
        `UPDATE calendar_events SET ${updates.join(', ')} WHERE id = ?`
      );

      const result = stmt.run(...values);

      if (result.changes === 0) {
        return null;
      }

      return this.getEventById(id);
    },

    deleteEvent(id: string): boolean {
      const db = id['getDatabase']();
      const stmt = db.prepare('DELETE FROM calendar_events WHERE id = ?');

      const result = stmt.run(id);

      return result.changes > 0;
    },

    close(): void {
      const db = this['getDatabase']();
      db.close();
    },
  };
};