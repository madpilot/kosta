import { config } from './config';
import type { SettingsDatabase } from './db/index';

export interface RuntimeConfig {
  aiBackend: 'ollama' | 'openai';
  ollama: { baseUrl: string; model: string };
  openai: { apiKey: string; model: string };
  user: { location: string; hemisphere: 'northern' | 'southern' };
  weather: { apiKey: string };
}

// Merge DB-stored settings over env defaults from config.ts. Settings written
// during onboarding (or through PUT /api/settings) take precedence; anything
// the user hasn't set falls back to the env-var default. Read on each call
// so live settings updates take effect without a restart.
export const getRuntimeConfig = (db: SettingsDatabase): RuntimeConfig => {
  const stored = db.getSettings();
  return {
    aiBackend: stored?.aiBackend ?? config.aiBackend,
    ollama: {
      baseUrl: stored?.ollamaBaseUrl ?? config.ollama.baseUrl,
      model: stored?.ollamaModel ?? config.ollama.model,
    },
    openai: {
      apiKey: stored?.openaiApiKey ?? config.openai.apiKey,
      model: stored?.openaiModel ?? config.openai.model,
    },
    user: {
      location: stored?.location ?? config.user.location,
      hemisphere: stored?.hemisphere ?? config.user.hemisphere,
    },
    weather: {
      apiKey: stored?.weatherApiKey ?? config.weather.apiKey,
    },
  };
};
