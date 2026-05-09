import type { ReactNode } from 'react';

import styles from './Pill.module.css';

type Tone = 'water' | 'fertilize' | 'harvest' | 'other';

interface Props {
  tone: Tone;
  children: ReactNode;
}

const toneClass: Record<Tone, string> = {
  water: styles.water,
  fertilize: styles.fertilize,
  harvest: styles.harvest,
  other: styles.other,
};

export const Pill = ({ tone, children }: Props) => (
  <span className={`${styles.pill} ${toneClass[tone]}`}>
    <span className={styles.dot} />
    {children}
  </span>
);
