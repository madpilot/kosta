import { useParams } from '@tanstack/react-router';
import { usePlant } from '@sprout/api-client';

import styles from './PlantDetail.module.css';

export const PlantDetailScreen = () => {
  const { plantId } = useParams({ from: '/plants/$plantId' });
  const plant = usePlant(plantId);

  if (plant.isLoading) return <p>Loading…</p>;
  if (plant.isError || !plant.data) return <p>Plant not found.</p>;

  const p = plant.data;

  return (
    <article className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>{p.species}</p>
        <h1 className={styles.title}>{p.name}</h1>
        {p.location && <p className={styles.location}>📍 {p.location}</p>}
      </header>

      <dl className={styles.facts}>
        <Fact
          label="Watering"
          value={p.wateringFrequency ? `every ${p.wateringFrequency}d` : '—'}
        />
        <Fact
          label="Last watered"
          value={p.lastWatered ? new Date(p.lastWatered).toLocaleDateString() : '—'}
        />
        <Fact label="Sunlight" value={p.sunlightRequirement ?? '—'} />
        <Fact label="Soil" value={p.soilType ?? '—'} />
      </dl>

      {p.notes && (
        <section className={styles.notes}>
          <h2 className={styles.sectionTitle}>Notes</h2>
          <p>{p.notes}</p>
        </section>
      )}
    </article>
  );
};

const Fact = ({ label, value }: { label: string; value: string }) => (
  <div className={styles.fact}>
    <dt>{label}</dt>
    <dd>{value}</dd>
  </div>
);
