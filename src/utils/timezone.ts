// Helpers for resolving "today", "this week", and "this month" boundaries in
// a caller-supplied IANA timezone, then converting them to UTC instants we
// can compare against ISO-8601 strings stored in SQLite.

const DEFAULT_TIMEZONE = 'UTC';

type ZonedParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

const partsFormatter = (timeZone: string): Intl.DateTimeFormat =>
  new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

const getZonedParts = (date: Date, timeZone: string): ZonedParts => {
  const lookup: Record<string, string> = {};
  for (const part of partsFormatter(timeZone).formatToParts(date)) {
    lookup[part.type] = part.value;
  }
  const hour = Number(lookup.hour);
  return {
    year: Number(lookup.year),
    month: Number(lookup.month),
    day: Number(lookup.day),
    hour: hour === 24 ? 0 : hour,
    minute: Number(lookup.minute),
    second: Number(lookup.second),
  };
};

// Convert a wall-clock date/time in `timeZone` to the corresponding UTC instant.
// Uses one offset-correction iteration, which is correct outside of the
// fall-back hour where wall-clock times are ambiguous.
const zonedWallClockToUtc = (
  year: number,
  month: number,
  day: number,
  timeZone: string,
): Date => {
  const guess = Date.UTC(year, month - 1, day, 0, 0, 0);
  const asZoned = getZonedParts(new Date(guess), timeZone);
  const asZonedUtc = Date.UTC(
    asZoned.year,
    asZoned.month - 1,
    asZoned.day,
    asZoned.hour,
    asZoned.minute,
    asZoned.second,
  );
  return new Date(guess - (asZonedUtc - guess));
};

export const resolveTimezone = (timeZone?: string | null): string => {
  if (!timeZone) return DEFAULT_TIMEZONE;
  try {
    // Throws RangeError on invalid IANA names.
    new Intl.DateTimeFormat('en-US', { timeZone }).format(new Date());
    return timeZone;
  } catch {
    return DEFAULT_TIMEZONE;
  }
};

export type DateRange = { startInclusive: string; endExclusive: string };

export const dayRange = (now: Date, timeZone: string): DateRange => {
  const { year, month, day } = getZonedParts(now, timeZone);
  const start = zonedWallClockToUtc(year, month, day, timeZone);
  const end = zonedWallClockToUtc(year, month, day + 1, timeZone);
  return { startInclusive: start.toISOString(), endExclusive: end.toISOString() };
};

export const weekRange = (now: Date, timeZone: string): DateRange => {
  const { year, month, day } = getZonedParts(now, timeZone);
  // Use UTC arithmetic on the wall-clock Y/M/D to avoid host-tz drift.
  const dayOfWeek = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  const start = zonedWallClockToUtc(year, month, day - dayOfWeek, timeZone);
  const end = zonedWallClockToUtc(year, month, day - dayOfWeek + 7, timeZone);
  return { startInclusive: start.toISOString(), endExclusive: end.toISOString() };
};

export const monthRange = (now: Date, timeZone: string): DateRange => {
  const { year, month } = getZonedParts(now, timeZone);
  const start = zonedWallClockToUtc(year, month, 1, timeZone);
  const end = zonedWallClockToUtc(year, month + 1, 1, timeZone);
  return { startInclusive: start.toISOString(), endExclusive: end.toISOString() };
};
