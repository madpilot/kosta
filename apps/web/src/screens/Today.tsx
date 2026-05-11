import { useTodayEvents, useCompleteEvent, usePlants } from '@sprout/api-client';

import { Pill } from '../components/Pill';
import { Button } from '../components/Button';
import styles from './Today.module.css';

const eventTone = (type: string) => {
  if (type === 'water' || type === 'fertilize' || type === 'harvest') return type;
  return 'other' as const;
};

export const TodayScreen = () => {
  const events = useTodayEvents();
  const plants = usePlants();
  const complete = useCompleteEvent();

  const plantName = (id: string) => plants.data?.find((p) => p.id === id)?.name ?? 'Unknown plant';

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Today</p>
        <h1 className={styles.title}>
          What&rsquo;s <em>blooming</em> today.
        </h1>
        <p className={styles.lede}>
          {events.data?.length ?? 0} task{(events.data?.length ?? 0) === 1 ? '' : 's'} on the
          schedule. Tick them off as you go.
        </p>
      </header>

      {events.isLoading && <p>Loading…</p>}
      {events.isError && <p>Couldn&rsquo;t load today&rsquo;s tasks.</p>}

      <ul className={styles.list}>
        {events.data?.map((event) => (
          <li key={event.id} className={styles.card}>
            <div className={styles.cardHead}>
              <Pill tone={eventTone(event.type)}>{event.type}</Pill>
              <span className={styles.plant}>{plantName(event.plantId)}</span>
            </div>
            {event.notes && <p className={styles.notes}>{event.notes}</p>}
            <div className={styles.actions}>
              <Button
                variant="forest"
                disabled={event.completed || complete.isPending}
                onClick={() => complete.mutate({ id: event.id })}
              >
                {event.completed ? 'Done' : 'Mark done'}
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
