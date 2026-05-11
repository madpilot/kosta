import { useEffect, useState } from 'react';
import type { Settings } from '@sprout/shared/schemas/settings';
import { useSettings, useUpdateSettings } from '@sprout/api-client';

import { Button } from '../components/Button';
import styles from './Settings.module.css';

type FormState = {
  aiBackend: 'ollama' | 'openai';
  ollamaBaseUrl: string;
  ollamaModel: string;
  openaiApiKey: string;
  openaiModel: string;
  location: string;
  hemisphere: 'northern' | 'southern';
  weatherApiKey: string;
  appBaseUrl: string;
  aiPreamble: string;
  logLevel: '' | 'error' | 'warn' | 'info' | 'http' | 'verbose' | 'debug' | 'silly';
  logFormat: '' | 'pretty' | 'json';
};

const emptyForm: FormState = {
  aiBackend: 'ollama',
  ollamaBaseUrl: '',
  ollamaModel: '',
  openaiApiKey: '',
  openaiModel: '',
  location: '',
  hemisphere: 'southern',
  weatherApiKey: '',
  appBaseUrl: '',
  aiPreamble: '',
  logLevel: '',
  logFormat: '',
};

const fromSettings = (s: Settings): FormState => ({
  aiBackend: s.aiBackend,
  ollamaBaseUrl: s.ollamaBaseUrl ?? '',
  ollamaModel: s.ollamaModel ?? '',
  openaiApiKey: s.openaiApiKey ?? '',
  openaiModel: s.openaiModel ?? '',
  location: s.location ?? '',
  hemisphere: s.hemisphere,
  weatherApiKey: s.weatherApiKey ?? '',
  appBaseUrl: s.appBaseUrl ?? '',
  aiPreamble: s.aiPreamble ?? '',
  logLevel: s.logLevel ?? '',
  logFormat: s.logFormat ?? '',
});

const toPayload = (f: FormState): Settings => {
  const payload: Settings = {
    aiBackend: f.aiBackend,
    hemisphere: f.hemisphere,
  };
  if (f.aiBackend === 'ollama') {
    if (f.ollamaBaseUrl) payload.ollamaBaseUrl = f.ollamaBaseUrl;
    if (f.ollamaModel) payload.ollamaModel = f.ollamaModel;
  } else {
    if (f.openaiApiKey) payload.openaiApiKey = f.openaiApiKey;
    if (f.openaiModel) payload.openaiModel = f.openaiModel;
  }
  if (f.location) payload.location = f.location;
  if (f.weatherApiKey) payload.weatherApiKey = f.weatherApiKey;
  if (f.appBaseUrl) payload.appBaseUrl = f.appBaseUrl;
  if (f.aiPreamble) payload.aiPreamble = f.aiPreamble;
  if (f.logLevel) payload.logLevel = f.logLevel;
  if (f.logFormat) payload.logFormat = f.logFormat;
  return payload;
};

