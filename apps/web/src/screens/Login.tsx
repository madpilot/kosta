import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useLogin } from '@sprout/api-client';

import { Button } from '../components/Button';
import styles from './Auth.module.css';

export const LoginScreen = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const login = useLogin({
    onSuccess: (data) => {
      const result = data as { token?: string };
      if (result.token) localStorage.setItem('sprout_token', result.token);
      navigate({ to: '/' });
    },
  });

  return (
    <div className={styles.page}>
      <form
        className={styles.card}
        onSubmit={(e) => {
          e.preventDefault();
          login.mutate({ username, password });
        }}
      >
        <h1 className={styles.title}>
          Welcome <em>back</em>.
        </h1>
        <label className={styles.field}>
          <span>Username</span>
          <input value={username} onChange={(e) => setUsername(e.target.value)} required />
        </label>
        <label className={styles.field}>
          <span>Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {login.isError && <p className={styles.error}>Login failed. Try again.</p>}
        <Button type="submit" variant="tomato" disabled={login.isPending}>
          {login.isPending ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </div>
  );
};
