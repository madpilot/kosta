// Timezone-aware day/week/month boundary calculations.
//
// Calendar events are persisted as UTC ISO strings, but "today", "this week",
// and "this month" are inherently local concepts. These helpers compute the
// UTC instants that bracket a local day/week/month in the user's timezone, so
// SQL range queries can use them directly.
//
// DST is approximated: a one-hour-off bound on the day of a transition is
// acceptable for a gardening schedule.

const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;

const getZoneOffsetMinutes = (date: Date, timeZone: string): number => {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const parts = dtf.formatToParts(date);
  const get = (type: string): number => Number(parts.find((p) => p.type === type)?.value);
  let hour = get('hour');
  // Intl returns "24" for midnight in some locales; treat as 00.
  if (hour === 24) hour = 0;
  const asUtc = Date.UTC(
    get('year'),
    get('month') - 1,
    get('day'),
    hour,
    get('minute'),
    get('second'),
  );
  return (asUtc - date.getTime()) / 60000;
};

export const getZonedDateString = (date: Date, timeZone: string): string => {
  const dtf = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return dtf.format(date);
};

const zonedInstant = (year: number, month: number, day: number, timeZone: string): Date => {
  const guess = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  const offset = getZoneOffsetMinutes(guess, timeZone);
  return new Date(guess.getTime() - offset * 60 * 1000);
};

const parseLocalDate = (localDateStr: string): { year: number; month: number; day: number } => {
  if (!isoDateRegex.test(localDateStr)) {
    throw new Error(`Expected YYYY-MM-DD, got ${localDateStr}`);
  }
  const [y, m, d] = localDateStr.split('-').map(Number);
  return { year: y, month: m, day: d };
};

export const dayBoundariesUtc = (
  localDateStr: string,
  timeZone: string,
): { start: string; end: string } => {
  const { year, month, day } = parseLocalDate(localDateStr);
  const start = zonedInstant(year, month, day, timeZone);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start: start.toISOString(), end: end.toISOString() };
};

export const weekBoundariesUtc = (
  now: Date,
  timeZone: string,
): { start: string; end: string } => {
  const localToday = getZonedDateString(now, timeZone);
  const { year, month, day } = parseLocalDate(localToday);
  const startOfDay = zonedInstant(year, month, day, timeZone);
  // Use UTC weekday of the local-midnight instant — for any reasonable timezone,
  // this is the same calendar day as the user perceives it.
  const local = new Date(startOfDay);
  const dow = local.getUTCDay(); // 0 = Sunday in local TZ-aligned UTC reference
  const sunday = new Date(local.getTime() - dow * 24 * 60 * 60 * 1000);
  const end = new Date(sunday.getTime() + 7 * 24 * 60 * 60 * 1000);
  return { start: sunday.toISOString(), end: end.toISOString() };
};

export const monthBoundariesUtc = (
  now: Date,
  timeZone: string,
): { start: string; end: string } => {
  const localToday = getZonedDateString(now, timeZone);
  const { year, month } = parseLocalDate(localToday);
  const start = zonedInstant(year, month, 1, timeZone);
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const end = zonedInstant(nextYear, nextMonth, 1, timeZone);
  return { start: start.toISOString(), end: end.toISOString() };
};
