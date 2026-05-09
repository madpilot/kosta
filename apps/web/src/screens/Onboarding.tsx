import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useApiClient, useOnboardingStatus } from '@sprout/api-client';

import { Button } from '../components/Button';
import styles from './Auth.module.css';

export const OnboardingScreen = () => {
  const navigate = useNavigate();
  const status = useOnboardingStatus();
  const client = useApiClient();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState({ username: '', email: '', name: '', password: '' });
  const [settings, setSettings] = useState({
    aiBackend: 'ollama' as 'ollama' | 'openai',
    location: '',
    hemisphere: 'southern' as 'northern' | 'southern',
    ollamaBaseUrl: 'http://localhost:11434',
    ollamaModel: 'llama3.2',
    openaiApiKey: '',
    openaiModel: 'gpt-4o',
  });

  if (status.data?.onboarded) {
    navigate({ to: '/login' });
    return null;
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const settingsPayload =
        settings.aiBackend === 'openai'
          ? {
              aiBackend: 'openai' as const,
              openaiApiKey: settings.openaiApiKey,
              openaiModel: settings.openaiModel,
              location: settings.location || undefined,
              hemisphere: settings.hemisphere,
            }
          : {
              aiBackend: 'ollama' as const,
              ollamaBaseUrl: settings.ollamaBaseUrl,
              ollamaModel: settings.ollamaModel,
              location: settings.location || undefined,
              hemisphere: settings.hemisphere,
            };
      const result = (await client.onboarding.complete({
        user,
        settings: settingsPayload,
      })) as { token?: string };
      if (result.token) localStorage.setItem('sprout_token', result.token);
      navigate({ to: '/' });
    } catch (err) {
      setError((err as Error).message ?? 'Onboarding failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <form className={styles.card} onSubmit={submit}>
        <h1 className={styles.title}>
          Plant a <em>seed</em>.
        </h1>
        <label className={styles.field}>
          <span>Your name</span>
          <input
            value={user.name}
            onChange={(e) => setUser({ ...user, name: e.target.value })}
            required
          />
        </label>
        <label className={styles.field}>
          <span>Username</span>
          <input
            value={user.username}
            onChange={(e) => setUser({ ...user, username: e.target.value })}
            required
            minLength={3}
          />
        </label>
        <label className={styles.field}>
          <span>Email</span>
          <input
            type="email"
            value={user.email}
            onChange={(e) => setUser({ ...user, email: e.target.value })}
            required
          />
        </label>
        <label className={styles.field}>
          <span>Password</span>
          <input
            type="password"
            value={user.password}
            onChange={(e) => setUser({ ...user, password: e.target.value })}
            required
            minLength={8}
          />
        </label>
        <label className={styles.field}>
          <span>Where do you garden?</span>
          <input
            placeholder="Perth, AU"
            value={settings.location}
            onChange={(e) => setSettings({ ...settings, location: e.target.value })}
          />
        </label>
        <label className={styles.field}>
          <span>Hemisphere</span>
          <select
            value={settings.hemisphere}
            onChange={(e) =>
              setSettings({ ...settings, hemisphere: e.target.value as 'northern' | 'southern' })
            }
          >
            <option value="southern">Southern</option>
            <option value="northern">Northern</option>
          </select>
        </label>
        <label className={styles.field}>
          <span>AI backend</span>
          <select
            value={settings.aiBackend}
            onChange={(e) =>
              setSettings({ ...settings, aiBackend: e.target.value as 'ollama' | 'openai' })
            }
          >
            <option value="ollama">Ollama (local)</option>
            <option value="openai">OpenAI</option>
          </select>
        </label>
        {settings.aiBackend === 'openai' && (
          <label className={styles.field}>
            <span>OpenAI API key</span>
            <input
              type="password"
              value={settings.openaiApiKey}
              onChange={(e) => setSettings({ ...settings, openaiApiKey: e.target.value })}
              required
            />
          </label>
        )}
        {error && <p className={styles.error}>{error}</p>}
        <Button type="submit" variant="tomato" disabled={submitting}>
          {submitting ? 'Setting up…' : 'Continue →'}
        </Button>
      </form>
    </div>
  );
};
