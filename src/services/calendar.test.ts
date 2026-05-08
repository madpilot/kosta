import { unlinkSync } from 'fs';
import path from 'path';
import { createCalendarService } from './calendar';
import { createSqliteDatabase } from '../db/sqlite';

describe('CalendarService', () => {
  let dbFile: string;
  let database: ReturnType<typeof createSqliteDatabase>;
  let userId: string;
  let plantId: string;

  beforeEach(() => {
    dbFile = path.join(
      __dirname,
      `calendar_${Date.now()}_${Math.random().toString(36).slice(2)}.db`,
    );
    database = createSqliteDatabase(dbFile);
    const user = database.createUser({
      username: 'tzuser',
      email: 'tz@example.com',
      name: 'TZ User',
      passwordHash: 'hash',
      timezone: 'Australia/Perth',
    });
    userId = user.id;
    const plant = database.createPlant(userId, { name: 'Basil', species: 'Ocimum basilicum' });
    plantId = plant.id;
  });

  afterEach(() => {
    database.close();
    for (const suffix of ['', '-wal', '-shm']) {
      try {
        unlinkSync(`${dbFile}${suffix}`);
      } catch {
        /* ignore */
      }
    }
  });

  it('getEventsForToday filters by the user’s timezone', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-05-08T03:00:00.000Z'));
    // 2026-05-08T03:00Z is 2026-05-08T11:00 in Australia/Perth, so "today" is 2026-05-08
    // local. The local-day window in UTC is [2026-05-07T16:00Z, 2026-05-08T16:00Z).

    const service = createCalendarService(database);

    // Falls inside the local day window:
    database.createCalendarEvent(userId, {
      plantId,
      type: 'water',
      date: '2026-05-08T08:00:00.000Z', // 16:00 Perth on 2026-05-08
    });
    // Falls outside (still 2026-05-07 in Perth):
    database.createCalendarEvent(userId, {
      plantId,
      type: 'water',
      date: '2026-05-07T10:00:00.000Z', // 18:00 Perth on 2026-05-07
    });

    const events = service.getEventsForToday(userId);
    expect(events.map((e) => e.date)).toEqual(['2026-05-08T08:00:00.000Z']);

    jest.useRealTimers();
  });

  it('getEventsForWeek pushes the range into SQL', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-05-06T12:00:00.000Z')); // Wed UTC
    const service = createCalendarService(database);

    database.createCalendarEvent(userId, {
      plantId,
      type: 'water',
      date: '2026-04-29T00:00:00.000Z', // before window
    });
    database.createCalendarEvent(userId, {
      plantId,
      type: 'water',
      date: '2026-05-05T00:00:00.000Z', // inside window
    });
    database.createCalendarEvent(userId, {
      plantId,
      type: 'water',
      date: '2026-05-15T00:00:00.000Z', // after window
    });

    const events = service.getEventsForWeek(userId);
    expect(events.map((e) => e.date)).toEqual(['2026-05-05T00:00:00.000Z']);

    jest.useRealTimers();
  });

  it('getEventsForMonth restricts to the local calendar month', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-05-15T03:00:00.000Z'));
    const service = createCalendarService(database);

    database.createCalendarEvent(userId, {
      plantId,
      type: 'water',
      date: '2026-04-30T23:00:00.000Z', // April UTC, but May 1 in Perth
    });
    database.createCalendarEvent(userId, {
      plantId,
      type: 'water',
      date: '2026-05-15T00:00:00.000Z',
    });
    database.createCalendarEvent(userId, {
      plantId,
      type: 'water',
      date: '2026-06-01T00:00:00.000Z', // June UTC and June in Perth
    });

    const events = service.getEventsForMonth(userId);
    expect(events.map((e) => e.date).sort()).toEqual([
      '2026-04-30T23:00:00.000Z',
      '2026-05-15T00:00:00.000Z',
    ]);

    jest.useRealTimers();
  });

  it('does not return events from other users', () => {
    const other = database.createUser({
      username: 'other',
      email: 'other@example.com',
      name: 'Other',
      passwordHash: 'hash',
    });
    const otherPlant = database.createPlant(other.id, { name: 'Mint', species: 'Mentha' });
    database.createCalendarEvent(other.id, {
      plantId: otherPlant.id,
      type: 'water',
      date: '2026-05-08T08:00:00.000Z',
    });

    jest.useFakeTimers().setSystemTime(new Date('2026-05-08T03:00:00.000Z'));
    const service = createCalendarService(database);
    expect(service.getEventsForToday(userId)).toEqual([]);
    jest.useRealTimers();
  });
});