export const SettingsScreen = () => {
  const settings = useSettings();
  const update = useUpdateSettings();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (settings.data) setForm(fromSettings(settings.data));
  }, [settings.data]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(false);
    update.mutate(toPayload(form), {
      onSuccess: () => setSaved(true),
    });
  };

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Settings</p>
        <h1 className={styles.title}>
          Tune your <em>garden</em>.
        </h1>
        <p className={styles.lede}>
          Configure your AI backend, location, and weather lookups. Changes take effect immediately
          — no restart needed.
        </p>
      </header>

      {settings.isLoading && <p>Loading…</p>}
      {settings.isError && <p className={styles.error}>Couldn&apos;t load settings.</p>}

      {settings.data && (
        <form className={styles.form} onSubmit={submit}>
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Location</h2>
            <p className={styles.sectionHint}>
              Used for season detection and weather forecast lookups.
            </p>
            <label className={styles.field}>
              <span>Where do you garden?</span>
              <input
                placeholder="Perth, AU"
                value={form.location}
                onChange={(e) => set('location', e.target.value)}
              />
            </label>
            <label className={styles.field}>
              <span>Hemisphere</span>
              <select
                value={form.hemisphere}
                onChange={(e) => set('hemisphere', e.target.value as 'northern' | 'southern')}
              >
                <option value="southern">Southern</option>
                <option value="northern">Northern</option>
              </select>
            </label>
          </div>

          <hr className={styles.divider} />

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>AI backend</h2>
            <label className={styles.field}>
              <span>Backend</span>
              <select
                value={form.aiBackend}
                onChange={(e) => set('aiBackend', e.target.value as 'ollama' | 'openai')}
              >
                <option value="ollama">Ollama (local)</option>
                <option value="openai">OpenAI</option>
              </select>
            </label>
            {form.aiBackend === 'ollama' && (
              <div className={styles.row}>
                <label className={styles.field}>
                  <span>Ollama base URL</span>
                  <input
                    placeholder="http://localhost:11434"
                    value={form.ollamaBaseUrl}
                    onChange={(e) => set('ollamaBaseUrl', e.target.value)}
                  />
                </label>
                <label className={styles.field}>
                  <span>Ollama model</span>
                  <input
                    placeholder="llama3.2"
                    value={form.ollamaModel}
                    onChange={(e) => set('ollamaModel', e.target.value)}
                  />
                </label>
              </div>
            )}
            {form.aiBackend === 'openai' && (
              <div className={styles.row}>
                <label className={styles.field}>
                  <span>OpenAI API key</span>
                  <input
                    type="password"
                    value={form.openaiApiKey}
                    onChange={(e) => set('openaiApiKey', e.target.value)}
                  />
                </label>
                <label className={styles.field}>
                  <span>OpenAI model</span>
                  <input
                    placeholder="gpt-4o"
                    value={form.openaiModel}
                    onChange={(e) => set('openaiModel', e.target.value)}
                  />
                </label>
              </div>
            )}
            <label className={styles.field}>
              <span>System preamble (optional)</span>
              <textarea
                placeholder="Leave blank to use the default Costa preamble."
                value={form.aiPreamble}
                onChange={(e) => set('aiPreamble', e.target.value)}
              />
            </label>
          </div>

          <hr className={styles.divider} />

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Weather</h2>
            <p className={styles.sectionHint}>
              An OpenWeatherMap API key enables forecast-aware advice. Forecasts are skipped if this
              is empty.
            </p>
            <label className={styles.field}>
              <span>OpenWeatherMap API key</span>
              <input
                type="password"
                value={form.weatherApiKey}
                onChange={(e) => set('weatherApiKey', e.target.value)}
              />
            </label>
          </div>

          <hr className={styles.divider} />

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Advanced</h2>
            <p className={styles.sectionHint}>
              Operational defaults. Most installs don&apos;t need to change these.
            </p>
            <label className={styles.field}>
              <span>Public app URL</span>
              <input
                placeholder="http://localhost:3000"
                value={form.appBaseUrl}
                onChange={(e) => set('appBaseUrl', e.target.value)}
              />
            </label>
            <div className={styles.row}>
              <label className={styles.field}>
                <span>Log level</span>
                <select
                  value={form.logLevel}
                  onChange={(e) => set('logLevel', e.target.value as FormState['logLevel'])}
                >
                  <option value="">Default (info)</option>
                  <option value="error">error</option>
                  <option value="warn">warn</option>
                  <option value="info">info</option>
                  <option value="http">http</option>
                  <option value="verbose">verbose</option>
                  <option value="debug">debug</option>
                  <option value="silly">silly</option>
                </select>
              </label>
              <label className={styles.field}>
                <span>Log format</span>
                <select
                  value={form.logFormat}
                  onChange={(e) => set('logFormat', e.target.value as FormState['logFormat'])}
                >
                  <option value="">Default (pretty)</option>
                  <option value="pretty">pretty</option>
                  <option value="json">json</option>
                </select>
              </label>
            </div>
          </div>

          <div className={styles.actions}>
            <Button type="submit" variant="tomato" disabled={update.isPending}>
              {update.isPending ? 'Saving…' : 'Save settings'}
            </Button>
            {saved && !update.isPending && <p className={styles.success}>Saved.</p>}
            {update.isError && (
              <p className={styles.error}>
                {update.error instanceof Error ? update.error.message : 'Save failed.'}
              </p>
            )}
          </div>
        </form>
      )}
    </div>
  );
};
