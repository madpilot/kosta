import { Link } from '@tanstack/react-router';
import type { ReactNode } from 'react';

import styles from './RootLayout.module.css';

interface Props {
  children: ReactNode;
}

export const RootLayout = ({ children }: Props) => (
  <div className={styles.shell}>
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <span className={styles.brandMark}>🌱</span>
        <span className={styles.brandName}>Sprout</span>
      </div>
      <nav className={styles.nav}>
        <Link to="/" className={styles.link} activeProps={{ className: styles.linkActive }}>
          Today
        </Link>
        <Link to="/calendar" className={styles.link} activeProps={{ className: styles.linkActive }}>
          Calendar
        </Link>
        <Link to="/chat" className={styles.link} activeProps={{ className: styles.linkActive }}>
          Chat
        </Link>
        <Link to="/settings" className={styles.link} activeProps={{ className: styles.linkActive }}>
          Settings
        </Link>
      </nav>
    </aside>
    <main className={styles.main}>{children}</main>
  </div>
);
