import { useMemo } from 'react';
import { Link } from '@tanstack/react-router';
import { useCalendarEvents, usePlants } from '@sprout/api-client';

import { Pill } from '../components/Pill';
import styles from './Calendar.module.css';

const groupByDate = (events: { id: string; date: string }[]) => {
  const groups = new Map<string, typeof events>();
  for (const event of events) {
    const key = event.date.slice(0, 10);
    const list = groups.get(key) ?? [];
    list.push(event);
    groups.set(key, list);
  }
  return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
};

const eventTone = (type: string) => {
  if (type === 'water' || type === 'fertilize' || type === 'harvest') return type;
  return 'other' as const;
};

export const CalendarScreen = () => {
  const events = useCalendarEvents();
  const plants = usePlants();

  const groups = useMemo(() => groupByDate(events.data ?? []), [events.data]);
  const plantName = (id: string) => plants.data?.find((p) => p.id === id)?.name ?? 'Unknown plant';

  return (
    <div className={styles.page}>
      <header>
        <p className={styles.eyebrow}>Calendar</p>
        <h1 className={styles.title}>
          The <em>shape</em> of your week.
        </h1>
      </header>

      {events.isLoading && <p>Loading…</p>}

      <div className={styles.groups}>
        {groups.map(([date, items]) => (
          <section key={date} className={styles.group}>
            <h2 className={styles.date}>{date}</h2>
            <ul className={styles.list}>
              {items.map((event) => {
                const ev = event as typeof event & { plantId: string; type: string };
                return (
                  <li key={event.id} className={styles.row}>
                    <Pill tone={eventTone(ev.type)}>{ev.type}</Pill>
                    <Link
                      to="/plants/$plantId"
                      params={{ plantId: ev.plantId }}
                      className={styles.plant}
                    >
                      {plantName(ev.plantId)}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
};
