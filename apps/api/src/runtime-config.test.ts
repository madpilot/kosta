import type { Settings } from '@sprout/shared/schemas/settings';
import { getRuntimeConfig, RUNTIME_CONFIG_DEFAULTS } from './runtime-config';
import type { SettingsDatabase } from './db/index';

const stubDb = (settings: Settings | null): SettingsDatabase => ({
  getSettings: () => settings,
  saveSettings: (s) => s,
});

describe('getRuntimeConfig', () => {
  it('returns built-in defaults when no settings have been saved', () => {
    const cfg = getRuntimeConfig(stubDb(null));
    expect(cfg.aiBackend).toBe(RUNTIME_CONFIG_DEFAULTS.aiBackend);
    expect(cfg.ollama.baseUrl).toBe(RUNTIME_CONFIG_DEFAULTS.ollama.baseUrl);
    expect(cfg.ollama.model).toBe(RUNTIME_CONFIG_DEFAULTS.ollama.model);
    expect(cfg.user.hemisphere).toBe(RUNTIME_CONFIG_DEFAULTS.user.hemisphere);
    expect(cfg.app.baseUrl).toBe(RUNTIME_CONFIG_DEFAULTS.app.baseUrl);
    expect(cfg.ai.preamble).toBe(RUNTIME_CONFIG_DEFAULTS.ai.preamble);
    expect(cfg.logging.level).toBe(RUNTIME_CONFIG_DEFAULTS.logging.level);
    expect(cfg.logging.format).toBe(RUNTIME_CONFIG_DEFAULTS.logging.format);
  });

  it('overlays stored settings over the built-in defaults', () => {
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
        appBaseUrl: 'https://sprout.example.com',
        aiPreamble: 'Custom preamble',
        logLevel: 'debug',
        logFormat: 'json',
        logSilent: true,
      }),
    );
    expect(cfg.aiBackend).toBe('openai');
    expect(cfg.openai).toEqual({ apiKey: 'sk-xyz', model: 'gpt-4o-mini' });
    expect(cfg.ollama).toEqual({ baseUrl: 'http://ollama.local:11434', model: 'llama3.3' });
    expect(cfg.user).toEqual({ location: 'Wellington, NZ', hemisphere: 'southern' });
    expect(cfg.weather.apiKey).toBe('wkey');
    expect(cfg.app.baseUrl).toBe('https://sprout.example.com');
    expect(cfg.ai.preamble).toBe('Custom preamble');
    expect(cfg.logging).toEqual({ level: 'debug', format: 'json', silent: true });
  });

  it('only overrides fields that are present in stored settings', () => {
    // Stored settings only set aiBackend + hemisphere; everything else falls
    // back to the built-in defaults.
    const cfg = getRuntimeConfig(
      stubDb({
        aiBackend: 'ollama',
        hemisphere: 'northern',
      }),
    );
    expect(cfg.aiBackend).toBe('ollama');
    expect(cfg.user.hemisphere).toBe('northern');
    expect(cfg.ollama.baseUrl).toBe(RUNTIME_CONFIG_DEFAULTS.ollama.baseUrl);
    expect(cfg.app.baseUrl).toBe(RUNTIME_CONFIG_DEFAULTS.app.baseUrl);
    expect(cfg.ai.preamble).toBe(RUNTIME_CONFIG_DEFAULTS.ai.preamble);
  });
});
