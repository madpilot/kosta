import { getRuntimeConfig } from './runtime-config';
import type { SettingsDatabase } from './db/index';
import type { Settings } from './models/settings';

const stubDb = (settings: Settings | null): SettingsDatabase => ({
  getSettings: () => settings,
  saveSettings: (s) => s,
});

describe('getRuntimeConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('returns env-derived defaults when no settings have been saved', () => {
    // The static config module is read once at import time, so we verify
    // against whatever config.ts resolved at startup rather than re-mutating
    // env. The shape is what matters.
    const cfg = getRuntimeConfig(stubDb(null));
    expect(cfg.aiBackend).toBe('ollama');
    expect(cfg.ollama.baseUrl).toMatch(/^http:\/\//);
    expect(cfg.ollama.model).toBeTruthy();
    expect(cfg.user.hemisphere).toBe('southern');
  });

  it('overlays stored settings over the env defaults', () => {
    const cfg = getRuntimeConfig(
      stubDb({
        aiBackend: 'openai',
        openaiApiKey: 'sk-xyz',
        openaiModel: 'gpt-4o-mini',
        ollamaBaseUrl: 'http://ollama.local:11434',
        ollamaModel: 'llama3.3',
        location: 'Wellington, NZ',
        hemisphere: 'southern',
        weatherApiKey: 'wkey',
      }),
    );
    expect(cfg.aiBackend).toBe('openai');
    expect(cfg.openai).toEqual({ apiKey: 'sk-xyz', model: 'gpt-4o-mini' });
    expect(cfg.ollama).toEqual({ baseUrl: 'http://ollama.local:11434', model: 'llama3.3' });
    expect(cfg.user).toEqual({ location: 'Wellington, NZ', hemisphere: 'southern' });
    expect(cfg.weather.apiKey).toBe('wkey');
  });

  it('only overrides fields that are present in stored settings', () => {
    // Stored settings only set aiBackend + hemisphere; everything else falls
    // back to env defaults.
    const cfg = getRuntimeConfig(
      stubDb({
        aiBackend: 'ollama',
        hemisphere: 'northern',
      }),
    );
    expect(cfg.aiBackend).toBe('ollama');
    expect(cfg.user.hemisphere).toBe('northern');
    // ollamaBaseUrl was not set — falls back to the env default.
    expect(cfg.ollama.baseUrl).toBeTruthy();
  });
});
