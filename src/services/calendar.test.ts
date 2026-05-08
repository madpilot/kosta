import { unlinkSync } from 'fs';
import path from 'path';

import { createCalendarService } from './calendar';
import { createSqliteDatabase } from '../db/sqlite';

describe('Calendar Service date filters', () => {
  let dbFile: string;
  let database: ReturnType<typeof createSqliteDatabase>;
  let plantId: string;
  let getCalendarEventsBetweenSpy: jest.SpyInstance;

  beforeEach(() => {
    dbFile = path.join(__dirname, `cal_${Date.now()}_${Math.random().toString(36).slice(2)}.db`);
    database = createSqliteDatabase(dbFile);
    const plant = database.createPlant({ name: 'Basil', species: 'Ocimum basilicum' });
    plantId = plant.id;
    getCalendarEventsBetweenSpy = jest.spyOn(database, 'getCalendarEventsBetween');
  });

  afterEach(() => {
    getCalendarEventsBetweenSpy.mockRestore();
    database.close();
    for (const suffix of ['', '-wal', '-shm']) {
      try {
        unlinkSync(`${dbFile}${suffix}`);
      } catch {
        /* ignore */
      }
    }
  });

  it('uses the user timezone to compute "today" boundaries', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-05-08T15:00:00.000Z'));
    try {
      const service = createCalendarService(database);
      // 2026-05-08T15:00Z is 2026-05-09 01:00 in Australia/Sydney (+10).
      service.getEventsForToday('Australia/Sydney');
      expect(getCalendarEventsBetweenSpy).toHaveBeenCalledWith(
        '2026-05-08T14:00:00.000Z',
        '2026-05-09T14:00:00.000Z',
      );
    } finally {
      jest.useRealTimers();
    }
  });

  it('pushes the week range into SQL', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-05-08T12:00:00.000Z'));
    try {
      const service = createCalendarService(database);
      service.getEventsForWeek('UTC');
      // 2026-05-08 is a Friday, so week starts Sunday 2026-05-03.
      expect(getCalendarEventsBetweenSpy).toHaveBeenCalledWith(
        '2026-05-03T00:00:00.000Z',
        '2026-05-10T00:00:00.000Z',
      );
    } finally {
      jest.useRealTimers();
    }
  });

  it('pushes the month range into SQL', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-05-08T12:00:00.000Z'));
    try {
      const service = createCalendarService(database);
      service.getEventsForMonth('UTC');
      expect(getCalendarEventsBetweenSpy).toHaveBeenCalledWith(
        '2026-05-01T00:00:00.000Z',
        '2026-06-01T00:00:00.000Z',
      );
    } finally {
      jest.useRealTimers();
    }
  });

  it('returns events that fall inside the day in the supplied timezone', () => {
    // System clock at 2026-05-08T15:00Z is 2026-05-09 01:00 in Sydney (+10),
    // so Sydney's "today" is 2026-05-09 and UTC's is still 2026-05-08.
    // An event at 2026-05-09T05:00Z (Sydney 15:00 on 2026-05-09) falls in
    // Sydney's today but not UTC's today.
    const eventDate = '2026-05-09T05:00:00.000Z';
    database.createCalendarEvent({ plantId, type: 'water', date: eventDate });

    jest.useFakeTimers().setSystemTime(new Date('2026-05-08T15:00:00.000Z'));
    try {
      const service = createCalendarService(database);
      const sydney = service.getEventsForToday('Australia/Sydney');
      const utc = service.getEventsForToday('UTC');
      expect(sydney.map((e) => e.date)).toContain(eventDate);
      expect(utc.map((e) => e.date)).not.toContain(eventDate);
    } finally {
      jest.useRealTimers();
    }
  });

  it('falls back to UTC when timezone is omitted or invalid', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-05-08T12:00:00.000Z'));
    try {
      const service = createCalendarService(database);
      service.getEventsForToday();
      service.getEventsForToday('Not/A_Real_Zone');
      const utcCall: [string, string] = [
        '2026-05-08T00:00:00.000Z',
        '2026-05-09T00:00:00.000Z',
      ];
      expect(getCalendarEventsBetweenSpy).toHaveBeenNthCalledWith(1, ...utcCall);
      expect(getCalendarEventsBetweenSpy).toHaveBeenNthCalledWith(2, ...utcCall);
    } finally {
      jest.useRealTimers();
    }
  });
});
