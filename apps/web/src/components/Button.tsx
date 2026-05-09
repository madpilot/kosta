import type { ButtonHTMLAttributes } from 'react';

import styles from './Button.module.css';

type Variant = 'tomato' | 'forest' | 'cream' | 'ghost';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const variantClass: Record<Variant, string> = {
  tomato: styles.tomato,
  forest: styles.forest,
  cream: styles.cream,
  ghost: styles.ghost,
};

export const Button = ({ variant = 'tomato', className, ...rest }: Props) => (
  <button className={`${styles.btn} ${variantClass[variant]} ${className ?? ''}`} {...rest} />
);
