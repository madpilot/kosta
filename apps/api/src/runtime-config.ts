import type { LogFormat, LogLevel } from '@sprout/shared/schemas/settings';
import type { SettingsDatabase } from './db/index';

export const DEFAULT_AI_PREAMBLE = `You are a helpful gardening assistant named Costa. You help users with plant care, garden planning, seasonal scheduling, and general gardening advice. Be friendly, practical, and specific to the user's climate and growing conditions. When the user needs to do something in the garden, offer to create a calendar event for them.

When the user reports a past gardening activity (e.g. "I planted basil today", "I watered the tomatoes yesterday", "I fertilised the roses last week"), follow this routine:
1. Call find_or_create_plant to ensure the plant exists, inferring species if needed.
2. Call update_plant_care to record the activity date(s) — do this immediately, without asking, because you are recording a fact the user just told you.
3. Propose a tailored schedule of future calendar events as a numbered markdown list, with concrete ISO dates relative to today (e.g. "1. Water on YYYY-MM-DD\\n2. Check germination on YYYY-MM-DD"). For newly planted seeds, propose: regular watering, a germination check, transplant/thin, and first harvest. For fertilising, propose the next fertilise based on typical cadence for the species. Keep proposals to 3–6 events — avoid spamming the calendar.
4. Wait for the user to confirm before calling create_calendar_events_batch with the proposed events.

Use today's date (provided below) as the anchor for any relative time reference.`;

export const RUNTIME_CONFIG_DEFAULTS = {
  aiBackend: 'ollama' as const,
  ollama: {
    baseUrl: 'http://localhost:11434',
    model: 'llama3.2',
  },
  openai: {
    apiKey: '',
    model: 'gpt-4o',
  },
  ai: {
    preamble: DEFAULT_AI_PREAMBLE,
  },
  weather: {
    apiKey: '',
  },
  user: {
    location: '',
    hemisphere: 'southern' as const,
  },
  app: {
    baseUrl: 'http://localhost:3000',
  },
  logging: {
    level: 'info' as LogLevel,
    format: 'pretty' as LogFormat,
    // Tests run with NODE_ENV=test; default the logger to silent so unit
    // tests don't spew log lines unless they opt in via createLogger overrides.
    silent: process.env.NODE_ENV === 'test',
  },
};

export interface RuntimeConfig {
  aiBackend: 'ollama' | 'openai';
  ollama: { baseUrl: string; model: string };
  openai: { apiKey: string; model: string };
  ai: { preamble: string };
  user: { location: string; hemisphere: 'northern' | 'southern' };
  weather: { apiKey: string };
  app: { baseUrl: string };
  logging: { level: LogLevel; format: LogFormat; silent: boolean };
}

// Merge DB-stored settings over hard-coded defaults. Settings written during
// onboarding (or through PUT /api/settings) take precedence; anything the
// user hasn't set falls back to the default. Read on each call so live
// settings updates take effect without a restart.
export const getRuntimeConfig = (db: SettingsDatabase): RuntimeConfig => {
  const stored = db.getSettings();
  const d = RUNTIME_CONFIG_DEFAULTS;
  return {
    aiBackend: stored?.aiBackend ?? d.aiBackend,
    ollama: {
      baseUrl: stored?.ollamaBaseUrl ?? d.ollama.baseUrl,
      model: stored?.ollamaModel ?? d.ollama.model,
    },
    openai: {
      apiKey: stored?.openaiApiKey ?? d.openai.apiKey,
      model: stored?.openaiModel ?? d.openai.model,
    },
    ai: {
      preamble: stored?.aiPreamble ?? d.ai.preamble,
    },
    user: {
      location: stored?.location ?? d.user.location,
      hemisphere: stored?.hemisphere ?? d.user.hemisphere,
    },
    weather: {
      apiKey: stored?.weatherApiKey ?? d.weather.apiKey,
    },
    app: {
      baseUrl: stored?.appBaseUrl ?? d.app.baseUrl,
    },
    logging: {
      level: stored?.logLevel ?? d.logging.level,
      format: stored?.logFormat ?? d.logging.format,
      silent: stored?.logSilent ?? d.logging.silent,
    },
  };
};
