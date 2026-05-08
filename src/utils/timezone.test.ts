import {
  dayBoundariesUtc,
  getZonedDateString,
  monthBoundariesUtc,
  weekBoundariesUtc,
} from './timezone';

describe('timezone utilities', () => {
  describe('getZonedDateString', () => {
    it('returns YYYY-MM-DD in the given timezone', () => {
      // 2026-05-08T15:30Z is 2026-05-08T23:30 in Australia/Perth (+8) and
      // 2026-05-08T08:30 in America/New_York (-7 with DST).
      const ref = new Date('2026-05-08T15:30:00.000Z');
      expect(getZonedDateString(ref, 'Australia/Perth')).toBe('2026-05-08');
      expect(getZonedDateString(ref, 'America/New_York')).toBe('2026-05-08');
    });

    it('rolls over the date at the local midnight boundary', () => {
      // 2026-05-08T17:00Z is 2026-05-09T01:00 in Australia/Perth (+8).
      const ref = new Date('2026-05-08T17:00:00.000Z');
      expect(getZonedDateString(ref, 'Australia/Perth')).toBe('2026-05-09');
      expect(getZonedDateString(ref, 'UTC')).toBe('2026-05-08');
    });
  });

  describe('dayBoundariesUtc', () => {
    it('brackets a local day with start inclusive, end exclusive', () => {
      const { start, end } = dayBoundariesUtc('2026-05-08', 'Australia/Perth');
      // Australia/Perth is UTC+8 year-round.
      expect(start).toBe('2026-05-07T16:00:00.000Z');
      expect(end).toBe('2026-05-08T16:00:00.000Z');
    });

    it('handles UTC as a no-op timezone', () => {
      const { start, end } = dayBoundariesUtc('2026-05-08', 'UTC');
      expect(start).toBe('2026-05-08T00:00:00.000Z');
      expect(end).toBe('2026-05-09T00:00:00.000Z');
    });
  });

  describe('weekBoundariesUtc', () => {
    it('produces a 7-day window aligned to local Sunday', () => {
      const ref = new Date('2026-05-06T03:00:00.000Z'); // Wed
      const { start, end } = weekBoundariesUtc(ref, 'UTC');
      expect(start).toBe('2026-05-03T00:00:00.000Z'); // Sun
      expect(end).toBe('2026-05-10T00:00:00.000Z'); // following Sun
    });
  });

  describe('monthBoundariesUtc', () => {
    it('brackets the local calendar month', () => {
      const ref = new Date('2026-05-15T12:00:00.000Z');
      const { start, end } = monthBoundariesUtc(ref, 'UTC');
      expect(start).toBe('2026-05-01T00:00:00.000Z');
      expect(end).toBe('2026-06-01T00:00:00.000Z');
    });

    it('rolls year over correctly', () => {
      const ref = new Date('2026-12-15T12:00:00.000Z');
      const { start, end } = monthBoundariesUtc(ref, 'UTC');
      expect(start).toBe('2026-12-01T00:00:00.000Z');
      expect(end).toBe('2027-01-01T00:00:00.000Z');
    });
  });
});
