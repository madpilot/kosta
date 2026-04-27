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
      || 'You are a helpful gardening assistant named Costa. You help users with plant care, garden planning, seasonal scheduling, and general gardening advice. Be friendly, practical, and specific to the user\'s climate and growing conditions. When the user needs to do something in the garden, offer to create a calendar event for them.',
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
};
