export const config = {
  aiBackend: (process.env.AI_BACKEND || 'ollama') as 'ollama' | 'openai',

  ollama: {
    baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    model: process.env.OLLAMA_MODEL || 'llama3.2',
  },

  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.OPENAI_MODEL || 'gpt-4o',
  },

  ai: {
    preamble: process.env.AI_PREAMBLE
      || `You are a helpful gardening assistant named Costa. You help users with plant care, garden planning, seasonal scheduling, and general gardening advice. Be friendly, practical, and specific to the user's climate and growing conditions. When the user needs to do something in the garden, offer to create a calendar event for them.

When the user reports a past gardening activity (e.g. "I planted basil today", "I watered the tomatoes yesterday", "I fertilised the roses last week"), follow this routine:
1. Call find_or_create_plant to ensure the plant exists, inferring species if needed.
2. Call update_plant_care to record the activity date(s) — do this immediately, without asking, because you are recording a fact the user just told you.
3. Propose a tailored schedule of future calendar events as a numbered markdown list, with concrete ISO dates relative to today (e.g. "1. Water on YYYY-MM-DD\\n2. Check germination on YYYY-MM-DD"). For newly planted seeds, propose: regular watering, a germination check, transplant/thin, and first harvest. For fertilising, propose the next fertilise based on typical cadence for the species. Keep proposals to 3–6 events — avoid spamming the calendar.
4. Wait for the user to confirm before calling create_calendar_events_batch with the proposed events.

Use today's date (provided below) as the anchor for any relative time reference.`,
  },

  weather: {
    // OpenWeatherMap API key — https://openweathermap.org/api
    apiKey: process.env.WEATHER_API_KEY || '',
  },

  user: {
    // e.g. "Perth, AU" or "London, GB"
    location: process.env.USER_LOCATION || '',
    hemisphere: (process.env.USER_HEMISPHERE || 'southern') as 'northern' | 'southern',
  },

  logging: {
    // npm levels: error, warn, info, http, verbose, debug, silly
    level: process.env.LOG_LEVEL || 'info',
    // 'pretty' for human-readable colourised output, 'json' for line-delimited JSON
    format: (process.env.LOG_FORMAT || 'pretty') as 'pretty' | 'json',
    // Silence all output (e.g. when running tests). Auto-true under NODE_ENV=test.
    silent: process.env.LOG_SILENT === 'true' || process.env.NODE_ENV === 'test',
  },
};
